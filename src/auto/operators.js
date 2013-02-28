(function(ns) {
	"use strict";

	var Template = ns.Template;

	if (Template.config.load.operators) {
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
			var field = fields[ template.field ], pass = field;
			if (field instanceof Array) pass = !!field.length;
			return pass ? this.render_compiled_string(template, fields) : "";
		};

		/**
		 * flip value operator
		 */
		Template.config.operator["!!"] = function(template, fields) {
			var field = fields[ template.field ], pass = field;
			if (field instanceof Array) pass = !!field.length;
			return !pass ? this.render_compiled_string(template, fields) : "";
		};

		/**
		 * "if greater than one" operator
		 */
		Template.config.operator[">1"] = function(template, fields) {
			return fields[ template.field ] > 1 ?
				this.render_compiled_string(template, fields) : "";
		};
	}
})(Polypus);
