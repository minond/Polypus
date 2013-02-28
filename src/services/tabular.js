"use strict";

Polypus.Service("Tabular", function() {
	var ns = "__polypus_Tabular", link = localStorage, actions = {},
		win = Polypus.adjutor.uniq();

	this.on = function(key, action) {
		if (!(key in actions)) {
			actions[ key ] = [];
		}

		actions[ key ].push(action);
	};

	this.trigger = function(key, data) {
		link[ ns ] = JSON.stringify({
			time: Date.now(),
			data: data,
			key: key,
			win: win,
		});
	};

	// listen to triggers coming from other windows
	Polypus.eventuum.on("storage", function(storage) {
		var trigger;

		if (storage.key === ns) {
			trigger = JSON.parse(storage.newValue);

			// us or them?
			if (trigger && trigger.win !== win) {
				if (trigger.key in actions) {
					Polypus.adjutor.foreach(actions[ trigger.key ], function(i, action) {
						action.apply(null, trigger.data);
					});
				}
			}
		}
	});
});
