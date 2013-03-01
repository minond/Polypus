"use strict";

Polypus.Service("Sync", function($Tabular) {
	var cache = {}, win = Polypus.adjutor.uniq(),
		evname = "__polypus_Sync";

	/**
	 * @param ModelInstance collection
	 */
	this.synchronize = function(model) {
		cache[ model.__id ] = {
			model: model,
			synching: false
		};

		model.observe("set", "*", function(prop, val) {
			var me = cache[ this.__id ];

			if (!me.synching) {
				me.synching = true;
				$Tabular.trigger(evname, [{
					win: win,
					mid: this.__id,
					val: val,
					prop: prop,
					time: Date.now()
				}]);
				me.synching = false;
			}
		});
	};

	$Tabular.on(evname, function(update) {
		var me;

		if (update.win !== win) {
			if (update.mid in cache) {
				me = cache[ update.mid ];

				if (!me.synching) {
					me.synching = true;
					me.model.set(update.prop, update.val);
					me.synching = false;
				}
			}
		}
	});
});
