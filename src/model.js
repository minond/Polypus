(function(ns) {
	"use strict";

	var Model, ModelEnumerableValue, adjutor, save_action, has_props, trigger,
		bind_standard_getter, bind_standard_setter, bind_enumerable_setter,
		bind_standard_function_call, bind_all_properties, trigger_action, extend,
		apply_all_properties, known_actions = [ "get", "set", "before", "after" ],
		special_functions = [ "__init__", "__redraw__" ];

	/**
	 * local copy
	 * @var object
	 */
	adjutor = ns.adjutor;

	/**
	 * @var ModelEnumerableValue
	 */
	ModelEnumerableValue = function() {};

	/**
	 * object property extensions
	 * @param object base
	 * @param object[]
	 */
	extend = function(base, addons) {
		adjutor.foreach(addons, function(i, addon) {
			for (var prop in addon) {
				if (!(prop in base)) {
					base[ prop ] = addon[ prop ];
				}
			}
		});
	};

	/**
	 * sets model values
	 * @param Model you
	 * @param object props
	 */
	apply_all_properties = function(you, props) {
		var prop, setter;

		if (props) {
			for (prop in props) {
				setter = "set_" + prop;
				if (you[ setter ] && you[ setter ] instanceof Function) {
					you[ setter ](props[ prop ]);
				}
			}
		}
	};

	/**
	 * binds a getter
	 * @param Model base
	 * @param string prop
	 * @param object observing
	 */
	bind_standard_getter = function(base, prop, observing) {
		base.prototype[ "get_" + prop ] = function () {
			trigger_action(["get", prop], [this, {
				__observing: observing,
				__self: this
			}]);

			return this[ prop ];
		};
	};

	/**
	 * binds a setter
	 * @param Model base
	 * @param string prop
	 * @param object observing
	 */
	bind_standard_setter = function(base, prop, observing) {
		base.prototype[ "set_" + prop ] = function (val) {
			this[ prop ] = val;
			trigger_action(["set", prop, val], [this, {
				__observing: observing,
				__self: this
			}]);
		};
	};

	/**
	 * binds a setter to an enum property
	 * @param Model base
	 * @param string prop
	 * @param object observing
	 */
	bind_enumerable_setter = function(base, prop, observing) {
		base.prototype[ "set_" + prop ] = function (val) {
			if (val in base[ prop ]) {
				this[ prop ] = val;

				trigger_action(["set", prop, val], [this, {
					__observing: observing,
					__self: this
				}])
			} else {
				throw new Error("Invalid value");
			}
		};
	};

	/**
	 * saves an observable function
	 * @param Model base
	 * @param string prop
	 * @param object props
	 * @param object observing
	 */
	bind_standard_function_call = function(base, prop, props, observing) {
		base.prototype[ prop ] = function () {
			var ret, args = Array.prototype.slice.call(arguments, 0);

			args.unshift(prop);
			args.unshift("before");
			trigger_action(args, [this, {
				__observing: observing,
				__self: this
			}]);

			args.shift();
			args.shift();
			ret = props[ prop ].apply(this, args);
			trigger_action(["after", prop, ret], [this, {
				__observing: observing,
				__self: this
			}]);

			return ret;
		};

		base.prototype[ prop ].valueOf = function() {
			return props[ prop ].valueOf();
		};

		base.prototype[ prop ].toString = function() {
			return props[ prop ].toString();
		};
	};

	/**
	 * @param Model base
	 * @param object props
	 * @param object observing
	 * @return Model
	 */
	bind_all_properties = function(base, props, observing) {
		var thisprop, prop;

		for (prop in props) {
			base.prop_list.all.push(prop);
			thisprop = props[ prop ];

			(function (prop, thisprop) {
				if (thisprop instanceof Function) {
					// public function
					if (special_functions.indexOf(prop) === -1) {
						base.prop_list.funcs.push(prop);
						bind_standard_function_call(base, prop, props, observing);
					}
				} else {
					base.prop_list.props.push(prop);
					if (thisprop instanceof ModelEnumerableValue) {
						// enum values
						base[ prop ] = thisprop;
						base.prototype[ prop ] = null;
						bind_enumerable_setter(base, prop, observing);
						bind_standard_getter(base, prop, observing);
					} else {
						// standard values
						base.prototype[ prop ] = thisprop;
						bind_standard_setter(base, prop, observing);
						bind_standard_getter(base, prop, observing);
					}
				}
			})(prop, thisprop);
		}

		return base;
	};

	/**
	 * stores an action in storage
	 * @param object storage
	 * @param string namespace
	 * @param string property
	 * @param function action
	 */
	save_action = function(storage, namespace, property, action) {
		if (known_actions.indexOf(namespace) === -1) {
			throw new Error("Unknown action \"" + namespace + "\"");
		}

		if (!(namespace in storage)) {
			storage[ namespace ] = {};
		}

		if (!(property in storage[ namespace ])) {
			storage[ namespace ][ property ] = [];
		}

		storage[ namespace ][ property ].push(action);
	};

	/**
	 * checks an object for all properties in question
	 * @param object storage
	 * @param array props
	 * @return boolean
	 */
	has_props = function(storage, props) {
		var check = storage, i, len;

		for (i = 0, len = props.length; i < len; i++) {
			if (props[ i ] in check) {
				check = check[ props[ i ] ];
			} else {
				return false;
			}
		}

		return true;
	};


	/**
	 * trigger all subscribers
	 * @param string namespace
	 * @param string property
	 */
	trigger = function (namespace, property) {
		var me = "__self" in this ? this.__self : this,
			args = Array.prototype.slice.call(arguments, 2);

		// instance property subscriber
		if (has_props(this.__observing, [ namespace, property ])) {
			adjutor.foreach(this.__observing[ namespace ][ property ], function (i, action) {
				action.apply(me, args);
			});
		}

		// instance namespace subscriber
		if (has_props(this.__observing, [ namespace, "*" ])) {
			adjutor.foreach(this.__observing[ namespace ][ "*" ], function (i, action) {
				action.apply(me, args);
			});
		}
	};

	/**
	 * trigger an action on a list of observers
	 * @param array args
	 * @param array instances
	 */
	trigger_action = function(args, instances) {
		for (var i = 0, len = instances.length; i < len; i++) {
			trigger.apply(instances[i], args);
		}
	};

	/**
	 * create a new model object. confi options:
	 * - mixin: ModelInstance[], add properties to base (new) Model
	 * @param object props
	 * @param object config
	 * @return ModelInstance
	 */
	Model = ns.Model = function Model(props, config) {
		var observing = {}, base, proto;

		if (!props) {
			props = {};
		}

		if (!config) {
			config = {};
		}

		/**
		 * model construcor
		 * @param props
		 */
		base = function ModelInstance(props) {
			this.__id = adjutor.uniq();
			this.__observing = {};
			apply_all_properties(this, props);
			base.__specials__.__init__.apply(this);
		};

		/**
		 * set a global subscriber
		 * @param string namespace
		 * @param string property
		 * @param function action
		 */
		base.observe = function(namespace, property, action) {
			save_action(observing, namespace, property, action);
		};

		/**
		 * set an instance subscriber
		 * @param mixed array|string namespace
		 * @param mixed array|string property
		 * @param function action
		 */
		base.prototype.observe = function(namespace, property, action) {
			var that = this;

			if (namespace instanceof Array) {
				adjutor.foreach(namespace, function(i, namespace) {
					that.observe(namespace, property, action);
				});
			} else if (property instanceof Array) {
				adjutor.foreach(property, function(i, property) {
					that.observe(namespace, property, action);
				});
			} else {
				save_action(this.__observing, namespace, property, action);
			}
		};

		/**
		 * property setter
		 * @param string prop
		 * @param mixed val
		 * @return mixed
		 */
		base.prototype.set = function(prop, val) {
			return this[ "set_" + prop ](val);
		};

		/**
		 * property getter
		 * @param string prop
		 * @return mixed
		 */
		base.prototype.get = function(prop) {
			return this[ "get_" + prop ]();
		};

		/**
		 * returns a plain object with all the model's properties
		 * @return object
		 */
		base.prototype.raw = function() {
			var that = this, raw = {};
			adjutor.foreach(this.constructor.prop_list.props, function(i, prop) {
				raw[ prop ] = that[ prop ];
			});
			return raw;
		};

		/**
		 * @return ModelInstance
		 */
		base.prototype.clone = function() {
			return new base(this.raw());
		};

		/**
		 * return new model of different type with current model's data
		 * @param ModelInstance
		 * @return ModelInstance
		 */
		base.prototype.cast = function(to) {
			return new to(this.raw());
		};

		// trait/mixins
		if (config.mixin) {
			extend(props, config.mixin.map(function(model) {
				return model.prop_list.raw;
			}));
		}

		/**
		 * reference to model properties
		 * @see bind_all_properties
		 * @var string[]
		 */
		base.prop_list = {
			props: [],
			funcs: [],
			all: [],
			raw: props
		};

		// special funcitons
		base.__specials__ = {};
		adjutor.foreach(special_functions, function(i, func) {
			base.__specials__[ func ] = func in props ?
				props[ func ] : new Function;
		});

		// yeah...
		bind_all_properties(base, props, observing);

		// configuration
		if (config.autoinit) {
			base[ config.autoinit ] = new base;
		}

		return config.singleton ? new base : base;
	};

	/**
	 * @param mixed list*
	 * @return ModelEnumerableValue
	 */
	Model.enum = function(list) {
		var options = new ModelEnumerableValue, i, len;

		for (i = 0, len = arguments.length; i < len; i++) {
			options[ arguments[ i ] ] = arguments[ i ];
		}

		return options;
	};

	/**
	 * for testing
	 */
	Model.api = {
		save_action: save_action,
		has_props: has_props,
		trigger: trigger,
		bind_standard_getter: bind_standard_getter,
		bind_standard_setter: bind_standard_setter,
		bind_enumerable_setter: bind_enumerable_setter,
		bind_standard_function_call: bind_standard_function_call,
		bind_all_properties: bind_all_properties,

		// not tested:
		extend: extend,
		trigger_action: trigger_action,
		apply_all_properties: apply_all_properties
	};
})(Polypus);
