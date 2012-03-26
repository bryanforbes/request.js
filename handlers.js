define([
	'dojo/json',
	'dojo/_base/kernel',
	'dojo/_base/array',
	'dojo/has'
], function(JSON, kernel, array, has){
	has.add('activex', typeof ActiveXObject != "undefined");

	var handleXML;
	if(has('activex')){
		var dp = array.map([6, 4, 3, 2], function(n){
			return 'MSXML' + n + '.DOMDocument';
		});
		dp.unshift('Microsoft.XMLDOM');

		handleXML = function(responseData){
			var result = responseData.response;

			if(!result || !result.documentElement){
				var text = responseData.text;
				array.some(dp, function(p){
					try{
						var dom = new ActiveXObject(p);
						dom.async = false;
						dom.loadXML(text);
						result = dom;
					}catch(e){ return false; }
					return true;
				});
			}

			return result;
		};
	}

	var handlers = {
		'javascript': function(responseData){
			return kernel.eval(responseData.text || '');
		},
		'json': function(responseData){
			return JSON.parse(responseData.text || null);
		},
		'xml': handleXML
	};

	function handle(responseData){
		var handler = handlers[responseData.options.handleAs];

		responseData.response = handler ? handler(responseData) : (responseData.response || responseData.text);

		return responseData;
	}

	handle.register = function(name, handler){
		handlers[name] = handler;
	};

	return handle;
});
