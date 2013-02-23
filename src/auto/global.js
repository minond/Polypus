(function(global) {
	for (var prop in Polypus) {
		global[ prop ] = Polypus[ prop ];
	}
})(this);
