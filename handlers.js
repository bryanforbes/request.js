define([
	'dojo/json',
	'./has'
], function(JSON, has){
	var handleXML = function(responseData){
		return responseData.xhr.responseXML;
	};
	if(has('request-activex')){
		var dp = [6, 4, 3, 2].map(function(n){
			return 'MSXML' + n + '.DOMDocument';
		});
		dp.unshift('Microsoft.XMLDOM');

		handleXML = function(responseData){
			var result = responseData.xhr.responseXML;

			if(!result || !result.documentElement){
				var text = responseData.responseText;
				dp.some(function(p){
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
		'json': function(responseData){
			return JSON.parse(responseData.responseText || null);
		},
		'xml': handleXML
	};
	function handle(responseData){
		var handler = handlers[responseData.options.handleAs];

		responseData.response = handler ? handler(responseData) : responseData.responseText;
	}

	handle.register = function(name, handler){
		handlers[name] = handler;
	};

	return handle;
});
