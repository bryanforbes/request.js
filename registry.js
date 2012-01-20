define([
	'require',
	'./default!platform',
	'./util'
], function(require, fallbackTransport, util){
	var registry = [];

	function transport(url, options){
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

	transport.load = function(id, parentRequire, loaded, config){
		if(id){
			// if there's an id, load and set the fallback transport
			require([id], function(fallback){
				fallbackTransport = fallback;
				loaded(transport);
			});
		}else{
			loaded(transport);
		}
	};

	util.addCommonMethods(transport);

	return transport;
});
