(function(ns) {
	"use strict";

	var eventuum, adjutor;

	/**
	 * local copy
	 * @var object
	 */
	adjutor = ns.adjutor;

	/**
	 * just acts as a namespace
	 * @var object
	 */
	eventuum = ns.eventuum = {};

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
		return adjutor.in_array(evname, ["unload", "load"]);
	};

	/**
	 * bind any event
	 * @param string eventname
	 * @param string selector
	 * @param function action
	 */
	eventuum.on = function(eventname, selector, action) {
		var that = this;

		if (this.is_window_event(eventname)) {
			if (window && window.addEventListener) {
				window.addEventListener(eventname, selector);
			}
		} else {
			if (!(eventname in this.bound)) {
				eventuum.config.bind.to.addEventListener(eventname, function(ev) {
					var max = 200, el = ev.target;

					// simulate bubbling
					while (el && el !== document.body && max) {
						max--;
						that.trigger(eventname, el, ev);
						el = el.parentNode;
					}
				});

				this.bound[ eventname ] = [];
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
})(Polypus);
