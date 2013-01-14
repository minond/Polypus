describe("templates", function() {
	"use strict";

	var template, expected, stest;

	stest = function(rstring, tstring) {
		expected = rstring;
		template = new Template(tstring);
	}

	beforeEach(function() {
		expected = "";
		template = null;
	});

	it("handles single merge fields", function() {
		stest("1", "#{one}");
		expect(template.render({ one: "1" })).toBe(expected);
	});

	it("handles multiple merge fields next to each other", function() {
		stest("12", "#{one}#{two}");
		expect(template.render({ one: "1", two: "2" })).toBe(expected);
	});

	it("handles multiple merge fields", function() {
		stest("1 2", "#{one} #{two}");
		expect(template.render({ one: "1", two: "2"})).toBe(expected);
	});

	it("handles arrays", function() {
		stest("111", "@{numbers #num}");
		expect(template.render({
			numbers: [
				{ num: "1" },
				{ num: "1" },
				{ num: "1" }
			]
		})).toBe(expected);
	});

	it("handles arrays and merge fields together", function() {
		stest("1 111", "#{number} @{numbers #num}");
		expect(template.render({
			number: "1",
			numbers: [
				{ num: "1" },
				{ num: "1" },
				{ num: "1" }
			]
		})).toBe(expected);
	});
});
