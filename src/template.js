(function(global) {
	"use strict";

	var Template, compile, mergefield, mergetypes, parse_field;

	/**
	 * merge field "token" match
	 * @var regexp
	 */
	mergefield = {
		// in_string: /([\\#|@|~]){(.+?)}/g,
		in_string: /([\\#|@|~]){([\s\S]+?)}/g,
		in_list: /(#)(\w+)/g
	};

	/**
	 * merge field types.
	 * identified by character before opening curly bracket
	 * @var object
	 */
	mergetypes = { STRING: '#', LIST: '@' };

	/**
	 * takes a "raw" template string and returns an array for future merges
	 * @param string
	 * @param regex match
	 * @param int padleft
	 * @param int padright
	 * @return array
	 */
	compile = function(str, match, padleft, padright) {
		var loc, field, parts = [],
			fields = str.match(match);

		if (fields) {
			for (var i = 0, len = fields.length; i < len; i++) {
				field = fields[ i ];
				loc = str.indexOf(field);
				parts.push(str.substr(0, loc));
				parts.push(parse_field(field, padleft, padright));
				str = str.substr(loc + field.length);
			}
		}

		parts.push(str);
		return parts;
	};

	/**
	 * clean up a merge field. removes merge field type character and curly
	 * brackets
	 * @param string field
	 * @param int padleft
	 * @param int padright
	 * @return object
	 */
	parse_field = function(field, padleft, padright) {
		var type = field.charAt(0),
			name = field.substring(padleft, field.length - padright),
			temp = null, misc = null, whitespaceloc;

		if (type === mergetypes.LIST) {
			whitespaceloc = Math.min.apply(Math, 
				[ name.indexOf("\r"), name.indexOf("\n"), name.indexOf(" ") ]
				.filter(function(num) {
					return num > 0;
				})
			);

			temp = name;
			name = name.substr(0, whitespaceloc);

			// internal template
			misc = temp.substr(name.length);
			misc = { raw: misc, tpl: new Template(misc) };
			misc.tpl.body = compile(misc.raw, mergefield.in_list, 1, 0);
			misc.tpl.body[ 0 ] = misc.tpl.body[ 0 ].substr(1);
		}

		return { type: type, name: name, misc: misc };
	};

	/**
	 * @param string str
	 */
	Template = global.Template = function Template(str) {
		this.raw = str;
		this.body = compile(str, mergefield.in_string, 2, 1);
	};

	/**
	 * @param object fields
	 * @return string
	 */
	Template.prototype.render = function(fields) {
		var value, field, copy = this.body.concat();
		fields = fields || {};

		for (var i = 0, len = copy.length; i < len; i++) {
			field = copy[ i ];

			if (field instanceof Object) {
				if (field.name in fields) {
					switch (field.type) {
						case mergetypes.STRING:
							value = fields[ field.name ];
							break;

						case mergetypes.LIST:
							value = [];

							for (var j = 0, max = fields[ field.name ].length; j < max; j++) {
								value.push(field.misc.tpl.render(fields[ field.name ][ j ]));
							}

							value = value.join("");
							break;

						default:
							value = "";
							break;
					}

					copy[ i ] = value;
				}
				else {
					copy[ i ] = "";
				}
			}
		}

		return copy.join("");
	};

	/**
	 * retrieve a template's content from an element's markup
	 * @param string el_id
	 * @return Template
	 */
	Template.get = function(el_id) {
		var tmpl, el = document.getElementById(el_id);

		tmpl = new Template(el.innerHTML
			.replace(/data-template-/g, ''));
		el.innerHTML = "";

		return tmpl;
	};
})(this);


var test = new Template(
	"@{nums\n" +
	"#num\n" +
	"}"
);

// console.log(test.raw);
// console.log(test.body);
// console.log(test.body[1]);
// console.log(test.render({
// 	nums: [
// 		{ num: 1 },
// 		{ num: 2 },
// 		{ num: 3 },
// 		{ num: 4 },
// 		{ num: 5 }
// 	]
// }));



(function(global) {
	"use strict";

	var Template, get_merge_field_label, get_fieldless_string, has_merge_fields, 
		parse_merge_fields, render_merge_fields;

	/**
	 * returns a strings label. i.e. #{label #{mergefield}} => label, mergefield
	 * @param string str
	 * @return string
	 */
	get_merge_field_label = function(str) {
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
		return str.replace(RegExp(field + "\\s{0,}"), "");
	};

	/**
	 * parses merge fields in a template string. returns an array open string
	 * pieces that can be later use to merge in merge values.
	 * @param string str
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
				sub.compiled[0] = get_fieldless_string(
					sub.field,
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
	 * @return string
	 */
	render_merge_fields = function(cstr, fields) {
		var str = [], i, j, len, inner_len, cur, inner_cur;

		for (i = 0, len = cstr.compiled.length; i < len; i++) {
			cur = cstr.compiled[ i ];

			if (typeof cur === "string") {
				// regular string
				str.push(cur);
			} else if (cur instanceof Object) {
				if (cur.raw === cur.field) {
					// single merge field
					console.log(cur.field);
					str.push(fields[ cur.field ]);
				} else {
					// list merge field
					if (cur.field in fields && fields[ cur.field ] instanceof Array) {
						inner_cur = fields[ cur.field ];

						for (j = 0, inner_len = inner_cur.length; j < inner_len; j++) {
							str.push(render_merge_fields(cur, inner_cur[ j ]));
						}
					}
				}
			}
		}

		return str.join("");
	};

	Template = global.Template2 = function CompiledTemplate(str, fields) {
		var contents = parse_merge_fields(
			str,
			Template.config.open,
			Template.config.close,
			Template.config.esc
		);

		if (this instanceof Template) {
			this.contents = contents;
		} else {
			return render_merge_fields(
				contents,
				fields,
				Template.config.operator
			);
		}
	};

	Template.prototype.render = function(fields) {
		return render_merge_fields(
			this.contents,
			fields,
			Template.config.operator
		);
	};

	Template.config = {
		open: "{",
		close: "}",
		esc: "\\",
		operator: {}
	};

	Template.api = {
		get_merge_field_label: get_merge_field_label,
		get_fieldless_string: get_fieldless_string,
		has_merge_fields: has_merge_fields,
		parse_merge_fields: parse_merge_fields,
		render_merge_fields: render_merge_fields
	};
})(this);


Template2.config.operator["*"] = function() {};

var message = new Template2(
	"!!\n\n{users hi, my name is {name}\n" +
	"i'm {age} years old\n" +
	"and these are my favorite colors:\n" +
	"{colors {color}, }" +
	"-------------------------------\n\n}"
);

var str = message.render({
	users: [
		{ name: "Marcos", age: 23, colors: [ { color: "red" }, { color: "blue" } ] },
		{ name: "Marcos", age: 23, colors: [ { color: "red" }, { color: "blue" } ] },
		{ name: "Marcos", age: 23, colors: [ { color: "red" }, { color: "blue" } ] }
	]
});

console.log(str);

/*
// var parts = parse_merge_fields("this my {users " + "<div>{first_name}</div><div>{last_name}</div>\n} string and merge: {merge}", "{", "}");
// var parts = parse_merge_fields("this my field: {merge}", "{", "}");

// var aa = render_merge_fields(parts, {
	// merge: "hi",
	// users: [
		// { first_name: "Marcos", last_name: "Minond" },
		// { first_name: "Andres", last_name: "Minond" }
	// ]
// });


// console.log("DONE, %o made this: %s", parts, aa);
*/






