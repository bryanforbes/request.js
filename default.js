define(['exports', 'require', 'dojo/has'], function(exports, require, has){
	var defId = has('config-defaultTransport');

	if(!defId){
		if(has('host-browser')){
			defId = './xhr';
		}else if(has('host-node')){
			defId = './node';
		}else if(has('host-rhino')){
			defId = './rhino';
		}
	}

	exports.load = function(id, parentRequire, loaded, config){
		require([defId], function(transport){
			loaded(transport);
		});
	};
});
