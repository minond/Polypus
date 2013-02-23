(function(global) {
	"use strict";

	var bindtos, apply_output_to_node, parse_bindto_string, load_in, dataset;

	/**
	 * possbile bindto options
	 * @var object
	 */
	bindtos = {
		MODEL: "model",
		COLLECTION: "collection"
	};

	/**
	 * "dataset" helper
	 * @param Node node
	 * @param string key
	 * @param mixed value
	 */
	dataset = (function() {
		var cache = {};
		return function(node, key, value) {
			var val, hash = node.dataset.sethash;

			if (value !== undefined) {
				// set
				if (!hash) {
					hash = Math.random();
					cache[ hash ] = {};
					node.dataset.sethash = hash;
				}

				val = cache[ hash ][ key ] = value;
			} else if (hash) {
				// get
				val = cache[ hash ][ key ];
			}

			return val
		};
	})();

	/**
	 * @param Node node
	 * @param string html
	 * @param string type
	 * @param mixed Collection|ModelInstance item
	 */
	apply_output_to_node = function(node, html, type, item) {
		node.innerHTML = html;
		dataset(node, type, item);
	};

	/**
	 * parse a bindto string:
	 * "collection:self:Ships" => self.Ships collection
	 * @param string str
	 * @param object gscope
	 * @return object
	 */
	parse_bindto_string = function(str, gscope) {
		var info = str.split(":");
		return {
			bindto: gscope && gscope[ info[1] ][ info[2] ],
			type: info[0],
			scope: info[1],
			item: info[2]
		};
	};

	/**
	 * compile and display templates is a give section
	 * @param Node holder
	 * @return CompiledTemplate[]
	 */
	load_in = global.Template.config.load.load_in = function(holder) {
		var i, len, par, el, tpl, tpls = [], html, info, max = 100, els = [],
			tmpels = holder.getElementsByTagName(Template.config.load.tag);

		for (i = 0, len = tmpels.length; i < len; i++) {
			els[ i ] = tmpels[ i ];
		}

		for (i = 0, len = els.length; max-- && i < len; i++) {
			el = els[i];
			par = el.parentNode;

			if (el.dataset.load) {
				tpl = Template.request(el.dataset.load);
			} else {
				tpl = new Template(el.innerHTML);
			}

			if (el.dataset.bindto) {
				info = parse_bindto_string(el.dataset.bindto, global);

				if (par.children.length !== 1) {
					// are we the only child?
					// wrap template in something and use that as output holder
				}

				if (info.bindto) {
					if (info.type === bindtos.COLLECTION) {
						html = tpl.render({ list: info.bindto.items });
					} else if (info.type === bindtos.MODEL) {
						html = tpl.render(info.bindto);
					} else {
						// what?
						continue;
					}

					(function(par, type) {
						apply_output_to_node(par, html, type, info.bindto);
						tpls.push(tpl.bind(info.bindto, function(str) {
							apply_output_to_node(par, str, type, this);
						}));
					})(par, info.type);
				}
			} else {
				// remove template node
				el.remove();
			}

			if (el.dataset.name) {
				Template.list[ el.dataset.name ] = tpl;
			}
		}

		return tpls;
	};

	/**
	 * template auto-loader
	 */
	if (window && window.addEventListener) {
		window.addEventListener("load", function() {
			var templates;

			if (Template.config.load.hide) {
				templates = Template.config.load.from
					.querySelectorAll(Template.config.load.tag);

				for (var i = 0, len = templates.length; i < len; i++) {
					templates[ i ].style.display = "none";
				}
			}

			if (Template.config.load.auto) {
				load_in(Template.config.load.from);
			}
		});
	}
})(this);
