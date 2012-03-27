define([
	'./util',
	'dojo/_base/array',
	'dojo/has!host-browser?dom-addeventlistener?:dojo/on:'
], function(util, array, on){
	// avoid setting a timer per request. It degrades performance on IE
	// something fierece if we don't use unified loops.
	var _inFlightIntvl = null,
		_inFlight = [];

	function watchInFlight(){
		//summary:
		//		internal method that checks each inflight XMLHttpRequest to see
		//		if it has completed or if the timeout situation applies.

		var now = +(new Date);

		// we need manual loop because we often modify _inFlight (and therefore 'i') while iterating
		for(var i = 0, tif, dfd; i < _inFlight.length && (tif = _inFlight[i]); i++){
			var response = tif.response,
				options = response.options;
			dfd = tif.dfd;
			if(!dfd || dfd.canceled || (tif.validCheck && !tif.validCheck(dfd, response))){
				_inFlight.splice(i--, 1);
				watch._onAction && watch._onAction();
			}else if(tif.ioCheck && tif.ioCheck(dfd, response)){
				_inFlight.splice(i--, 1);
				tif.resHandle(dfd, response);
				watch._onAction && watch._onAction();
			}else if(options.startTime){
				// did we timeout?
				if(options.startTime + (options.timeout || 0) < now){
					_inFlight.splice(i--, 1);
					response.error = new Error('timeout exceeded');
					response.error.dojoType = 'timeout';
					//Cancel the request so the io module can do appropriate cleanup.
					dfd.cancel();
					watch._onAction && watch._onAction();
				}
			}
		}

		watch._onInFlight && watch._onInFlight(dfd);

		if(!_inFlight.length){
			clearInterval(_inFlightIntvl);
			_inFlightIntvl = null;
		}
	}

	function watch(dfd, response, validCheck, ioCheck, resHandle){
		if(response.options.timeout){
			response.options.startTime = +(new Date);
		}

		_inFlight.push({
			dfd: dfd,
			response: response,
			validCheck: validCheck,
			ioCheck: ioCheck,
			resHandle: resHandle
		});
		if(!_inFlightIntvl){
			_inFlightIntvl = setInterval(watchInFlight, 50);
		}

		// handle sync requests
		//A weakness: async calls in flight
		//could have their handlers called as part of the
		//_watchInFlight call, before the sync's callbacks
		// are called.
		if(response.options.sync){
			watchInFlight();
		}
	}

	watch.cancelAll = function cancelAll(){
		try{
			array.forEach(_inFlight, function(i){
				try{
					i.dfd.cancel();
				}catch(e){}
			});
		}catch(e){}
	};

	if(on && document.attachEvent){
		// Automatically call cancel all io calls on unload in IE
		// http://bugs.dojotoolkit.org/ticket/2357
		on(window, 'unload', function(){
			watch.cancelAll();
		});
	}

	return watch;
});
