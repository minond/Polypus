"use strict";

Polypus.Service("Persist", function() {
	var ns = "__polypus_Persist", link = localStorage,
		cache = ns in link ? JSON.parse(link[ns]) : {};

	this.has = function(key) {
		return key in cache;
	};

	this.get = function(key) {
		return cache[ key ].val;
	};

	this.set = function(key, val) {
		cache[ key ] = { val: val };
		cache.__last_update = key;
		this.save();
		return val;
	};

	this.save = function() {
		link[ ns ] = JSON.stringify(cache);
	};

	// catch updates made in other tabs
	Polypus.eventuum.on("storage", function(storage) {
		var update = JSON.parse(storage.newValue), key;

		if (update && update.__last_update) {
			key = update.__last_update;
			cache[ key ] = update[ key ];
		}
	});
});
