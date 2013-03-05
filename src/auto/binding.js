(function(Polypus, global) {
	"use strict";

	var binding, adjutor, eventuum;

	/**
	 * local copy
	 * @var object 
	 */
	adjutor = Polypus.adjutor;

	/**
	 * local copy
	 * @var object
	 */
	eventuum = Polypus.eventuum;

	/**
	 * acts as a namespace
	 * @var array
	 */
	binding = Polypus.Template.config.load.binding = {};

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
				item: parts[1] ? parts[0] : binding.config.ev_item.controller,
				func: parts[1] ? parts[1] : parts[0]
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
			this.generate_selector.by_prop("input", propname)), function(i, el)
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
			info.model.observe("set", info.prop, function(prop, value) {
				if (value !== el.value) {
					el.value = value;
				}
			});

			// initial value
			el.value = info.model[ info.prop ];
		});

		adjutor.foreach(el.querySelectorAll(
			this.generate_selector.by_prop("select", propname)), function(i, el)
		{
			node = el.nodeName.toLowerCase();
			selector = that.generate_selector.by_prop(node, propname);
			info = that.parse_bind_string.model_info(
				el.dataset[ adjutor.data2prop(propname) ]);

			// input value updates
			eventuum.change(selector, function() {
				if (this.value !== info.model[ info.prop ]) {
					info.model.set(info.prop, this.value);
				}
			});

			// model updates
			info.model.observe("set", info.prop, function(prop, value) {
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

		Polypus.eventuum.input("input[data-bindto-property]", function() {
			var model = Polypus.adjutor.dataset(this, "model");
			if (model) model.set(this.dataset.bindtoProperty, this.value);
		});

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
		},
		ev_item: {
			item: "self",
			controller: "controller"
		}
	};

	// auto load, wait for document
	adjutor.onload(function() {
		if (binding.config.load.auto) {
			binding.bind_all_in(binding.config.load.from);
		}
	});
})(Polypus, this);
