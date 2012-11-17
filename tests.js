var User = Model({
	first_name: "",
	last_name: "",
	gender: "",
	age: 0,
	get_name: function () {
		return this.first_name + " " + this.last_name;
	}
});

var marcos = new User;

marcos.observe("set", "first_name", function () {
	console.log("setting the first name property on marcos");
});

User.observe("set", "first_name", function () {
	console.log("setting the first name property on any user");
});

marcos.observe("before", "get_name", function () {
	console.log("about to return Marcos' full name");
});

User.observe("after", "get_name", function () {
	console.log("called get_name on any user");
});


marcos.set_first_name("Marcos");
marcos.set_last_name("Minond");
marcos.set_gender("Male");
marcos.set_age(23);

var marcos_full_name = marcos.get_name();
