(function(global) {
	"use strict";

	var Template, compile, mergefield, mergetypes, parse_field;

	/**
	 * merge field "token" match
	 * @var regexp
	 */
	mergefield = {
		in_string: /([\\#|@|~]){(.+?)}/g,
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
			temp = null, misc = null;

		if (type === mergetypes.LIST) {
			temp = name;
			name = name.substr(0, name.indexOf(" "));

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
