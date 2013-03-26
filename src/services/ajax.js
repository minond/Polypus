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
	 *  - string data
	 *  - array headers
	 *  - function callback
	 *  - function before
	 *  - function after
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

		if (data.before) {
			data.before.call(xhr);
		}

		xhr.send(data.data);

		if (data.after) {
			data.after.call(xhr);
		}
		return data.callback ? xhr : xhr.responseText;
	},

	/**
	 * Ajax.request({ method: GET }) shortcut
	 * @param object data
	 * @return mixed XMLHttpRequest|string
	 */
	get: function(data) {
		data.method = "GET";
		return this.request(data);
	},

	/**
	 * Ajax.request({ method: POST }) shortcut
	 * @param object data
	 * @return mixed XMLHttpRequest|string
	 */
	post: function(data) {
		data.method = "POST";
		return this.request(data);
	}
});
