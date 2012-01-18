define([
	'module',
	'./watch',
	'./util',
	'./registry',
	'dojo/on',
	'dojo/dom',
	'dojo/dom-construct',
	'dojo/_base/sniff',
	'dojo/_base/window'
], function(module, watch, util, registry, on, dom, domConstruct, has, win){
	var mid = module.id.replace('/', '_').replace('.', '_').replace('-', '_'),
		counter = 0,
		loadEvent = has("ie") ? "readystatechange" : "load",
		readyRegExp = /complete|loaded/,
		callbacks = this[mid + "_callbacks"] = {},
		deadScripts = [];

	function jsonpCallback(json){
		this.options.response = json;
	}

	function attach(id, url, frameDoc){
		var doc = (frameDoc || win.doc),
			element = doc.createElement("script");

		element.type = "text/javascript";
		element.src = url;
		element.id = id;
		element.async = true;
		element.charset = "utf-8";

		return doc.getElementsByTagName("head")[0].appendChild(element);
	}

	function remove(id, frameDoc){
		domConstruct.destroy(dom.byId(mid + id, frameDoc));

		if(callbacks[id]){
			delete callbacks[id];
		}
	}

	function _addDeadScript(options){
		deadScripts.push({ id: options.id, frameDoc: options.frameDoc });
		options.frameDoc = null;
	}

	function _deferredCancel(dfd, options){
		dfd.canceled = true;
		if(options.canDelete){
			_addDeadScript(options);
		}
	}

	function _deferOk(options){
		if(options.canDelete){
			_addDeadScript(options);
		}

		return options;
	}

	function _deferError(error, options){
		if(options.canDelete){
			if(error.dojoType == "timeout"){
				//For timeouts, remove the script element immediately to
				//avoid a response from it coming back later and causing trouble.
				remove(options.id, options.frameDoc);
			}else{
				_addDeadScript(options);
			}
		}
		throw error;
	}

	function _validCheck(dfd, options){
		//Do script cleanup here. We wait for one inflight pass
		//to make sure we don't get any weird things by trying to remove a script
		//tag that is part of the call chain (IE 6 has been known to
		//crash in that case).
		if(deadScripts && deadScripts.length){
			deadScripts.forEach(function(script){
				remove(script.id, script.frameDoc);
				script.frameDoc = null;
			});
			deadScripts = [];
		}

		return true;
	}

	function _ioCheck(dfd, options){
		if(options.response || options.scriptLoaded){
			return true;
		}
		return false;
	}

	function _resHandle(dfd, options){
		if(_ioCheck(dfd, options)){
			dfd.callback(options);
		}else{
			dfd.errback(new Error("inconceivable request/script error"));
		}
	}

	function script(method, url, options){
		options = util.mix({}, options);

		var dfds = watch.deferreds(options, _deferredCancel, _deferOk, _deferError),
			dfd = dfds.deferred;

		options.id = counter++;
		options.scriptId = mid + options.id;
		options.canDelete = false;
		options.url = url;

		if(options.jsonp){
			url += (~url.indexOf("?") ? "&" : "?") +
				options.jsonp + "=" +
				(options.frameDoc ? "parent." : "") +
				mid + "_callbacks[" + options.id + "]._jsonpCallback";

			options.canDelete = true;
			options._jsonpCallback = jsonpCallback;
			callbacks[options.id] = {
				_jsonpCallback: jsonpCallback,
				options: options
			};
		}

		var node = attach(options.scriptId, url, options.frameDoc);

		if(!options.jsonp){
			var handle = on(node, loadEvent, function(evt){
				if(evt.type == "load" || readyRegExp.test(node.readyState)){
					handle.remove();
					options.scriptLoaded = evt;
				}
			});
		}

		watch(dfd, options, _validCheck, _ioCheck, _resHandle);

		return dfds.promise;
	}
	script.get = script;

	script.register = function(matcher, first){
		var m = util.createMatcher(matcher);

		matcher = function(method, url){
			if(method == 'GET'){
				return m.apply(null, arguments);
			}
			return false;
		};
		matcher.request = script;

		return registry.register(matcher, first);
	};

	return script;
});
