(function(ns) {
	"use strict";

	var adjutor;

	/**
	 * acts as a namespace
	 * @var object
	 */
	adjutor = ns.adjutor = {};

	/**
	 * for helper
	 * @param mixed object|array list
	 * @param function action
	 */
	adjutor.foreach = function(list, action) {
		if (list instanceof Array) {
			for (var prop in list) {
				action(prop, list[ prop ]);
			}
		} else {
			for (var i = 0, z = list.length; i < z; i++) {
				action(i, list[ i ]);
			}
		}
	};

	/**
	 * @param mixed needle
	 * @param array haystack
	 * @return boolean
	 */
	adjutor.in_array = function(needle, haystack) {
		return haystack.indexOf(needle) !== -1;
	};

	/**
	 * generate a random id
	 * @return string
	 */
	adjutor.uniq = function() {
		return Math.random().toString().substr(3, 10) + Date.now();
	};

	/**
	 * query checker
	 * @param Node el
	 * @param string selector
	 * @return boolean
	 */
	adjutor.is = function(el, selector) {
		if (el.webkitMatchesSelector) {
			return el.webkitMatchesSelector(selector);
		} else if (el.mozMatchesSelector) {
			return el.mozMatchesSelector(selector);
		}
	};

	/**
	 * return array of funciton argument's names
	 * @param Function func
	 * @return array
	 */
	adjutor.parse_function_arguments = function(func) {
		return func.toString()
			.match(/\((.{0,}?)\)/)[1]
			.split(",")
			.filter(function(arg) { return !!arg; })
			.map(function(arg) { return arg.trim(); });
	};

	/**
	 * convert a data property to a dataset property. ie:
	 * data-model-id = dataset.modelId
	 * @param string data
	 * @return string
	 */
	adjutor.data2prop = function(data) {
		return data
			// remove "data-" prefix
			.replace(/^data-/, "")
			// apply camel case
			.replace(/((\w?)-)(\w)/g, function(whole, dash, prev, ch) {
				return prev + ch.toUpperCase();
			});
	};

	/**
	 * convert a dataset property to a data property. ie:
	 * dataset.modelId = data-model-id
	 * @param string prop
	 * @return string
	 */
	adjutor.prop2data = function(prop) {
		return "data-" + prop
			.replace(/([A-Z])/g, function($1) {
				return "-" + $1.toLowerCase();
			});
	};

	/**
	 * window.onload helper, returns success
	 * @param Function action
	 * @return boolean
	 */
	adjutor.onload = function(action) {
		var bound = false;

		if (window && window.addEventListener) {
			window.addEventListener("load", action);
			bound = true;
		}

		return bound;
	};

	/**
	 * "dataset" helper
	 * @param Node node
	 * @param string key
	 * @param mixed value
	 */
	adjutor.dataset = (function() {
		var cache = {};

		return function(node, key, value) {
			var val, hash = node.dataset.sethash;

			if (value !== undefined) {
				// set
				if (!hash) {
					hash = adjutor.uniq();
					cache[ hash ] = {};
					node.dataset.sethash = hash;
				}

				val = cache[ hash ][ key ] = value;
			} else if (hash) {
				// get
				if (key === null) {
					val = cache[ hash ];
				} else {
					val = cache[ hash ][ key ];
				}
			}

			return val
		};
	})();
})(Polypus);
