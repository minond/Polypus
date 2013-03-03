(function(Polypus) {
	"use strict";

	var adjutor;

	/**
	 * acts as a namespace
	 * @var object
	 */
	adjutor = Polypus.adjutor = {};

	/**
	 * for helper
	 * @param mixed object|array list
	 * @param function action
	 */
	adjutor.foreach = function(list, action) {
		if (list instanceof Array || list instanceof NodeList) {
			for (var i = 0, z = list.length; i < z; i++) {
				action(i, list[ i ]);
			}
		} else {
			for (var prop in list) {
				action(prop, list[ prop ]);
			}
		}
	};

	/**
	 * repeat an action a number of times
	 * @param int num
	 * @param function action
	 */
	adjutor.times = function(num, action) {
		for (var i = 0; i < num; i++) {
			action(i);
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
	 * conver a string into a node tree
	 * @param string str
	 * @return Node
	 */
	adjutor.as_node = function(str) {
		var el = document.createElement("div");
		el.innerHTML = str;
		return el.children[0];
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

	/**
	 * used by time_start and time_end
	 * @var object
	 */
	adjutor.time_cache = {};

	/**
	 * output time information
	 * @param string label
	 * @param int start
	 */
	adjutor.time_output = function(label, start) {
		var end = Date.now() - start;
		console.log("completed: ", label);
		console.log("total time: %os (%oms)", end / 1000, end);
	};

	/**
	 * time action
	 * @param string label
	 * @param function action
	 */
	adjutor.time = function(label, action) {
		var start = Date.now();
		action();
		this.time_output(start);
	};

	/**
	 * starts a timer
	 * @param string label
	 */
	adjutor.time_start = function(label) {
		this.time_cache[ label ] = Date.now();
	};

	/**
	 * ends a timer
	 * @param string label
	 */
	adjutor.time_end = function(label) {
		this.time_output(label, this.time_cache[ label ]);
	};

	/**
	 * find an object in any given parent object (ie, Window)
	 * @param string ns
	 * @param array path
	 */
	adjutor.find_object = function(ns, path) {
		var obj = ns;

		for (var i = 0, len = path.length; i < len; i++) {
			if (path[ i ] in obj) {
				obj = obj[ path[ i ] ];
			} else {
				return null;
			}
		}

		return obj;
	};
})(Polypus);
