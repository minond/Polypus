"use strict";

Polypus.Service("Ajax", {
	/**
	 * force settings on all requests. for testing
	 * @var object
	 */
	force: {
		url: null
	},

	/**
	 * @param object data
	 *  - string url
	 *  - string methdo
	 *  - strinl data
	 *  - function callback
	 * @return mixed XMLHttpRequest|string
	 */
	request: function(data) {
		var xhr = new XMLHttpRequest;

		xhr.open(data.method, this.force.url ? this.force.url : data.url,
			!!data.callback);

		if (data.callback) {
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					data.callback.call(xhr);
				}
			};
		}

		if (data.headers) {
			Polypus.adjutor.foreach(data.headers, function(header, value) {
				xhr.setRequestHeader(header, value);
			});
		}

		xhr.send(data.data);
		return data.callback ? xhr : xhr.responseText;
	},

	/**
	 * Ajax.request({ method: GET }) shortcut
	 * @param object data
	 * @return mixed XMLHttpRequest|string
	 */
	get: function(data) {
		data.method = "GET"
		return this.request(data);
	}
});
