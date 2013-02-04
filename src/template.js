(function(global) {
	"use strict";

	var Template, get_merge_field_label, get_merge_field_operator,
		get_merge_field_contents, get_fieldless_string, has_merge_fields,
		parse_merge_fields, render_merge_fields;

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
		return get_merge_field_contents(str).split(/(\W+)/)[1] || "";
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
	 * TODO: this is removing any whitespace after the merge field, but should be
	 * limited to just space characters.
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
			pos = 0, parts = [""];

		for (strlen = str.length, i = 0; i < strlen; i++) {
			ch = str[i];
			next = str[i + 1];

			if (ch === esc && (next === open || next === close)) {
				// escaped delimeter, save and skip next time
				// debugger;
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
				sub.compiled[0] = get_fieldless_string(
					sub.field + sub.operator,
					sub.compiled[0]
				);

				parts.push(sub, "");
			}
		}

		return { raw: str, compiled: parts };
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
								str.push(render_merge_fields(cur, inner_cur[ j ]));
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
			str,
			Template.config.open,
			Template.config.close,
			Template.config.esc
		);

		if (this instanceof Template) {
			this.contents = contents;
			this.output = fields;
		} else {
			return render_merge_fields(contents, fields);
		}
	};

	/**
	 * @param object fields
	 * @return string
	 */
	Template.prototype.render = function(fields) {
		var str = render_merge_fields(this.contents, fields);

		if (this.output && this.output instanceof Node) {
			this.output.innerHTML = str;
		}

		return str;
	};

	/**
	 * @param Node holder
	 * @return CompiledTemplate[]
	 */
	Template.load = function(holder) {
		var bindto, par, el, tpl, tpls = [], els = holder.getElementsByTagName("script");

		for (var i = 0, len = els.length; i < els.length; i++) {
			el = els[ i ];

			if (el.type === "text/x-template") {
				par = el.parentNode;
				tpl = new Template(el.innerHTML, par);
				tpls.push(tpl);

				if (el.dataset.template_bind) {
					bindto = eval(el.dataset.template_bind);
					el.type += "/read";
					i--;

					if (bindto instanceof Collection) {
						par.innerHTML = tpl.render({
							list: bindto.items
						});
					}
					else {
						par.innerHTML = tpl.render(bindto);
					}

					(function(par) {
						tpl.bind(bindto, function(str) {
							par.innerHTML = str;
						});
					})(par);
				}
			}
		}

		return tpls;
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
		var template = this;

		if (thing instanceof Collection) {
			thing.observe("add", function() {
				action(template.render({
					list: this.items
				}), this, thing, template);
			});

			thing.observe("change", function() {
				action(template.render({
					list: this.items
				}), this, thing, template);
			});
		}
		else {
			thing.observe("set", "*", function() {
				action(template.render(this), this, thing, template);
			});
		}
	};

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
			auto: true,
			from: document
		}
	};

	/**
	 * for testing
	 */
	Template.api = {
		get_merge_field_contents: get_merge_field_contents,
		get_merge_field_operator: get_merge_field_operator,
		get_merge_field_label: get_merge_field_label,
		get_fieldless_string: get_fieldless_string,
		has_merge_fields: has_merge_fields,
		parse_merge_fields: parse_merge_fields,
		render_merge_fields: render_merge_fields
	};
})(this);

/**
 * "repeater" operator
 */
Template.config.operator["*"] = function(template, fields) {
	var str = [], val = fields[ template.field ];

	while (val--) {
		str.push(this.render_merge_fields(template, fields));
	}

	return str.join("");
};

/**
 * save to cache
 */
Template.config.operator["[<#]"] = function(template, fields) {
	return fields[ "__cache_" + template.field ] = fields[ template.field ]();
};

/**
 * output cache
 */
Template.config.operator["[#>]"] = function(template, fields) {
	return fields[ "__cache_" + template.field ];
};

/**
 * template auto-loader
 */
window.addEventListener("load", function() {
// document.addEventListener("DOMContentLoaded", function() {
	if (Template.config.load.auto) {
		Template.load(Template.config.load.from);
	}
// }, false);
});
