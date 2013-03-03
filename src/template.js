(function(Polypus) {
	"use strict";

	var Template, get_merge_field_label, get_merge_field_operator,
		get_merge_field_contents, get_fieldless_string, has_merge_fields,
		parse_merge_fields, render_merge_fields, cleanup_template_str,
		add_missing_props, render_compiled_string, finish_compile_data_gather;

	/**
	 * adds a few more properties to a compiled string object (field, operator,
	 * single, compiled[0])
	 * @param object holder
	 */
	finish_compile_data_gather = function(holder) {
		holder.field = get_merge_field_label(holder.raw);
		holder.operator = get_merge_field_operator(holder.raw);
		holder.single = holder.raw === holder.field;
		holder.compiled[0] = get_fieldless_string(
			holder.field + holder.operator,
			holder.compiled[0]
		);
	}

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
	 * parses merge fields in a template string. returns an array open string
	 * pieces that can be later use to merge in merge values.
	 * @param string str
	 * @param string open
	 * @param string close
	 * @param string esc
	 * @return array
	 */
	parse_merge_fields = function(str, open, close, esc) {
		var strlen, substr, i, ch, next, sub, subm, field, bracket = null,
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
				substr = str.substring(pos, i);
				sub = parse_merge_fields(substr, open, close, esc);
				finish_compile_data_gather(sub);
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
				inner_cur = fields[ cur.field ];

				if (cur.raw === cur.field) {
					// single merge field
					str.push(inner_cur instanceof Function ?
						inner_cur.call(fields) : inner_cur);
				} else {
					// list merge field
					if (cur.field in fields) {
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
	Template = Polypus.Template = function CompiledTemplate(str, fields) {
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
	 * @param object collfilter
	 * @param object collret
	 */
	Template.prototype.bind = function(thing, action, collfilter, collret) {
		var template = this, trigger_redraw = function(model) {
			model.constructor.__specials__.__redraw__.apply(model);
		};

		if (thing instanceof Polypus.Collection) {
			thing.observe(["add", "change", "remove"], function(model) {
				action(template.render({
					list: this.find(collfilter || {}, collret || { $sort: "" })
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
	 * holds templates automatically loaded
	 * @var CompiledTemplate[]
	 */
	Template.tmpl = {};

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
			operators: true,
			auto: true,
			from: document,
			tag: "view"
		}
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
		render_compiled_string: render_compiled_string,
		add_missing_props: add_missing_props,
		cleanup_template_str: cleanup_template_str,
		finish_compile_data_gather: finish_compile_data_gather
	};
})(Polypus);
