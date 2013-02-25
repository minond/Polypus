describe("models", function() {
	"use strict";

	var TestModel, model;

	beforeEach(function() {
		TestModel = Polypus.Model({
			first_name: "",
			init_called: false,
			__init__: function() {
				this.init_called = true;
			},
			func: function() {
				return true;
			},
			push_num: function(arr, num) {
				arr.push(num);
			}
		});

		model = new TestModel;
	});

	describe("model initialization", function() {
		it("should be real instances of their models", function() {
			expect(model instanceof TestModel).toBe(true);
		});

		it("should use prototypal inheritance", function() {
			TestModel.prototype.something_new = true;
			expect(model.something_new).toBe(true);
		});

		it("should auto generate getters", function() {
			expect(model.get_first_name instanceof Function).toBe(true);
		});

		it("should auto generate setters", function() {
			expect(model.set_first_name instanceof Function).toBe(true);
		});

		it("should generate getters and setters that work with the instance's prototype", function() {
			model.set_first_name("Marcos");
			expect(model.get_first_name()).toBe("Marcos");
			expect(model.first_name).toBe("Marcos");
		});

		it("should not overwrite model functions", function() {
			expect(model.func()).toBe(true);
		});

		it("should not add special functions", function() {
			expect(!!model.__init__).toBe(false);
		});

		it("should call the constructor when initialized", function() {
			expect(model.init_called).toBe(true);
		});
	});

	describe("instance access functions", function() {
		it("should allow for instance property `set` observers", function() {
			var set = false;
			model.observe("set", "first_name", function() { set = true; });
			model.set_first_name("Marcos");
			expect(set).toBe(true);
		});

		it("should allow for instance property `get` observers", function() {
			var get = false;
			model.observe("get", "first_name", function() { get = true; });
			model.get_first_name();
			expect(get).toBe(true);
		});

		it("should allow for instance global `set` observers", function() {
			var set = false;
			model.observe("set", "*", function() { set = true; });
			model.set_first_name("Marcos");
			expect(set).toBe(true);
		});

		it("should allow for instance global `get` observers", function() {
			var get = false;
			model.observe("get", "*", function() { get = true; });
			model.get_first_name();
			expect(get).toBe(true);
		});

		it("should allow for instance function `before` observers", function() {
			var before = false;
			model.observe("before", "func", function() { before = true; });
			model.func();
			expect(before).toBe(true);
		});

		it("should allow for instance function `after` observers", function() {
			var after = false;
			model.observe("after", "func", function() { after = true; });
			model.func();
			expect(after).toBe(true);
		});

		it("should allow for instance global `before` observers", function() {
			var before = false;
			model.observe("before", "*", function() { before = true; });
			model.func();
			expect(before).toBe(true);
		});

		it("should allow for instance global `after` observers", function() {
			var after = false;
			model.observe("after", "*", function() { after = true; });
			model.func();
			expect(after).toBe(true);
		});
	});

	describe("instance access functions", function() {
		it("should allow for model property `set` observers", function() {
			var set = false;
			TestModel.observe("set", "first_name", function() { set = true; });
			model.set_first_name("Marcos");
			expect(set).toBe(true);
		});

		it("should allow for model property `get` observers", function() {
			var get = false;
			TestModel.observe("get", "first_name", function() { get = true; });
			model.get_first_name();
			expect(get).toBe(true);
		});

		it("should allow for model global `set` observers", function() {
			var set = false;
			TestModel.observe("set", "*", function() { set = true; });
			model.set_first_name("Marcos");
			expect(set).toBe(true);
		});

		it("should allow for model global `get` observers", function() {
			var get = false;
			TestModel.observe("get", "*", function() { get = true; });
			model.get_first_name();
			expect(get).toBe(true);
		});

		it("should allow for model function `before` observers", function() {
			var before = false;
			TestModel.observe("before", "func", function() { before = true; });
			model.func();
			expect(before).toBe(true);
		});

		it("should allow for model function `after` observers", function() {
			var after = false;
			TestModel.observe("after", "func", function() { after = true; });
			model.func();
			expect(after).toBe(true);
		});

		it("should allow for model global `before` observers", function() {
			var before = false;
			TestModel.observe("before", "*", function() { before = true; });
			model.func();
			expect(before).toBe(true);
		});

		it("should allow for model global `after` observers", function() {
			var after = false;
			TestModel.observe("after", "*", function() { after = true; });
			model.func();
			expect(after).toBe(true);
		});
	});

	describe("function observers", function() {
		it("should run `before` and `after` in the instance's scope - per instace", function() {
			var before, after;
			model.observe("before", "func", function() { before = this; });
			model.observe("after", "func", function() { after = this; });
			model.func();
			expect(before).toEqual(model);
			expect(after).toEqual(model);
		});

		it("should run `before` and `after` in the instance's scope - per model", function() {
			var before, after;
			TestModel.observe("before", "func", function() { before = this; });
			TestModel.observe("after", "func", function() { after = this; });
			model.func();
			expect(before).toEqual(model);
			expect(after).toEqual(model);
		});

		it("should run `before` and `after` in the instance's scope - per instace, global", function() {
			var before, after;
			model.observe("before", "*", function() { before = this; });
			model.observe("after", "*", function() { after = this; });
			model.func();
			expect(before).toEqual(model);
			expect(after).toEqual(model);
		});

		it("should run `before` and `after` in the instance's scope - per model, global", function() {
			var before, after;
			TestModel.observe("before", "*", function() { before = this; });
			TestModel.observe("after", "*", function() { after = this; });
			model.func();
			expect(before).toEqual(model);
			expect(after).toEqual(model);
		});

		it("should follow a call order of `before`, `function`, and `after`", function() {
			var nums = [];

			model.observe("before", "push_num", function() { nums.push(1); });
			model.observe("after", "push_num", function() { nums.push(3); });
			model.push_num(nums, 2);

			expect(nums.length).toBe(3)
			expect(nums[0]).toBe(1);
			expect(nums[1]).toBe(2);
			expect(nums[2]).toBe(3);
		});
	});

	describe("instance initialization", function() {
		it("should load contructor arguments", function() {
			model = new TestModel({ first_name: "Marcos" });
			expect(model.get_first_name()).toBe("Marcos");
		});

		it("contructor arguments should trigger setter listeners", function() {
			var called = false;
			TestModel.observe("set", "first_name", function() { called = true; });
			model = new TestModel({ first_name: "Marcos" });
			expect(called).toBe(true);
		});
	});

	describe("special functions", function() {
		it("should generate plain js objects with the model's values", function() {
			var i, len, raw = model.clone(),
				props = TestModel.prop_list.props;

			for (i = 0, len = props.length; i < len; i++) {
				expect(raw[ props[ i ] ]).toBe(model[ props[ i ] ]);
			}
		});

		it("should be able to clone objects", function() {
			var i, len, copy = model.clone(),
				props = TestModel.prop_list.props;

			for (i = 0, len = props.length; i < len; i++) {
				expect(copy[ props[ i ] ]).toBe(model[ props[ i ] ]);
			}
		});
	});

	describe("enumerator values", function() {
		beforeEach(function() {
			TestModel = Polypus.Model({
				item: Polypus.Model.enum("one", "two", "three", "four")
			});

			model = new TestModel;
		});

		it("should initialize enum properties as null values", function() {
			expect(model.get_item()).toBe(null);
		});

		it("should allow valid values to be set", function() {
			var orig = "one";
			model.set_item(orig);
			expect(model.get_item()).toBe(orig);
		});

		it("should throw an exception when an invalid value is set", function() {
			try {
				model.set_item("hi hi hi");
				expect(false).toBe(true);
			} catch (ignore) {
				expect(true).toBe(true);
			}
		});

		it("should not set values with an invalid value is set", function() {
			var orig = "one";
			model.set_item(orig);

			try {
				model.set_item("hi hi hi");
				expect(false).toBe(true);
			} catch (ignore) {
			}

			expect(model.get_item()).toBe(orig);
		});
	});
});
