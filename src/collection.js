(function(global) {
	"use strict";

	var Collection;

	/**
	 * @param Model model
	 * @return Collection
	 */
	Collection = global.Collection = function Collection(model) {
		this.of = model;
		this.items = [];
	};

	/**
	 * @param Model
	 * @return boolean
	 */
	Collection.prototype.collects = function(what) {
		return what === this.of;
	};

	/**
	 * add an item
	 * @param ModelInstance instance
	 */
	Collection.prototype.add = function(instance) {
		if (instance instanceof this.of) {
			this.items.push(instance);
		}
		else {
			throw new Error("Invalid model type");
		}
	};

	/**
	 * @param midex Object|ModelInstance instance
	 * @param boolean return_instance
	 * @return mixed boolean|ModelInstance
	 */
	Collection.prototype.has = function(instance, return_instance) {
		var match = false;

		if (instance instanceof this.of) {
			for (var i = 0, len = this.items.length; i < len; i++) {
				if (this.items[ i ] === instance) {
					return return_instance ? this.items[ i ] : true;
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
					return return_instance ? this.items[ i ] : true;
				}
			}
		}

		return false;
	};

	/**
	 * @param mixed Object|ModelInstance instance
	 * @return mixed boolean|ModelInstance
	 */
	Collection.prototype.get = function(instance) {
		return this.has(instance, true);
	}
})(this);
