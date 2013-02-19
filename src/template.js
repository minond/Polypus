(function(global) {
	"use strict";

	var Template, get_merge_field_label, get_merge_field_operator,
		get_merge_field_contents, get_fieldless_string, has_merge_fields,
		parse_merge_fields, render_merge_fields, cleanup_template_str,
		add_missing_props, render_compiled_string, parse_bindto_string, bindtos,
		apply_output_to_node, dataset;

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
	 * removes placeholder templates strings
	 * @param string
	 * @return string
	 */
	cleanup_template_str = function(str) {
		return str
			.replace(/x-placeholder-/g, "")
			.replace(/\<!--placeholder/g, "")
			.replace(/placeholder--\>/g, "");
	};

	/**
	 * returns a string's label. i.e. {num* count} => count
	 */
	get_merge_field_label = function(str) {
		return get_merge_field_contents(str).split(/(\W+)/)[0];
	};

	/**
	 * returns a string label's operator. i.e. {num* count} => *
	 * @param string str
	 * @return string
	 */
	get_merge_field_operator = function(str) {
		return get_merge_field_contents(str).split(/(\W+.?)\s{0,}/)[1] || "";
	};

	/**
	 * returns a string's label content. i.e. {num* count} => num*
	 * @param string str
	 * @return str
	 */
	get_merge_field_contents = function(str) {
		return str.substr(0, Math.min.apply(Math,
			[ "\r", "\n", " " ].map(function(ch) {
				return str.indexOf(ch);
			}).filter(function(i) {
				return i >= 0;
			})
		));
	};

	/**
	 * simple merge field check. just checks if the open and close merge field
	 * characters/delimeters are found in a string.
	 * @param string str
	 * @param string open
	 * @param string close
	 * @return boolean
	 */
	has_merge_fields = function(str, open, close) {
		return !!str.match(open) && !!str.match(close);
	};

	/**
	 * TODO: this is removing any whitespace after the merge field, but should
	 * be limited to just space characters.
	 * @param string field
	 * @param string str
	 * @return string
	 */
	get_fieldless_string = function(field, str) {
		return str.replace(RegExp(
			// escape regex character (may be used by operator)
			field.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") +
			"\\s{0,}"), ""
		);
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
	 * parses merge fields in a template string. returns an array open string
	 * pieces that can be later use to merge in merge values.
	 * @param string str
	 * @param string open
	 * @param string close
	 * @param string esc
	 * @return array
	 */
	parse_merge_fields = function(str, open, close, esc) {
		var strlen, i, ch, next, sub, subm, field, bracket = null,
			pos = 0, parts = [""], fields = [];

		for (strlen = str.length, i = 0; i < strlen; i++) {
			ch = str[i];
			next = str[i + 1];

			if (ch === esc && (next === open || next === close)) {
				// escaped delimeter, save and skip next time
				parts[ parts.length - 1 ] += next;
				i++;
				continue;
			} else if (ch === open) {
				// found merge start, we're starting a new match group
				if (bracket === null) {
					bracket = 1;
					pos = i + 1;
				} else {
					// we're still within the outter match group
					bracket++;
				}
			} else if (ch === close) {
				// merge end, or group end
				bracket--;
			} else if (bracket === null) {
				// outside of merge field
				parts[ parts.length - 1 ] += ch;
			}

			// done?
			if (bracket === 0) {
				// reset, save current group, and start new match group
				bracket = null;
				sub = parse_merge_fields(str.substring(pos, i), open, close, esc);
				sub.field = get_merge_field_label(sub.raw);
				sub.operator = get_merge_field_operator(sub.raw);
				sub.single = sub.raw === sub.field;
				sub.compiled[0] = get_fieldless_string(
					sub.field + sub.operator,
					sub.compiled[0]
				);

				parts.push(sub, "");
				fields.push(sub.field);
			}
		}

		return {
			raw: str,
			compiled: parts,
			fields: fields
		};
	};

	/**
	 * @param string[] fields
	 * @param object holder
	 */
	add_missing_props = function(fields, holder) {
		var copy = {}, i, len, prop;

		// originals
		for (prop in holder) {
			copy[ prop ] = holder[ prop ];
		}

		// missing
		for (i = 0, len = fields.length; i < len; i++) {
			if (!(fields[ i ] in copy)) {
				copy[ fields[ i ] ] = holder[ fields[ i ] ];
			}
		}

		return copy;
	};

	/**
	 * calls render_merge_fields with a full fields holder object
	 * @param array cstr
	 * @param object fields
	 * @param object operators
	 * @return string
	 */
	render_compiled_string = function(cstr, fields, operators) {
		return render_merge_fields(cstr, add_missing_props(
			cstr.fields, fields
		), operators);
	};

	/**
	 * @param array cstr
	 * @param object fields
	 * @param object operators
	 * @return string
	 */
	render_merge_fields = function(cstr, fields, operators) {
		var str = [], i, j, len, inner_len, cur, inner_cur;

		if (!operators) {
			operators = Template.config.operator;
		}

		for (i = 0, len = cstr.compiled.length; i < len; i++) {
			cur = cstr.compiled[ i ];

			if (typeof cur === "string") {
				// regular string
				str.push(cur);
			} else if (cur instanceof Object) {
				if (cur.raw === cur.field) {
					// single merge field
					str.push(fields[ cur.field ]);
				} else {
					// list merge field
					if (cur.field in fields) {
						inner_cur = fields[ cur.field ];

						if (cur.operator && cur.operator in operators) {
							str.push(operators[ cur.operator ].call(
								Template.api, cur, fields
							));
						} else if (inner_cur instanceof Array) {
							for (j = 0, inner_len = inner_cur.length; j < inner_len; j++) {
								str.push(render_compiled_string(cur, inner_cur[ j ]));
							}
						}
					}
				}
			}
		}

		return str.join("");
	};

	/**
	 * constructor
	 * @param string str
	 * @param object fields
	 * @param mixed CompiledTemplate|string
	 */
	Template = global.Template = function CompiledTemplate(str, fields) {
		var contents = parse_merge_fields(
			cleanup_template_str(str),
			Template.config.open,
			Template.config.close,
			Template.config.esc
		);

		if (this instanceof Template) {
			this.contents = contents;
			this.last_render = null;
		} else {
			return render_compiled_string(contents, fields);
		}
	};

	/**
	 * @param object fields
	 * @return string
	 */
	Template.prototype.render = function(fields) {
		return this.last_render = render_compiled_string(this.contents, fields || {});
	};

	/**
	 * check if a template (rendered content) has changed
	 * @param mixed string|Object|Model
	 * @return boolean
	 */
	Template.prototype.has_changed = function(info) {
		var str = typeof info === "string" ? info : this.render(info);
		return this.last_render === info;
	};

	/**
	 * @param Node el
	 */
	Template.prototype.set_output = function(el) {
		this.output = el;
	};

	/**
	 * @param mixed Collection|Model thing
	 * @param function action
	 */
	Template.prototype.bind = function(thing, action) {
		var template = this, trigger_redraw = function(model) {
			model.constructor.__specials__.__redraw__.apply(model);
		};

		if (thing instanceof Collection) {
			thing.observe("add", function(model) {
				action(template.render({
					list: this.items
				}), this, thing, template);

				this.foreach(function(i, model) {
					trigger_redraw(model);
				});
			});

			thing.observe("change", function(model) {
				action(template.render({
					list: this.items
				}), this, thing, template);

				this.foreach(function(i, model) {
					trigger_redraw(model);
				});
			});

			thing.observe("remove", function(model) {
				action(template.render({
					list: this.items
				}), this, thing, template);

				this.foreach(function(i, model) {
					trigger_redraw(model);
				});
			});
		} else {
			thing.observe("set", "*", function() {
				action(template.render(this), this, thing, template);
				trigger_redraw(this);
			});
		}

		return this;
	};

	/**
	 * @param string url
	 * @param function cb
	 * @return mixed null|CompiledTemplate
	 */
	Template.request = function(url, cb) {
		var xhr = new XMLHttpRequest;

		xhr.open("GET", url, !!cb);
		xhr.send(null);
		xhr.onreadystatechange = function() {
			switch (xhr.readyState) {
				case 4:
					if (cb instanceof Function) {
						cb(xhr, new Template(xhr.responseText));
					}
			}
		};

		return cb ? null : new Template(xhr.responseText);
	};

	/**
	 * @param Node holder
	 * @return CompiledTemplate[]
	 */
	Template.load = function(holder) {
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
	 * holds templates automatically loaded
	 * @var CompiledTemplate[]
	 */
	Template.list = {};

	/**
	 * used to identify where the update request came from
	 * @var Node
	 */
	Template.trigger = null;

	/**
	 * configuration settings
	 * holds operators as well.
	 */
	Template.config = {
		open: "{",
		close: "}",
		esc: "\\",
		operator: {},
		load: {
			hide: true,
			auto: true,
			from: document,
			tag: "template"
		}
	};

	/**
	 * "repeater" operator
	 */
	Template.config.operator["*"] = function(template, fields) {
		var str = [], val = fields[ template.field ];

		while (val--) {
			str.push(this.render_compiled_string(template, fields));
		}

		return str.join("");
	};

	/**
	 * save to cache
	 */
	Template.config.operator["[<#]"] = function(template, fields) {
		return fields[ "__cache_" + template.field ] =
			fields[ template.field ]();
	};

	/**
	 * output cache
	 */
	Template.config.operator["[#>]"] = function(template, fields) {
		return fields[ "__cache_" + template.field ];
	};

	/**
	 * default value operator
	 */
	Template.config.operator["?"] = function(template, fields) {
		return fields[ template.field ] ||
			this.render_compiled_string(template, fields);
	};

	/**
	 * required value operator
	 */
	Template.config.operator["!"] = function(template, fields) {
		return fields[ template.field ] ?
			this.render_compiled_string(template, fields) : "";
	};

	/**
	 * flip value operator
	 */
	Template.config.operator["!!"] = function(template, fields) {
		return !fields[ template.field ] ?
			this.render_compiled_string(template, fields) : "";
	};

	/**
	 * "if greater than one" operator
	 */
	Template.config.operator[">1"] = function(template, fields) {
		return fields[ template.field ] > 1 ?
			this.render_compiled_string(template, fields) : "";
	};

	/**
	 * for testing and operators
	 */
	Template.api = {
		get_merge_field_contents: get_merge_field_contents,
		get_merge_field_operator: get_merge_field_operator,
		get_merge_field_label: get_merge_field_label,
		get_fieldless_string: get_fieldless_string,
		has_merge_fields: has_merge_fields,
		parse_merge_fields: parse_merge_fields,
		render_merge_fields: render_merge_fields,

		// not tested:
		dataset: dataset,
		apply_output_to_node: apply_output_to_node,
		render_compiled_string: render_compiled_string,
		add_missing_props: add_missing_props,
		cleanup_template_str: cleanup_template_str,
		parse_bindto_string: parse_bindto_string
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
				Template.load(Template.config.load.from);
			}
		});
	}
})(this);

/*
var parse_function_arguments = function(func) {
	return func.toString()
		.match(/\((.{0,}?)\)/)[1]
		.split(",")
		.filter(function(arg) { return !!arg; })
		.map(function(arg) { return arg.trim(); });
};
*/
