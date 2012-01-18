define([
	'./fallback!',
	'./util'
], function(fallbackTransport, util){
	var registry = [];

	function transport(method, url, options){
		var matchers = registry.slice(0),
			i = 0,
			matcher;

		for(; matcher=matchers[i]; i++){
			if(matcher.apply(null, arguments)){
				return matcher.request.apply(null, arguments);
			}
		}

		return fallbackTransport.apply(null, arguments);
	}

	transport.register = function(m, transport, first){
		var matcher = util.createMatcher(m, transport);
		registry[(first ? "unshift" : "push")](matcher);

		return {
			remove: function(){
				var idx;
				if(~(idx = registry.indexOf(matcher))){
					registry.splice(idx, 1);
				}
			}
		};
	};

	util.addCommonMethods(transport);

	return transport;
});
