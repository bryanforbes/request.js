define([
	'require',
	'./watch',
	'./handlers',
	'./util',
	'dojo/has'
], function(require, watch, handlers, util, has){
	function _validCheck(/*Deferred*/dfd, response){
		return response.xhr.readyState; //boolean
	}
	function _ioCheck(/*Deferred*/dfd, response){
		return 4 == response.xhr.readyState; //boolean
	}
	function isDocumentOk(xhr){
		var stat = xhr.status || 0;
		return (stat >= 200 && stat < 300) || // allow any 2XX response code
			stat == 304 ||                 // or, get it out of the cache
			stat == 1223 ||                // or, Internet Explorer mangled the status code
			!stat;                         // or, we're Titanium/browser chrome/chrome extension requesting a local file
	}
	function _resHandle(/*Deferred*/dfd, response){
		var _xhr = response.xhr;
		if(xhr.isDocumentOk(_xhr)){
			dfd.resolve(response);
		}else{
			var err = new Error('Unable to load ' + response.url + ' status: ' + _xhr.status);
			response.status = _xhr.status;
			if(response.options.handleAs == "xml"){
				response.response = _xhr.responseXML;
			}else{
				response.text = _xhr.responseText;
			}
			dfd.reject(err);
		}
	}

	function _deferredCancel(dfd, response){
		// summary: canceller function for util.deferred call.
		var xhr = response.xhr;
		var _at = typeof xhr.abort;
		if(_at == 'function' || _at == 'object' || _at == 'unknown'){
			xhr.abort();
		}
	}
	function _deferOk(response){
		// summary: okHandler function for util.deferred call.
		var _xhr = response.xhr;
		if(response.options.handleAs == "xml"){
			response.data = _xhr.responseXML;
		}else{
			response.text = _xhr.responseText;
		}
		response.status = response.xhr.status;
		handlers(response);
		return response;
	}
	function _deferError(error, response){
		// summary: errHandler function for util.deferred call.
		if(!response.options.failOk){
			console.error(error);
		}
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
	function xhr(/*String*/ url, /*Object?*/ options){
		//	summary:
		//		Sends an HTTP request with the given URL and options.
		//	description:
		//		Sends an HTTP request with the given URL.
		//	url:
		//		URL to request
		var args = util.parseArgs(url, util.deepCreate(defaultOptions, options));

		var response = {
			url: url = args[0],
			options: options = args[1]
		};

		//Make the Deferred object for this xhr request.
		var dfd = util.deferred(response, _deferredCancel, _deferOk, _deferError),
			_xhr = response.xhr = xhr._create();

		//If XHR factory fails, cancel the deferred.
		if(!_xhr){
			dfd.cancel();
			return dfd.promise;
		}

		var data = options.data,
			sync = !!options.sync,
			method = options.method;

		// IE6 won't let you call apply() on the native function.
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

		watch(dfd, response, _validCheck, _ioCheck, _resHandle);
		_xhr = null;

		return dfd.promise;
	}

	xhr._create = function(){
		// summary:
		//		does the work of portably generating a new XMLHTTPRequest object.
		throw new Error('XMLHTTP not available');
	};
	if(has('native-xhr')){
		xhr._create = function(){
			return new XMLHttpRequest();
		};
	}else if(has('activex')){
		try{
			new ActiveXObject('Msxml2.XMLHTTP');
			xhr._create = function(){
				return new ActiveXObject('Msxml2.XMLHTTP');
			};
		}catch(e){
			try{
				new ActiveXObject('Microsoft.XMLHTTP');
				xhr._create = function(){
					return new ActiveXObject('Microsoft.XMLHTTP');
				};
			}catch(e){}
		}
	}

	xhr.isDocumentOk = isDocumentOk;
	util.addCommonMethods(xhr);

	return xhr;
});
