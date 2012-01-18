define(['require', './registry', 'dojo/_base/Deferred'], function(require, registry, Deferred){
	var http = require.nodeRequire('http'),
		URL = require.nodeRequire('url');

	function request(method, url, options){
		var def = new Deferred(function(){
			req.abort();
		});

		url = URL.parse(url);
		
		var req = http.request({
			hostname: url.hostname,
			port: url.port,
			path: url.path,
			auth: url.auth
		}, function(res){
			def.resolve(res);
		});

		req.on('error', function(e){
			def.reject(e);
		});

		return def.promise;
	}

	return request;
});
