(function(Polypus) {
	"use strict";

	var eventuum, adjutor, loaded;

	/**
	 * local copy
	 * @var object
	 */
	adjutor = Polypus.adjutor;

	/**
	 * just acts as a namespace
	 * @var object
	 */
	eventuum = Polypus.eventuum = {};

	/**
	 * event cache
	 * @var object
	 */
	eventuum.bound = {};

	/**
	 * trigger an event
	 * @param string eventname
	 * @param Node node
	 * @param Event event
	 */
	eventuum.trigger = function(eventname, node, event) {
		var ev, i, len;

		if (eventname in this.bound) {
			for (i = 0, len = this.bound[ eventname ].length; i < len; i++) {
				ev = this.bound[ eventname ][ i ];

				if (adjutor.is(node, ev.selector)) {
					ev.action.call(node, event);
				}
			}
		}
	};

	/**
	 * @param string evname
	 * @return boolean
	 */
	eventuum.is_window_event = function(evname) {
		return adjutor.in_array(evname, ["unload", "load", "storage"]);
	};

	/**
	 * bind any event
	 * @param string eventname
	 * @param string selector
	 * @param function action
	 * @param Node bindto
	 */
	eventuum.on = function(eventname, selector, action, bindto) {
		var that = this;

		if (this.is_window_event(eventname)) {
			if (window && window.addEventListener) {
				if (!action) {
					action = selector;
				}

				if (loaded && eventname === "load") {
					action.call(window);
				}
				else {
					window.addEventListener(eventname, action);
				}
			}
		} else {
			if (!(eventname in this.bound) || bindto) {
				(bindto || eventuum.config.bind.to).addEventListener(eventname, function(ev) {
					var max = 200, el = ev.target;

					// simulate bubbling
					while (el && el !== document.body && max) {
						max--;
						that.trigger(eventname, el, ev);
						el = el.parentNode;
					}
				});

				if (!bindto) {
					this.bound[ eventname ] = [];
				}
			}

			this.bound[ eventname ].push({
				selector: selector,
				action: action
			});
		}
	};

	/**
	 * self.on(click) shortcut
	 * @param string selector
	 * @param function action
	 */
	eventuum.click = function(selector, action) {
		this.on("click", selector, action);
	};

	/**
	 * self.on(change) shortcut
	 * @param string selector
	 * @param function action
	 */
	eventuum.change = function(selector, action) {
		this.on("change", selector, action);
	};

	/**
	 * self.on(input) shortcut
	 * @param string selector
	 * @param function action
	 */
	eventuum.input = function(selector, action) {
		this.on("input", selector, action);
	};

	/**
	 * self.on(load) shortcut
	 * @param function action
	 */
	eventuum.load = function(action) {
		this.on("load", action, null);
	};

	/**
	 * self.on(unload) shortcut
	 * @param function action
	 */
	eventuum.unload = function(action) {
		this.on("unload", action, null);
	};

	/**
	 * defaults
	 * @var object
	 */
	eventuum.config = {
		bind: {
			to: document
		}
	};

	eventuum.load(function() {
		loaded = true;
	});
})(Polypus);
