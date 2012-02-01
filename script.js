define([
	'module',
	'./watch',
	'./util',
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/on',
	'dojo/dom',
	'dojo/dom-construct',
	'dojo/_base/sniff',
	'dojo/_base/window'
], function(module, watch, util, array, lang, on, dom, domConstruct, has, win){
	var mid = module.id.replace('/', '_').replace('.', '_').replace('-', '_'),
		counter = 0,
		loadEvent = has('ie') ? 'readystatechange' : 'load',
		readyRegExp = /complete|loaded/,
		callbacks = this[mid + '_callbacks'] = {},
		deadScripts = [];

	function jsonpCallback(json){
		this.responseData.response = json;
	}

	function attach(id, url, frameDoc){
		var doc = (frameDoc || win.doc),
			element = doc.createElement('script');

		element.type = 'text/javascript';
		element.src = url;
		element.id = id;
		element.async = true;
		element.charset = 'utf-8';

		return doc.getElementsByTagName('head')[0].appendChild(element);
	}

	function remove(id, frameDoc){
		domConstruct.destroy(dom.byId(mid + id, frameDoc));

		if(callbacks[id]){
			delete callbacks[id];
		}
	}

	function _addDeadScript(responseData){
		deadScripts.push({ id: responseData.id, frameDoc: responseData.options.frameDoc });
		responseData.options.frameDoc = null;
	}

	function _deferredCancel(dfd, responseData){
		if(responseData.canDelete){
			_addDeadScript(responseData);
		}
		var err = responseData.error;
		if(!err){
			err = new Error('script cancelled');
			err.dojoType='cancel';
		}
		return err;
	}

	function _deferOk(responseData){
		if(responseData.canDelete){
			_addDeadScript(responseData);
		}

		return responseData;
	}

	function _deferError(error, responseData){
		if(responseData.canDelete){
			if(error.dojoType == 'timeout'){
				//For timeouts, remove the script element immediately to
				//avoid a response from it coming back later and causing trouble.
				remove(responseData.id, responseData.options.frameDoc);
			}else{
				_addDeadScript(responseData);
			}
		}
	}

	function _validCheck(dfd, responseData){
		//Do script cleanup here. We wait for one inflight pass
		//to make sure we don't get any weird things by trying to remove a script
		//tag that is part of the call chain (IE 6 has been known to
		//crash in that case).
		if(deadScripts && deadScripts.length){
			array.forEach(deadScripts, function(script){
				remove(script.id, script.frameDoc);
				script.frameDoc = null;
			});
			deadScripts = [];
		}

		return true;
	}

	function _ioCheck(dfd, responseData){
		if(responseData.response || responseData.scriptLoaded){
			return true;
		}
		return false;
	}

	function _resHandle(dfd, responseData){
		if(_ioCheck(dfd, responseData)){
			dfd.callback(responseData);
		}else{
			dfd.errback(new Error('inconceivable request/script error'));
		}
	}

	function script(url, options){
		var args = util.parseArgs(url, util.deepCopy({}, options));

		var responseData = {
			url: url = args[0],
			options: options = args[1]
		};

		var dfd = util.deferred(responseData, _deferredCancel, _deferOk, _deferError);

		lang.mixin(responseData, {
			id: counter++,
			canDelete: false
		});
		responseData.scriptId = mid + responseData.id;

		if(options.jsonp){
			url += (~url.indexOf('?') ? '&' : '?') +
				options.jsonp + '=' +
				(options.frameDoc ? 'parent.' : '') +
				mid + '_callbacks[' + responseData.id + ']._jsonpCallback';

			responseData.canDelete = true;
			callbacks[responseData.id] = {
				_jsonpCallback: jsonpCallback,
				responseData: responseData
			};
		}

		var node = attach(responseData.scriptId, url, responseData.frameDoc);

		if(!options.jsonp){
			var handle = on(node, loadEvent, function(evt){
				if(evt.type == 'load' || readyRegExp.test(node.readyState)){
					handle.remove();
					responseData.scriptLoaded = evt;
				}
			});
		}

		watch(dfd, responseData, _validCheck, _ioCheck, _resHandle);

		return dfd.promise;
	}
	script.get = script;

	return script;
});
