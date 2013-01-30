(function(global) {
	"use strict";

	var Model, ModelEnumerableValue, save_action, has_props, foreach, trigger, gen_id;

	/**
	 * generate a random id
	 * @return string
	 */
	gen_id = function() {
		return Math.random().toString().substr(3, 10) + Date.now();
	};

	/**
	 * stores an action in storage
	 * @param object storage
	 * @param string namespace
	 * @param string property
	 * @param function action
	 */
	save_action = function(storage, namespace, property, action) {
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
		var observing = {}, all = [], base;

		/**
		 * model construcor
		 * @param props
		 */
		base = function ModelInstance(props) {
			var setter;
			this.observing = {};

			if (props) {
				for (var prop in props) {
					setter = "set_" + prop;
					if (this[ setter ] && this[ setter ] instanceof Function) {
						this[ setter ](props[ prop ]);
					}
				}
			}

			this.__id = gen_id();
			all.push(this);
		};

		/**
		 * models track all of their instances. this returns an array to all
		 * created instances so far
		 * @return ModelInstance[]
		 */
		base.all = function() {
			return all;
		};

		/**
		 * model instance search
		 * @param string id
		 * @return ModelInstance
		 */
		base.id = function(id) {
			for (var i = 0, len = all.length; i < len; i++) {
				if (all[ i ].__id === id) {
					return all[ i ];
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

		for (var prop in props) {
			var thisprop = props[ prop ];

			(function (prop, thisprop) {
				if (thisprop instanceof Function) {
					// public function
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
				} else {
					if (props[ prop ] instanceof ModelEnumerableValue) {
						// value
						base[ prop ] = props[ prop ];
						base.prototype[ prop ] = null;

						// setter
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

						// getter
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
					} else {
						// value
						base.prototype[ prop ] = props[ prop ];

						// setter
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

						// getter
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
					}
				}
			})(prop, thisprop);
		}

		return base;
	};

	/**
	 * @var ModelEnumerableValue
	 */
	ModelEnumerableValue = function() {};

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
})(this);
