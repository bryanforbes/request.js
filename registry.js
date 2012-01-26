define([
	'require',
	'dojo/_base/array',
	'./default!platform',
	'./util'
], function(require, array, fallbackProvider, util){
	var registry = [];

	function request(url, options){
		var matchers = registry.slice(0),
			i = 0,
			matcher;

		for(; matcher=matchers[i]; i++){
			if(matcher.apply(null, arguments)){
				return matcher.request.apply(null, arguments);
			}
		}

		return fallbackProvider.apply(null, arguments);
	}

	request.register = function(m, provider, first){
		var matcher = util.createMatcher(m, provider);
		registry[(first ? 'unshift' : 'push')](matcher);

		return {
			remove: function(){
				var idx;
				if(~(idx = array.indexOf(registry, matcher))){
					registry.splice(idx, 1);
				}
			}
		};
	};

	request.load = function(id, parentRequire, loaded, config){
		if(id){
			// if there's an id, load and set the fallback provider
			require([id], function(fallback){
				fallbackProvider = fallback;
				loaded(request);
			});
		}else{
			loaded(request);
		}
	};

	util.addCommonMethods(request);

	return request;
});
