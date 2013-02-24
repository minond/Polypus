(function(ns, global) {
	"use strict";

	var bindtos, apply_output_to_node, load_in, adjutor, Template;

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
	 * compile and display templates is a give section
	 * @param Node holder
	 * @return CompiledTemplate[]
	 */
	load_in = ns.Template.config.load.load_in = function(holder) {
		var i, len, par, el, tpl, tpls = [], html, info, max = 100, els = [],
			tmpels = holder.getElementsByTagName(Template.config.load.tag),
			type, bindto;

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

			if (el.dataset.bindtoModel || el.dataset.bindtoCollection) {
				if (el.dataset.bindtoModel) {
					bindto = global[ el.dataset.bindtoModel ];
					type = bindtos.MODEL;
				} else if (el.dataset.bindtoCollection) {
					bindto = global[ el.dataset.bindtoCollection ];
					type = bindtos.COLLECTION;
				}

				if (par.children.length !== 1) {
					// are we the only child?
					// wrap template in something and use that as output holder
				}

				if (bindto) {
					if (type === bindtos.COLLECTION) {
						html = tpl.render({ list: bindto.items });
					} else if (type === bindtos.MODEL) {
						html = tpl.render(bindto);
					} else {
						// what?
						continue;
					}

					(function(par, type) {
						apply_output_to_node(par, html, type, bindto);
						tpls.push(tpl.bind(bindto, function(str) {
							apply_output_to_node(par, str, type, this);
						}));
					})(par, type);
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

	// auto hide
	if (Template.config.load.hide) {
		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = Template.config.load.tag + ' { display: none; }';
		document.getElementsByTagName('head')[0].appendChild(style);
	}

	// template auto-loader
	adjutor.onload(function() {
		if (Template.config.load.auto) {
			load_in(Template.config.load.from);
		}
	});
})(Polypus, this);
