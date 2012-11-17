var Model = function (props) {
	var observing = {}, base;
	
	/**
	 * model construcor
	 */
	base = function ModelInstance () {
		this.observing = {};
	};

	/**
	 * set a global subscriber
	 * @param string namespace
	 * @param string property
	 * @param function action
	 */
	base.observe = function (namespace, property, action) {
		save_action(observing, namespace, property, action);
	};

	/**
	 * set an instance subscriber
	 * @param string namespace
	 * @param string property
	 * @param function action
	 */
	base.prototype.observe = function (namespace, property, action) {
		save_action(this.observing, namespace, property, action);
	};

	for (var prop in props) {
		var thisprop = props[ prop ];

		(function (prop, thisprop) {
			if (thisprop instanceof Function) {
				// public function
				base.prototype[ prop ] = function () {
					var ret, args = Array.prototype.slice.call(arguments, 0);
					args.unshift(prop);
					args.unshift("before");
					trigger.apply(this, args);
					args.shift();
					args.shift();
					ret = props[ prop ].apply(this, args);
					trigger.apply(this, ["after", prop, ret]);
					return ret;
				};
			}
			else {
				// value
				base.prototype[ prop ] = props[ prop ];

				// setter
				base.prototype[ "set_" + prop ] = function (val) {
					this[ prop ] = val;
					trigger.apply(this, ["set", prop, val]);
				};

				// getter
				base.prototype[ "get_" + prop ] = function () {
					trigger.apply(this, ["get", prop]);
					return this[ prop ];
				};
			}
		})(prop, thisprop);
	}

	/**
	 * stores an action in storage
	 * @param object storage
	 * @param string namespace
	 * @param string property
	 * @param function action
	 */
	var save_action = function (storage, namespace, property, action) {
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
	var has_props = function (storage, props) {
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
	var foreach = function (list, action) {
		for (var i = 0, z = list.length; i < z; i++) {
			action(i, list[ i ]);
		}
	};

	/**
	 * trigger all subscribers
	 * @param string namespace
	 * @param string property
	 */
	var trigger = function (namespace, property) {
		var me = this, args = Array.prototype.slice.call(arguments, 2);

		if (has_props(this.observing, [ namespace, property ])) {
			foreach(this.observing[ namespace ][ property ], function (i, action) {
				action.apply(me, args);
			});
		}

		if (has_props(this.observing, [ namespace, "*" ])) {
			foreach(this.observing[ namespace ][ "*" ], function (i, action) {
				action.apply(me, args);
			});
		}

		if (has_props(observing, [ namespace, property ])) {
			foreach(observing[ namespace ][ property ], function (i, action) {
				action.apply(me, args);
			});
		}

		if (has_props(observing, [ namespace, "*" ])) {
			foreach(observing[ namespace ][ "*" ], function (i, action) {
				action.apply(me, args);
			});
		}
	};

	return base;
};
