(function(ns) {
	"use strict";

	var Controller, parse_event_string, remove_ui_events, add_ui_events,
		adjutor, eventuum;

	/**
	 * local copy
	 * @var object
	 */
	adjutor = ns.adjutor;

	/**
	 * local copy
	 * @var object
	 */
	eventuum = ns.eventuum;

	/**
	 * parse inforamation from a controller's event object string
	 * @param str
	 * @return obj
	 */
	parse_event_string = function(str) {
		var space = str.indexOf(" ");
		return {
			eventname: str.substr(0, space),
			selector: str.substr(space + 1)
		};
	};

	/**
	 * bind ui methods
	 * @param ApplicationController app
	 * @param object methods
	 */
	remove_ui_events = function(app, methods) {
	};

	/**
	 * unbind ui methods
	 * @param ApplicationController app
	 * @param object methods
	 */
	add_ui_events = function(app, methods) {
		adjutor.foreach(methods, function(eventinfo, action) {
			var evinfo = parse_event_string(eventinfo);
			eventuum.on(evinfo.eventname, evinfo.selector, function(ev) {
				action.call(app, ev, this);
			});
		});
	};

	/**
	 * create a new application controller
	 * @param object proto
	 * @param object ui
	 */
	Controller = ns.Controller = function ApplicationController(proto, ui) {
		var Instance = function() {}, instance;

		Instance.prototype = proto;

		Instance.prototype.destroy = function() {
			remove_ui_events(this, ui);
		};

		Instance.prototype.load = function() {
			add_ui_events(this, ui);
		};

		instance = new Instance;
		instance.load();
		return instance;
	};

	/**
	 * configuration items
	 * @var object
	 */
	Controller.config = {
		bind: {
			ui: {
				auto: true
			}
		}
	};

	/**
	 * for testing
	 * @var object
	 */
	Controller.api = {
		parse_event_string: parse_event_string
	};
})(Polypus);
