"use strict";

Polypus.Service("Persist", function() {
	var ns = "__polypus_Persist", link = localStorage,
		cache = ns in link ? JSON.parse(link[ns]) : {};

	/**
	 * @param string key
	 * @return boolean
	 */
	this.has = function(key) {
		return key in cache;
	};

	/**
	 * @param string key
	 * @return mixed
	 */
	this.get = function(key) {
		return cache[ key ].val;
	};

	/**
	 * @param string key
	 * @param mixed val
	 */
	this.set = function(key, val) {
		cache[ key ] = { val: val };
		cache.__last_update = key;
		link[ ns ] = JSON.stringify(cache);
		return val;
	};

	// catch updates made in other tabs
	Polypus.eventuum.on("storage", function(storage) {
		var update, key;

		if (storage.key === ns) {
		update = JSON.parse(storage.newValue);

			if (update && update.__last_update) {
				key = update.__last_update;
				cache[ key ] = update[ key ];
			}
		}
	});
});
