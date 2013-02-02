(function(global) {
	"use strict";

	var Model, ModelEnumerableValue, save_action, has_props, foreach, trigger,
		gen_id, bind_standard_getter, bind_standard_setter, bind_enumerable_setter,
		bind_standard_function_call, bind_all_properties, known_actions;

	known_actions = [ "get", "set", "before", "after" ];

	/**
	 * @var ModelEnumerableValue
	 */
	ModelEnumerableValue = function() {};

	/**
	 * generate a random id
	 * @return string
	 */
	gen_id = function() {
		return Math.random().toString().substr(3, 10) + Date.now();
	};

	/**
	 * binds a getter
	 * @param Model base
	 * @param string prop
	 * @param object observing
	 */
	bind_standard_getter = function(base, prop, observing) {
		base.prototype[ "get_" + prop ] = function () {
			// instance
			trigger.apply(this, ["get", prop]);

			// global
			trigger.apply({
				observing: observing,
				__self: this
			}, ["get", prop]);

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

			// instance
			trigger.apply(this, ["set", prop, val]);

			// global
			trigger.apply({
				observing: observing,
				__self: this
			}, ["set", prop, val]);
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

				// instance
				trigger.apply(this, ["set", prop, val]);

				// global
				trigger.apply({
					observing: observing,
					__self: this
				}, ["set", prop, val]);
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
			var ret,
				args = Array.prototype.slice.call(arguments, 0);

			args.unshift(prop);
			args.unshift("before");

			// instance
			trigger.apply(this, args);

			// global
			trigger.apply({
				observing: observing,
				__self: this
			}, args);

			args.shift();
			args.shift();
			ret = props[ prop ].apply(this, args);

			// instance
			trigger.apply(this, ["after", prop, ret]);

			// global
			trigger.apply({
				observing: observing,
				__self: this
			}, ["after", prop, ret]);

			return ret;
		};
	};

	/**
	 * @param Model base
	 * @param object props
	 * @param object observing
	 * @return Model
	 */
	bind_all_properties = function(base, props, observing) {
		var thisprop;

		for (var prop in props) {
			base.prop_list.push(prop);
			thisprop = props[ prop ];

			(function (prop, thisprop) {
				if (thisprop instanceof Function) {
					// public function
					bind_standard_function_call(base, prop, props, observing);
				} else {
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
		var check = storage;

		for (var i = 0, len = props.length; i < len; i++) {
			if (props[ i ] in check) {
				check = check[ props[ i ] ];
			}
			else {
				return false;
			}
		}

		return true;
	};

	/**
	 * for helper
	 * @param array list
	 * @param function action
	 */
	foreach = function(list, action) {
		for (var i = 0, z = list.length; i < z; i++) {
			action(i, list[ i ]);
		}
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
		if (has_props(this.observing, [ namespace, property ])) {
			foreach(this.observing[ namespace ][ property ], function (i, action) {
				action.apply(me, args);
			});
		}

		// instance namespace subscriber
		if (has_props(this.observing, [ namespace, "*" ])) {
			foreach(this.observing[ namespace ][ "*" ], function (i, action) {
				action.apply(me, args);
			});
		}
	};

	/**
	 * create a new model object
	 * @param object props
	 * @return ModelInstance
	 */
	Model = global.Model = function Model(props) {
		var observing = {}, base;

		/**
		 * model construcor
		 * @param props
		 */
		base = function ModelInstance(props) {
			var setter;

			this.observing = {};
			this.__id = gen_id();

			if (props) {
				for (var prop in props) {
					setter = "set_" + prop;
					if (this[ setter ] && this[ setter ] instanceof Function) {
						this[ setter ](props[ prop ]);
					}
				}
			}
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
		 * @param string namespace
		 * @param string property
		 * @param function action
		 */
		base.prototype.observe = function(namespace, property, action) {
			save_action(this.observing, namespace, property, action);
		};

		/**
		 * reference to model properties
		 * @var string[]
		 */
		base.prop_list = [];

		return bind_all_properties(base, props, observing);
	};

	/**
	 * @param mixed list*
	 * @return ModelEnumerableValue
	 */
	Model.enum = function(list) {
		var options = new ModelEnumerableValue;

		for (var i = 0, len = arguments.length; i < len; i++) {
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
		foreach: foreach,
		trigger: trigger,
		gen_id: gen_id,
		bind_standard_getter: bind_standard_getter,
		bind_standard_setter: bind_standard_setter,
		bind_enumerable_setter: bind_enumerable_setter,
		bind_standard_function_call: bind_standard_function_call,
		bind_all_properties: bind_all_properties
	};
})(this);
