"use strict";

Polypus.Service("Ajax", {
	/**
	 * @param object
	 *  - string url
	 *  - string methdo
	 *  - strinl data
	 *  - function callback
	 * @return mixed XMLHttpRequest|string
	 */
	request: function(data) {
		var xhr = new XMLHttpRequest;
		xhr.open(data.method, data.url, !!data.callback);
		xhr.send(data.data);

		if (data.callback) {
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					data.callback.call(xhr);
				}
			};
		}

		return data.callback ? xhr : xhr.responseText;
	},

	/**
	 * Ajax.request({ method: GET }) shortcut
	 * @param string url
	 * @param function callback
	 * @return mixed XMLHttpRequest|string
	 */
	get: function(url, callback) {
		return this.request({
			method: "GET",
			url: url,
			callback: callback
		});
	}
});
