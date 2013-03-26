(function(ns, global) {
	"use strict";

	var bindtos, apply_output_to_node, load_in, bind_el, adjutor, Template;

	/**
	 * local copy
	 * @var object
	 */
	Template = ns.Template;

	/**
	 * local copy
	 * @var object 
	 */
	adjutor = ns.adjutor;

	/**
	 * possbile bindto options
	 * @var object
	 */
	bindtos = {
		MODEL: "model",
		COLLECTION: "collection"
	};

	/**
	 * @param Node node
	 * @param string html
	 * @param string type
	 * @param mixed Collection|ModelInstance item
	 */
	apply_output_to_node = function(node, html, type, item) {
		node.innerHTML = html;
		adjutor.dataset(node, type, item);
	};

	/**
	 * returns the Model or Collection bound to a template
	 * @param Node el
	 * @return object
	 */
	Template.data = function(el) {
		var max = 200, info, ret = null;

		while (max-- && el && el !== document) {
			if (el.dataset.sethash) {
				info = adjutor.dataset(el, null);
				break;
			}

			el = el.parentNode;
		}

		if (info) {
			ret = {
				model: "model" in info,
				collection: "collection" in info
			};

			if (ret.model) {
				ret.item = info.model;
			} else if (ret.collection) {
				ret.item = info.collection;
			} else {
				ret.item = null;
			}
		}

		return ret;
	}

	/**
	 * binds an element to a Model or Collection
	 * @param Node el
	 */
	bind_el = ns.Template.config.load.bind_el = function(el) {
		var tpl, html, type, bindto;

		if (el.dataset.load) {
			tpl = Template.request(el.dataset.load);
		} else {
			tpl = new Template(el.innerHTML);
		}

		if (el.dataset.bindtoModel || el.dataset.bindtoCollection) {
			if (el.dataset.bindtoModel) {
				bindto = Polypus.adjutor.find_object(global, el.dataset.bindtoModel.split("."));
				type = bindtos.MODEL;
			} else if (el.dataset.bindtoCollection) {
				bindto = Polypus.adjutor.find_object(global, el.dataset.bindtoCollection.split("."));
				type = bindtos.COLLECTION;
			}

			if (bindto) {
				html = tpl.render(bindto);

				(function(el, type) {
					apply_output_to_node(el, html, type, bindto);
					tpl.bind(bindto, function(str) {
						apply_output_to_node(el, str, type, this);
					});
				})(el, type);
			}
		} else {
			// remove template node
			el.parentNode.removeChild(el);
		}

		if (el.dataset.tmplName) {
			Template.tmpl[ el.dataset.tmplName ] = tpl;
		}
	};

	/**
	 * compile and display templates is a give section
	 * @param Node holder
	 * @return CompiledTemplate[]
	 */
	load_in = ns.Template.config.load.load_in = function(holder) {
		var i, len, max = 100, els = [],
			tmpels = holder.querySelectorAll(
				"*[data-bindto-collection], *[data-bindto-model], *[data-tmpl-name]");

		for (i = 0, len = tmpels.length; i < len; i++) {
			els[ i ] = tmpels[ i ];
		}

		for (i = 0, len = els.length; max-- && i < len; i++) {
			bind_el(els[ i ]);
		}
	};

	// template auto-loader
	adjutor.onload(function() {
		if (Template.config.load.auto) {
			load_in(Template.config.load.from);
		}
	});
})(Polypus, this);
