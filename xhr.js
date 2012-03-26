define([
	'./watch',
	'./handlers',
	'./util',
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'dojo/has'
], function(watch, handlers, util, lang, Deferred, has){
	function _validCheck(/*Deferred*/dfd, responseData){
		return responseData.xhr.readyState; //boolean
	}
	function _ioCheck(/*Deferred*/dfd, responseData){
		return 4 == responseData.xhr.readyState; //boolean
	}
	function isDocumentOk(xhr){
		var stat = xhr.status || 0;
		return (stat >= 200 && stat < 300) || // allow any 2XX response code
			stat == 304 ||                 // or, get it out of the cache
			stat == 1223 ||                // or, Internet Explorer mangled the status code
			!stat;                         // or, we're Titanium/browser chrome/chrome extension requesting a local file
	}
	function _resHandle(/*Deferred*/dfd, responseData){
		var _xhr = responseData.xhr;
		if(xhr.isDocumentOk(_xhr)){
			dfd.callback(responseData);
		}else{
			var err = new Error('Unable to load ' + responseData.url + ' status:' + _xhr.status);
			responseData.status = _xhr.status;
			if(responseData.options.handleAs == "xml"){
				responseData.response = _xhr.responseXML;
			}else{
				responseData.text = _xhr.responseText;
			}
			dfd.reject(err);
		}
	}

	function _deferredCancel(dfd, responseData){
		var xhr = responseData.xhr;
		var _at = typeof xhr.abort;
		if(_at == 'function' || _at == 'object' || _at == 'unknown'){
			xhr.abort();
		}
	}
	function _deferOk(responseData){
		var _xhr = responseData.xhr;
		if(responseData.options.handleAs == "xml"){
			responseData.response = _xhr.responseXML;
		}else{
			responseData.text = _xhr.responseText;
		}
		responseData.status = responseData.xhr.status;
		handlers(responseData);
		return responseData;
	}
	function _deferError(error, responseData){
		if(!responseData.options.failOk){
			console.error(error);
		}
	}

	var undef,
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
		var args = util.parseArgs(url, util.deepCreate(defaultOptions, options));

		var responseData = {
			url: url = args[0],
			options: options = args[1]
		};

		var dfd = util.deferred(responseData, _deferredCancel, _deferOk, _deferError),
			_xhr = xhr._create();

		var data = options.data,
			sync = !!options.sync,
			method = options.method;

		// IE6 won't let you call apply() on the native function.
		_xhr.open(method, url, sync, options.user || undef, options.password || undef);

		var headers = options.headers,
			contentType;
		if(headers){
			for(var hdr in headers){
				if(hdr.toLowerCase() == 'content-type'){
					contentType = headers[hdr];
				}else if(headers[hdr]){
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
			_xhr.send(data);
		}catch(e){
			dfd.reject(e);
		}

		lang.mixin(responseData, {
			xhr: _xhr
		});
		watch(dfd, responseData, _validCheck, _ioCheck, _resHandle);
		_xhr = null;

		return dfd.promise;
	}

	xhr._create = function(){
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
