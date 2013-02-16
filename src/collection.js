(function(global) {
	"use strict";

	var Collection, generate_search_function, trigger,
		known_actions = [ "add", "new", "change", "remove" ];

	/**
	 * @param Collection collection
	 * @param Model model
	 */
	generate_search_function = function(collection, model, func, prefix) {
		for (var i = 0, len = model.prop_list.props.length; i < len; i++) {
			(function(prop) {
				collection[ prefix + prop ] = function(val) {
					var search = {};
					search[ prop ] = val;
					return collection[ func ](search);
				};
			})(model.prop_list.props[ i ]);
		}
	};

	/**
	 * @param Model instance
	 * @param string action
	 * @param array args
	 */
	trigger = function(instance, action, args) {
		var events, i, len;

		if (action in instance.events) {
			events = instance.events[ action ];

			for (i = 0, len = events.length; i < len; i++) {
				events[ i ].apply(instance, args || []);
			}
		}
	};

	/**
	 * @param Model model
	 * @return Collection
	 */
	Collection = global.Collection = function Collection(model) {
		this.of = model;
		this.items = [];
		this.events = [];
		generate_search_function(this, model, "get", "get_by_");
		generate_search_function(this, model, "find", "find_by_");
	};

	/**
	 * @param Model
	 * @return boolean
	 */
	Collection.prototype.collects = function(what) {
		return what === this.of;
	};

	/**
	 * @param object props
	 * @return Model
	 */
	Collection.prototype.create = function(props) {
		var instance = new this.of(props);
		trigger(this, "new", [instance]);
		this.add(instance);
		return instance;
	};

	/**
	 * add an item. returns true if instance was successfully added
	 * @param ModelInstance instance
	 * @param boolean allow_duplicate
	 * @return boolean
	 */
	Collection.prototype.add = function(instance, allow_duplicate) {
		var that = this, added = false;

		if (!(instance instanceof this.of)) {
			throw new Error("Invalid model type");
		}

		if (allow_duplicate || !this.has(instance)) {
			added = true;
			this.items.push(instance);
			trigger(this, "add", [instance]);

			// bind listeners
			instance.observe("set", "*", function() {
				trigger(that, "change", [this]);
			});
		}

		return added;
	};

	/**
	 * @param mixed Object|ModelInstance instance
	 * @return mixed boolean
	 */
	Collection.prototype.has = function(instance) {
		return !!this.get(instance);
	};

	/**
	 * removes an item from the list. returns true if something was removed.
	 * @param midex Object|ModelInstance instance
	 * @return boolean
	 */
	Collection.prototype.remove = function(instance) {
		var removed = false, orig_len = this.items.length;
		instance = this.get(instance);

		this.items = this.items.filter(function(item) {
			return item !== instance;
		});

		if (orig_len !== this.items.length) {
			removed = true;
			trigger(this, "remove");
		}

		return removed;
	};

	/**
	 * @param mixed Object|ModelInstance instance
	 * @return ModelInstance
	 */
	Collection.prototype.get = function(instance) {
		return this.find(instance)[0];
	};

	/**
	 * @param string id
	 * @return ModelInstance
	 */
	Collection.prototype.get_by_id = function(id) {
		return this.get({ __id: id });
	};

	/**
	 * @param mixed Object|ModelInstance instance
	 * @return ModelInstance[]
	 */
	Collection.prototype.find = function(instance) {
		var match = false, matches = [], i, len, prop;

		if (instance instanceof this.of) {
			for (i = 0, len = this.items.length; i < len; i++) {
				if (this.items[ i ] === instance) {
					matches.push(this.items[ i ]);
				}
			}
		} else if (instance instanceof Object) {
			for (i = 0, len = this.items.length; i < len; i++) {
				match = true;

				for (prop in instance) {
					if (instance[ prop ] !== this.items[ i ][ prop ]) {
						match = false;
						break;
					}
				}

				if (match) {
					matches.push(this.items[ i ]);
				}
			}
		} else {
			throw new Error("Invalid search parameter");
		}

		return matches;
	};

	/**
	 * even listener
	 * @param string what
	 * @param function action
	 */
	Collection.prototype.observe = function(what, action) {
		if (known_actions.indexOf(what) === -1) {
			throw new Error("Unknown action \"" + what + "\"");
		}

		if (!(what in this.events)) {
			this.events[ what ] = [];
		}

		this.events[ what ].push(action);
	};
})(this);
