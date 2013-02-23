(function(global) {
	"use strict";

	var autobinding;

	/**
	 * acts as a namespace
	 * @var array
	 */
	autobinding = {};

	/**
	 * binds all elements in a document section
	 * @param Node el
	 */
	autobinding.bind_all_in = function(el) {
	};

	/**
	 * auto binding configuration
	 * @var object
	 */
	autobinding.config = {
		load: {
			auto: true,
			from: document
		},
		props: {
			bind: {
				model: "data-bindto-model"
			}
		}
	};

	// auto load, wait for document
	if (window && window.addEventListener) {
		window.addEventListener("load", function() {
			if (autobinding.config.load.auto) {
				autobinding.bind_all_in(autobinding.config.load.from);
			}
		});
	}
})(this);
