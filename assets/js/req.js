class HttpRequest {
	constructor(method, opts) {
		var xhr = new XMLHttpRequest();
		this.xhr = xhr;
		this.method = method || 'GET';
		this.url = opts.url || console.assert (opts.url, 'url needed to create a request');

		//Holds POST/PUT data
		if (this.method == 'POST' && opts.data) this.data = opts.data || null;

		//Set state functions, if necessary
		if (opts.progressState) this.xhr.addEventListener('progress', opts.progressState);
		if (opts.loadedState) this.xhr.addEventListener('load', opts.loadedState);
		if (opts.errorState) this.xhr.addEventListener('error', opts.errorState);
		if (opts.abortState) this.xhr.addEventListener('abort', opts.abortState);

		//User methods for success error
		var success = opts.success || function (e) { console.log (e); };
		var error = opts.error || function (e) { console.log (e); };
		this.xhr.onreadystatechange = function () {
			if (this.readyState === XMLHttpRequest.DONE && this.status == 200) success.call(null, xhr);
			else if (this.readyState === XMLHttpRequest.DONE && this.status != 200) error.call(null, xhr);
		};
	}

	addTimeout(after, callback) {
		this.xhr.timeout = after;
		if (callback) this.xhr.ontimeout = callback;
	}

	captureHeaders (headers) {
		this.xhr.onreadystatechange = () => {
			if (this.readyState === this.HEADERS_RECEIVED) {
				for (var k in headers)
					this.headers[k] = xhr.getResponseHeader (k);

				this.headers["content-length"] = xhr.getResponseHeader ("content-length") || 0;
			}
		};
	}

	setHeaders (headers) {
		if (typeof headers === 'Object' && headers.length > 0)
			for (var k in headers)
				this.xhr.setRequestHeader (k, headers[k]);
	}

	send () {
		this.xhr.open (this.method, this.url);
		this.xhr.send (this.data);
	}
}
