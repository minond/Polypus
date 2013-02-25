describe("templates", function() {
	"use strict";

	var api = Polypus.Template.api, raw, compiled, result;

	beforeEach(function() {
	});

	describe("api tests", function() {
		describe("helper functions", function() {
			it("get_merge_field_contents without operator", function() {
				raw = "field content";
				result = "field";
				expect(api.get_merge_field_contents(raw)).toBe(result);
			});

			it("get_merge_field_contents with operator", function() {
				raw = "field~~~ content";
				result = "field~~~";
				expect(api.get_merge_field_contents(raw)).toBe(result);
			});

			it("get_merge_field_operator", function() {
				raw = "field~~~ content";
				result = "~~~";
				expect(api.get_merge_field_operator(raw)).toBe(result);
			});

			it("get_merge_field_label without operator", function() {
				raw = "field content";
				result = "field";
				expect(api.get_merge_field_label(raw)).toBe(result);
			});

			it("get_merge_field_label with operator", function() {
				raw = "field~~~ content";
				result = "field";
				expect(api.get_merge_field_label(raw)).toBe(result);
			});

			it("get_fieldless_string without operator", function() {
				raw = "field content";
				result = "content";
				expect(api.get_fieldless_string("field", raw)).toBe(result);
			});

			it("get_fieldless_string with operator", function() {
				raw = "field~~~ content";
				result = "content";
				expect(api.get_fieldless_string("field~~~", raw)).toBe(result);
			});

			it("has_merge_fields with merge fields", function() {
				raw = "{field~~~ content}";
				expect(api.has_merge_fields(raw, "{", "}")).toBe(true);
			});

			it("has_merge_fields with merge fields", function() {
				raw = "field~~~ content";
				expect(api.has_merge_fields(raw, "{", "}")).toBe(false);
			});
		});

		describe("compiler and renderer", function() {
			it("should determine there are no merge fields in a string", function() {
				raw = "fdsafd fd safd afd";
				compiled = api.parse_merge_fields(raw, "{", "}");
				expect(compiled.compiled.length).toBe(1);
				expect(compiled.compiled[0]).toBe(raw);
			});

			it("should find merge fields without operators", function() {
				raw = "string {field} string";
				compiled = api.parse_merge_fields(raw, "{", "}");
				expect(compiled.compiled[1].field).toBe("field");
			});

			it("should find merge fields with operators", function() {
				raw = "string {field*} string";
				compiled = api.parse_merge_fields(raw, "{", "}");
				expect(compiled.compiled[1].field).toBe("field");
				expect(compiled.compiled[1].operator).toBe("*");
			});

			it("should merge in fields without operators", function() {
				raw = "string {field} string";
				compiled = api.parse_merge_fields(raw, "{", "}");
				result = api.render_merge_fields(compiled, {
					field: "hi"
				});
				expect(result).toBe("string hi string");
			});

			it("should merge in fields with operators", function() {
				raw = "string {field*} string";
				compiled = api.parse_merge_fields(raw, "{", "}");
				result = api.render_merge_fields(compiled, {
					field: "hi"
				}, {
					"*": function() {
						return "bye";
					}
				});
				expect(result).toBe("string bye string");
			});
		});
	});
});
