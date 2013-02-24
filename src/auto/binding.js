(function(ns, global) {
	"use strict";

	var binding, adjutor, eventuum;

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
	 * acts as a namespace
	 * @var array
	 */
	binding = ns.Template.config.load.binding = {};

	/**
	 * bind to string parses
	 * @var object
	 */
	binding.parse_bind_string = {
		/**
		 * parse model binding string (ie. "Clipper.name" => { model: Clipper,
		 * prop: name, name: "Clipperj })
		 * @param string str
		 * @return object
		 */
		model_info: function(str) {
			var parts = str.split(".");
			return {
				prop: parts[1],
				name: parts[0],
				model: global[ parts[0] ],
				raw: str
			};
		},

		/**
		 * parse event string (ie. "self.alert" => { item: self, func: alert })
		 * @param string str
		 * @return object
		 */
		user_event: function(str) {
			var parts = str.split(".");
			return {
				item: parts[0],
				func: parts[1]
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

		adjutor.foreach(el.querySelectorAll(
			this.generate_selector.by_prop("*", propname)), function(i, el)
		{
			node = el.nodeName.toLowerCase();
			selector = that.generate_selector.by_prop(node, propname);
			info = that.parse_bind_string.model_info(
				el.dataset[ adjutor.data2prop(propname) ]);

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
	 * place a click event listener
	 * @param Node el
	 * @param string propname
	 */
	binding.bind_clicks = function(el, propname) {
		var obj, item, that = this;

		eventuum.click(this.generate_selector.by_prop("*", propname), function(ev) {
			obj = Template.data(this);

			if (obj && (obj.model || obj.collection)) {
				item = that.parse_bind_string.user_event(this.dataset.click);
				obj.item[ item.func ](ev);
			}
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

				case this.config.props.user:
					for (name in propnames) {
						propname = propnames[ name ];

						switch (propname) {
							case propnames.click:
								this.bind_clicks(el, propname);
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
			},
			user: {
				click: "data-click"
			}
		}
	};

	// auto load, wait for document
	adjutor.onload(function() {
		if (binding.config.load.auto) {
			binding.bind_all_in(binding.config.load.from);
		}
	});
})(Polypus, this);
