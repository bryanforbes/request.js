define([
	'require',
	'dojo/on',
	'./watch',
	'./handlers',
	'./util'
], function(require, on, watch, handlers, util){
	function validCheck(dfd, response){
		// summary: Check to see if the request should be taken out of the watch queue
		return !dfd._finished;
	}

	function cancel(dfd, response){
		// summary: Canceller for deferred
		response.xhr.abort();
	}

	function resolve(response){
		// summary: okHandler function for util.deferred call.
		var _xhr = response.xhr;
		if(response.options.handleAs == 'xml'){
			response.data = _xhr.responseXML;
		}else{
			response.text = _xhr.responseText;
		}
		response.status = response.xhr.status;
		handlers(response);
		return response;
	}

	function reject(err, response){
		// summary: errHandler function for util.deferred call.
		if(!response.options.failOk){
			console.error(err);
		}
	}

	function error(_xhr, dfd, response){
		// summary: Handles the error state within the event handlers
		response.status = _xhr.status;
		if(response.options.handleAs == 'xml'){
			response.data = _xhr.responseXML;
		}else{
			response.text = _xhr.responseText;
		}

		var err = new Error('Unable to load ' + response.url + ' status: ' + response.status);
		err.log = false;
		dfd.reject(err);
	}

	function addListeners(_xhr, dfd, response){
		// summary: Adds event listeners to the XMLHttpRequest object
		function onLoad(evt){
			dfd._finished = 1;
			var _xhr = evt.target;
			if(util.checkStatus(_xhr.status)){
				dfd.resolve(response);
			}else{
				error(_xhr, dfd, response);
			}
		}
		function onError(evt){
			dfd._finished = 1;
			error(evt.target, dfd, response);
		}
		function onAbort(evt){
			dfd._finished = 1;
		}

		function onProgress(evt){
			if(evt.lengthComputable){
				response.loaded = evt.loaded;
				response.total = evt.total;
				dfd.progress(response);
			}
		}

		return [
			on(_xhr, 'load', onLoad),
			on(_xhr, 'error', onError),
			on(_xhr, 'abort', onAbort),
			on(_xhr, 'progress', onProgress)
		];
	}

	var undefined,
		defaultOptions = {
			data: null,
			query: null,
			sync: false,
			method: 'GET',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		};

	function xhr(url, options){
		//	summary:
		//		Sends an HTTP request with the given URL and options.
		//	description:
		//		Sends an HTTP request with the given URL.
		//	url:
		//		URL to request

		function fnlly(){
			// Clean up event handlers for garbage collection.
			if(!handlers){ return; }
			var i=handlers.length;
			while(i--){
				handlers[i].remove();
			}
		}

		var args = util.parseArgs(url, util.deepCreate(defaultOptions, options));

		var response = {
			url: url = args[0],
			options: options = args[1]
		};

		//Make the Deferred object for this xhr request.
		var dfd = util.deferred(response, cancel, resolve, reject, fnlly),
			_xhr = response.xhr = new XMLHttpRequest();

		//If XHR factory fails, cancel the deferred.
		if(!_xhr){
			dfd.cancel();
			return dfd.promise;
		}

		var handlers = addListeners(_xhr, dfd, response);

		var data = options.data,
			sync = !options.sync,
			method = options.method;

		_xhr.open(method, url, sync, options.user || undefined, options.password || undefined);

		var headers = options.headers,
			contentType;
		if(headers){
			for(var hdr in headers){
				if(hdr.toLowerCase() == 'content-type'){
					contentType = headers[hdr];
				}else if(headers[hdr]){
					//Only add header if it has a value. This allows for instance, skipping
					//insertion of X-Requested-With by specifying empty value.
					_xhr.setRequestHeader(hdr, headers[hdr]);
				}
			}
		}

		if(contentType && contentType !== false){
			_xhr.setRequestHeader('Content-Type', contentType);
		}
		if(!headers || !('X-Requested-With' in headers)){
			_xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		}

		try{
			var notify = require('./notify');
			notify.send(response);
		}catch(e){}
		try{
			_xhr.send(data);
		}catch(e){
			response.error = e;
			dfd.reject(e);
		}

		watch(dfd, response, validCheck);
		_xhr = null;

		return dfd.promise;
	}

	util.addCommonMethods(xhr);

	return xhr;
});
