(function(global) {
	"use strict";

	var Collection, generate_search_functions, known_actions;

	known_actions = [ "add", "new", "change" ];

	/**
	 * @param Collection collection
	 * @param Model model
	 */
	generate_search_functions = function(collection, model) {
		for (var i = 0, len = model.prop_list.length; i < len; i++) {
			(function(prop) {
				collection[ "get_by_" + prop ] = function(val) {
					var search = {};
					search[ prop ] = val;
					return collection.get(search);
				};

				collection[ "find_by_" + prop ] = function(val) {
					var search = {};
					search[ prop ] = val;
					return collection.find(search);
				};
			})(model.prop_list[ i ]);
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
		generate_search_functions(this, model);
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
		this.trigger("new", instance);
		this.add(instance);
		return instance;
	};

	/**
	 * add an item
	 * @param ModelInstance instance
	 */
	Collection.prototype.add = function(instance) {
		var that = this;

		if (!(instance instanceof this.of)) {
			throw new Error("Invalid model type");
		}

		this.items.push(instance);
		this.trigger("add", instance);

		// bind listeners
		instance.observe("set", "*", function() {
			that.trigger("change", [ this ]);
		});
	};

	/**
	 * @param midex Object|ModelInstance instance
	 * @return mixed boolean
	 */
	Collection.prototype.has = function(instance) {
		return !!this.get(instance);
	};

	/**
	 * @param mixed Object|ModelInstance instance
	 * @return ModelInstance
	 */
	Collection.prototype.get = function(instance) {
		return this.find(instance)[0];
	};

	/**
	 * @param mixed Object|ModelInstance instance
	 * @return ModelInstance[]
	 */
	Collection.prototype.find = function(instance) {
		var match = false, matches = [];

		if (instance instanceof this.of) {
			for (var i = 0, len = this.items.length; i < len; i++) {
				if (this.items[ i ] === instance) {
					matches.push(this.items[ i ]);
				}
			}
		}
		else if (instance instanceof Object) {
			for (var i = 0, len = this.items.length; i < len; i++) {
				match = true;

				for (var prop in instance) {
					if (instance[ prop ] !== this.items[ i ][ prop ]) {
						match = false;
						break;
					}
				}

				if (match) {
					matches.push(this.items[ i ]);
				}
			}
		}

		return matches;
	};

	/**
	 * @param string id
	 * @return mixed boolean|ModelInstance
	 */
	Collection.prototype.get_by_id = function(id) {
		return this.get({ __id: id });
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

	/**
	 * event trigger
	 * @param string what
	 * @param array args
	 */
	Collection.prototype.trigger = function(what, args) {
		var events;

		if (what in this.events) {
			events = this.events[ what ];

			for (var i = 0, len = events.length; i < len; i++) {
				events[ i ].apply(this, args || []);
			}
		}
	};
})(this);
