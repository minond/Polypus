"use strict";

Polypus.Service("Persist", function() {
	var ns = "__polypus_Persist", link = localStorage, that = this, cache;

	/**
	 * stores all elements
	 * @var object
	 */
	this.cache = cache = ns in link ? JSON.parse(link[ns]) : {};

	/**
	 * update handlers
	 * @var array
	 */
	this.handler = [];

	/**
	 * clears local storage and internal cache
	 */
	this.clear = function() {
		link.clear();
		this.cache = cache = {};
	};

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
		return cache[ key ] ? cache[ key ].val : null;
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

	/**
	 * persist a collection's models
	 * @param string key
	 * @param Collection coll
	 * @param Service.Tabular $Tabular
	 * @param Service.Sync $Sync
	 */
	this.collection = function(key, coll, $Tabular, $Sync) {
		var models, hash = "local_collection_" + key;

		// do we have any models for this collection?
		if (this.has(hash)) {
			models = this.get(hash);
			Polypus.adjutor.foreach(models, function(i, model) {
				$Sync.synchronize(coll.create(model));
			});
		} else {
			this.set(hash, []);
		}

		// listen to updates from other tabs
		$Tabular.on(hash, function(model) {
			console.log(model);
			// duplicate?
			if (!coll.get_by_id(model.__id)) {
				coll.create(model);
			}
		});

		// listen to any future additions
		coll.observe("add", function(model) {
			var in_cache = false, models = that.get(hash);

			Polypus.adjutor.foreach(models, function(i, m) {
				if (m.__id === model.__id) {
					in_cache = true;
				}
			});

			// already in cache?
			if (!in_cache) {
				models.push(model.raw(true));
				that.set(hash, models);
			}

			$Sync.synchronize(model);
			$Tabular.trigger(hash, [ model.raw(true) ]);
		});

		// listen to any future changes
		coll.observe("change", function(model) {
			var models = that.get(hash);

			// should already be in our cache
			Polypus.adjutor.foreach(models, function(i, m) {
				if (m.__id === model.__id) {
					models[ i ] = model.raw();
				}
			});

			that.set(hash, models);
		});
	};

	// catch updates made in other tabs
	Polypus.eventuum.on("storage", function(storage) {
		var update, key;

		if (storage.key === ns) {
		update = JSON.parse(storage.newValue);

			if (update && update.__last_update) {
				key = update.__last_update;
				Polypus.adjutor.foreach(that.handler, function(i, handler) {
					handler.call(that, key, update);
				});
			}
		}
	});

	// add the standard setter handler
	this.handler.push(function(key, update) {
		this.cache[ key ] = update[ key ];
	});
});
