/**
 * missing tests:
 * Collection.add(<instance>, <allow_duplicate!>)
 * Collection.remove(<instance>)
 */
describe("collections", function() {
	"use strict";

	var testmodel, TestModel, TestCollection;

	beforeEach(function() {
		TestModel = new Polypus.Model({
			first_property: "",
			second_property: "",
			third_property: "",
			fourth_property: ""
		});

		TestCollection = new Polypus.Collection(TestModel);
		testmodel = new TestModel;
	});

	it("collect the right models", function() {
		expect(TestCollection.collects(TestModel)).toBe(true);
	});

	it("allows models to be added", function() {
		TestCollection.add(testmodel);
		expect(TestCollection.has(testmodel)).toBe(true);
	});

	it("does not allow models of other types to be added", function() {
		var MyOtherModel = new Polypus.Model,
			myothermodel = new MyOtherModel;

		try {
			TestCollection.add(myothermodel);
			expect(false).toBe(true);
		} catch (ignore) {
			expect(true).toBe(true);
		}
	});

	it("generates search functions for every property in the model", function() {
		var prop, finds, gets, has = false;

		for (var i = 0, len = TestModel.prop_list.props.length; i < len; i++) {
			has = true;
			prop = TestModel.prop_list.props[ i ];
			gets = TestCollection[ "find_by_" + prop ];
			finds = TestCollection[ "get_by_" + prop ];

			expect(gets instanceof Function).toBe(true);
			expect(finds instanceof Function).toBe(true);
		}

		expect(has).toBe(true);
	});

	it("find models using an instance", function() {
		TestCollection.add(testmodel);
		expect(TestCollection.get(testmodel)).toBe(testmodel);
	});

	it("find models using properties", function() {
		testmodel.set_first_property("hi");
		TestCollection.add(testmodel);
		expect(TestCollection.get({ first_property: "hi" })).toBe(testmodel);
	});
	
	it("finds models using auto generated `get` functions", function() {
		testmodel.set_first_property("hi");
		TestCollection.add(testmodel);
		expect(TestCollection.get_by_first_property("hi")).toBe(testmodel);
	});
	
	it("finds models using auto generated `find` functions", function() {
		var anotherone = new TestModel, ret;

		testmodel.set_first_property("hi");
		anotherone.set_first_property("hi");
		TestCollection.add(testmodel);
		TestCollection.add(anotherone);

		ret = TestCollection.find_by_first_property("hi");
		expect(ret[0]).toBe(testmodel);
		expect(ret[1]).toBe(anotherone);
	});
});
