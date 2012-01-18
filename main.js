define([
	"./registry",
	"./default!",
	"es5-shim"
], function(registry, defaultTransport){
	registry.setDefault(defaultTransport);

	function request(method, url, options){
		var transports = registry.slice(0), dt;
		for(var i=0, l=transports.length; i<l; i++){
			var matcher = transports[i];
			if(matcher.apply(null, arguments)){
				return matcher.request.apply(null, arguments);
			}
		}
		if((dt = registry.defaultTransport)){
			return dt.apply(null, arguments);
		}
		throw new Error("No transport found");
	}

	return request;
});
