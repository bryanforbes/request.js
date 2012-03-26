define([
	'exports',
	'require',
	'dojo/has'
], function(exports, require, has){
	var defId = has('config-requestProvider'),
		platformId;

	if(has('host-browser')){
		platformId = './xhr';
	}else if(has('host-node')){
		platformId = './node';
	}else if(has('host-rhino')){
		platformId = './rhino';
	}

	if(!defId){
		defId = platformId;
	}

	exports.getPlatformDefaultId = function(){
		return platformId;
	};

	exports.load = function(id, parentRequire, loaded, config){
		require([id == 'platform' ? platformId : defId], function(provider){
			loaded(provider);
		});
	};
});
