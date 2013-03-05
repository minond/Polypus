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
			type, bindto, newpar, cfilter = {}, cret = {};

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
					bindto = Polypus.adjutor.find_object(global, el.dataset.bindtoModel.split("."));
					type = bindtos.MODEL;
				} else if (el.dataset.bindtoCollection) {
					bindto = Polypus.adjutor.find_object(global, el.dataset.bindtoCollection.split("."));
					type = bindtos.COLLECTION;
				}

				if (par.children.length !== 1) {
					// are we the only child?
					// wrap template in something and use that as output holder
					newpar = document.createElement(
						el.dataset.elem ? el.dataset.elem : "span");
					newpar.id = el.id;
					newpar.className = el.className;
					par.insertBefore(newpar, el);
					par = newpar;
					window.par = par;

					// remove template node
					el.remove();
				}

				if (bindto) {
					if (type === bindtos.COLLECTION) {
						cret.$sort = el.dataset.collectionSort;
						html = tpl.render({ list: bindto.find(cfilter, cret) });
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
						}, cfilter, cret));
					})(par, type);
				}
			} else {
				// remove template node
				el.remove();
			}

			if (el.dataset.name) {
				Template.tmpl[ el.dataset.name ] = tpl;
			}
		}

		return tpls;
	};

	// template auto-loader
	adjutor.onload(function() {
		if (Template.config.load.auto) {
			load_in(Template.config.load.from);
		}
	});
})(Polypus, this);
