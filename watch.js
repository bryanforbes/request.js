define([
	'./util',
	'dojo/_base/array',
	'./has!request-no-addeventlistener?dojo/on:'
], function(util, array, on){
	// avoid setting a timer per request. It degrades performance on IE
	// something fierece if we don't use unified loops.
	var _inFlightIntvl = null,
		_inFlight = [];

	function watchInFlight(){
		var now = +(new Date);

		for(var i = 0, tif; i < _inFlight.length && (tif = _inFlight[i]); i++){
			var dfd = tif.dfd,
				responseData = tif.responseData,
				options = responseData.options;
			if(!dfd || dfd.canceled || !tif.validCheck(dfd, responseData)){
				_inFlight.splice(i--, 1);
			}else if(tif.ioCheck(dfd, responseData)){
				_inFlight.splice(i--, 1);
				tif.resHandle(dfd, responseData);
			}else if(options.startTime){
				// did we timeout?
				if(options.startTime + (options.timeout || 0) < now){
					_inFlight.splice(i--, 1);
					responseData.error = new Error('timeout exceeded');
					responseData.error.dojoType = 'timeout';
					//Cancel the request so the io module can do appropriate cleanup.
					dfd.cancel();
				}
			}
		}

		if(!_inFlight.length){
			clearInterval(_inFlightIntvl);
			_inFlightIntvl = null;
		}
	}

	function watch(dfd, responseData, validCheck, ioCheck, resHandle){
		if(responseData.options.timeout){
			responseData.options.startTime = +(new Date);
		}

		_inFlight.push({
			dfd: dfd,
			responseData: responseData,
			validCheck: validCheck,
			ioCheck: ioCheck,
			resHandle: resHandle
		});
		if(!_inFlightIntvl){
			_inFlightIntvl = setInterval(watchInFlight, 50);
		}

		if(responseData.options.sync){
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
		// IE needs to clean up
		on(window, 'unload', function(){
			watch.cancelAll();
		});
	}

	return watch;
});
