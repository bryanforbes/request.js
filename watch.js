define([
	"./util",
	"dojo/_base/Deferred",
	"dojo/has!dom-addeventlistener?:dojo/on"
], function(util, Deferred, on){
	// avoid setting a timer per request. It degrades performance on IE
	// something fierece if we don't use unified loops.
	var _inFlightIntvl = null,
		_inFlight = [];

	function watchInFlight(){
		var now = +(new Date);

		for(var i = 0, tif; i < _inFlight.length && (tif = _inFlight[i]); i++){
			var dfd = tif.dfd,
				options = tif.options;
			if(!dfd || dfd.canceled || !tif.validCheck(dfd, options)){
				_inFlight.splice(i--, 1);
			}else if(tif.ioCheck(dfd, options)){
				_inFlight.splice(i--, 1);
				tif.resHandle(dfd, options);
			}else if(options.startTime){
				// did we timeout?
				if(options.startTime + (options.timeout || 0) < now){
					_inFlight.splice(i--, 1);
					var err = new Error("timeout exceeded");
					err.dojoType = "timeout";
					dfd.errback(err);
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

	function watch(dfd, options, validCheck, ioCheck, resHandle){
		if(options.timeout){
			options.startTime = +(new Date);
		}

		_inFlight.push({
			dfd: dfd,
			options: options,
			validCheck: validCheck,
			ioCheck: ioCheck,
			resHandle: resHandle
		});
		if(!_inFlightIntvl){
			_inFlightIntvl = setInterval(watchInFlight, 50);
		}

		if(options.sync){
			watchInFlight();
		}
	}

	watch.deferreds = function deferreds(options, cancel, ok, err){
		var def = new Deferred(function(dfd){
				cancel(dfd, options);
			}),
			promise = def.then(
				ok,
				function(error){
					try{
						err(error, options);
					}catch(e){}
				}
			);

		return {
			deferred: def,
			promise: promise
		};
	};

	watch.cancelAll = function cancelAll(){
		try{
			_inFlight.forEach(function(i){
				try{
					i.dfd.cancel();
				}catch(e){}
			});
		}catch(e){}
	};

	if(on && document.attachEvent){
		// IE needs to clean up
		on(window, "unload", function(){
			watch.cancelAll();
		});
	}

	return watch;
});
