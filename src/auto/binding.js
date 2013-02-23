(function(global) {
	"use strict";

	var binding, foreach, eventuum;

	/**
	 * local copy of eventuum
	 * @var object
	 */
	eventuum = global.eventuum;

	/**
	 * for helper
	 * @param array list
	 * @param function action
	 */
	foreach = function(list, action) {
		for (var i = 0, z = list.length; i < z; i++) {
			action(i, list[ i ]);
		}
	};

	/**
	 * acts as a namespace
	 * @var array
	 */
	binding = global.Template.config.load.binding = {};

	/**
	 * convert a data property to a dataset property. ie:
	 * data-model-id = dataset.modelId
	 * @param string data
	 * @return string
	 */
	binding.data2prop = function(data) {
		return data
			// remove "data-" prefix
			.replace(/^data-/, "")
			// apply camel case
			.replace(/((\w?)-)(\w)/g, function(whole, dash, prev, ch) {
				return prev + ch.toUpperCase();
			});
	};

	/**
	 * bind to string parses
	 * @var object
	 */
	binding.parse_bind_string = {
		/**
		 * parse model binding string (ie. "Clipper:name" => { model: Clipper,
		 * prop: name, name: "Clipperj })
		 * @param string str
		 * @return object
		 */
		model_info: function(str) {
			var parts = str.split(":");
			return {
				prop: parts[1],
				name: parts[0],
				model: global[ parts[0] ],
				raw: str
			};
		}
	}

	/**
	 * selector generators
	 * @var object
	 */
	binding.generate_selector = {
		/**
		 * by existing property (ie. data-click => *[data-click])
		 * @param string elem
		 * @param string prop
		 * @return string
		 */
		by_prop: function(elem, prop) {
			return elem + "[" + prop + "]";
		}
	};

	/**
	 * @param Node el
	 * @param string propname
	 */
	binding.bind_models_in = function(el, propname) {
		var node, selector, info, that = this;

		foreach(el.querySelectorAll(
			this.generate_selector.by_prop("*", propname)), function(i, el)
		{
			node = el.nodeName.toLowerCase();
			selector = that.generate_selector.by_prop(node, propname);
			info = that.parse_bind_string.model_info(
				el.dataset[ that.data2prop(propname) ]);

			// input value updates
			eventuum.input(selector, function() {
				if (this.value !== info.model[ info.prop ]) {
					info.model.set(info.prop, this.value);
				}
			});

			// model updates
			info.model.observe("set", info.prop, function(value) {
				if (value !== el.value) {
					el.value = value;
				}
			});

			// initial value
			el.value = info.model[ info.prop ];
		});
	};

	/**
	 * binds all elements in a document section
	 * @param Node el
	 */
	binding.bind_all_in = function(el) {
		var prop, name, propname, propnames;

		for (prop in this.config.props) {
			propnames = this.config.props[ prop ];

			switch (propnames) {
				case this.config.props.bind:
					for (name in propnames) {
						propname = propnames[ name ];

						switch (propname) {
							case propnames.model:
								this.bind_models_in(el, propname);
								break;
						}
					}
					break;
			}
		}
	};

	/**
	 * auto binding configuration
	 * @var object
	 */
	binding.config = {
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
			if (binding.config.load.auto) {
				binding.bind_all_in(binding.config.load.from);
			}
		});
	}
})(this);
