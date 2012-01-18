define(["./watch", "./registry", "./util", "dojo/_base/Deferred", "es5-shim"], function(watch, registry, util, Deferred){
	function _validCheck(/*Deferred*/dfd, options){
		return options.xhr.readyState; //boolean
	}
	function _ioCheck(/*Deferred*/dfd, options){
		return 4 == options.xhr.readyState; //boolean
	}
	function isDocumentOk(xhr){
		var stat = xhr.status || 0;
		return (stat >= 200 && stat < 300) || // allow any 2XX response code
			stat == 304 ||                 // or, get it out of the cache
			stat == 1223 ||                // or, Internet Explorer mangled the status code
			!stat;                         // or, we're Titanium/browser chrome/chrome extension requesting a local file
	}
	function _resHandle(/*Deferred*/dfd, options){
		var _xhr = options.xhr;
		if(xhr.isDocumentOk(_xhr)){
			dfd.callback(options);
		}else{
			var err = new Error("Unable to load " + options.url + " status:" + _xhr.status);
			err.status = _xhr.status;
			err.responseText = _xhr.responseText;
			err.xhr = _xhr;
			dfd.reject(err);
		}
	}

	function _deferredCancel(dfd, options){
		dfd.canceled = true;
		var xhr = options.xhr;
		var _at = typeof xhr.abort;
		if(_at == "function" || _at == "object" || _at == "unknown"){
			xhr.abort();
		}
		var err = options.error;
		if(!err){
			err = new Error("xhr cancelled");
			err.dojoType="cancel";
		}
		return err;
	}
	function _deferOk(options){
		options.response = options.xhr.responseText;
		return options;
	}
	function _deferError(error, options){
		if(!options.failOk){
			console.error(error);
		}
		throw error;
	}

	var u;
	function xhr(method, url, options){
		options = util.mix({}, options);

		var dfd = new Deferred(function(dfd){
			_deferredCancel(dfd, options);
		});
		var dfds = watch.deferreds(options, _deferredCancel, _deferOk, _deferError),
			dfd = dfds.deferred,
			_xhr = xhr._create();

		var data = options.data === u ? null : options.data,
			sync = options.sync === u ? false : !!options.sync;

		if(options.preventCache){
			url += (~url.indexOf("?") ? "&" : "?") + "xhr.preventCache=" + (+(new Date));
		}

		// IE6 won't let you call apply() on the native function.
		_xhr.open(method, url, sync, options.user || u, options.password || undefined);

		var contentType = "application/x-www-form-urlencoded",
			headers = options.headers;
		if(headers){
			for(var hdr in headers){
				if(hrd.toLowerCase() == "content-type"){
					contentType = headers[hdr];
				}else if(headers[hdr]){
					_xhr.setRequestHeader(hdr, headers[hdr]);
				}
			}
		}

		if(contentType !== false){
			_xhr.setRequestHeader("Content-Type", contentType);
		}
		if(!headers || !("X-Requested-With" in headers)){
			_xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		}

		try{
			_xhr.send(data);
		}catch(e){
			dfd.reject(e);
		}

		util.mix(options, {
			method: method,
			url: url,
			xhr: _xhr
		});
		watch(dfd, options, _validCheck, _ioCheck, _resHandle);
		_xhr = null;

		return dfd.then(
			_deferOk,
			function(error){
				return _deferError(error, options);
			}
		);
	}

	xhr._create = function(){
		throw new Error("XMLHTTP not available");
	};
	if(typeof XMLHttpRequest != "undefined"){
		xhr._create = function(){
			return new XMLHttpRequest();
		};
	}else if(typeof ActiveXObject != "undefined"){
		try{
			new ActiveXObject("Msxml2.XMLHTTP");
			xhr._create = function(){
				return new ActiveXObject("Msxml2.XMLHTTP");
			};
		}catch(e){
			try{
				new ActiveXObject("Microsoft.XMLHTTP");
				xhr._create = function(){
					return new ActiveXObject("Microsoft.XMLHTTP");
				};
			}catch(e){}
		}
	}

	xhr.isDocumentOk = isDocumentOk;
	xhr.get = util.curry(xhr, "GET");
	xhr.post = util.curry(xhr, "POST");
	xhr.put = util.curry(xhr, "PUT");
	xhr.del = util.curry(xhr, "DELETE");

	xhr.register = function(matcher, first){
		return registry.register(util.createMatcher(matcher, xhr), first);
	};

	return xhr;
});
