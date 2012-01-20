define([
   'require',
   'dojo/_base/Deferred',
   './util',
   './handlers'
], function(require, Deferred, util, handlers){
	var http = require.nodeRequire('http'),
		https = require.nodeRequire('https'),
		URL = require.nodeRequire('url'),
		undef;

	var defaultOptions = {
		method: 'GET',
		data: null,
		headers: {}
	};
	function request(url, options){
		var responseData = {
			url: url,
			options: (options = util.deepCreate(defaultOptions, options))
		};

		var def = new Deferred(function(){
			responseData.clientRequest.abort();
			if(responseData.error){
				return responseData.error;
			}
			var err = new Error("request cancelled");
			err.dojoType="cancel";

			return err;
		});

		url = URL.parse(url);

		var reqOptions = responseData.requestOptions = {
			host: url.hostname,
			method: options.method,
			port: url.port == undef ? 80 : url.port,
			headers: options.headers
		};
		if(url.path){
			reqOptions.path = url.path;
		}
		if(options.user || options.password){
			reqOptions.auth = (options.user||"") + ":" + (options.password||"");
		}
		var req = responseData.clientRequest = (url.protocol == 'https:' ? https : http).request(reqOptions);

		req.on('response', function(response){
			responseData.clientResponse = response;
			responseData.status = response.statusCode;

			var body = [];
			response.on('data', function(chunk){
				def.progress(chunk.toString());
				body.push(chunk);
			});
			response.on('end', function(){
				if(timeout){
					clearTimeout(timeout);
				}
				responseData.responseText = body.join('');
				handlers(responseData);
				def.resolve(responseData);
			});
		});

		req.on('error', function(e){
			def.reject(e);
		});

		if(options.data != undef){
			req.write(options.data);
		}

		req.end();

		if(options.timeout != undef){
			var timeout = setTimeout(function(){
				responseData.error = new Error("timeout exceeded");
				responseData.error.dojoType = "timeout";
				def.cancel();
			}, options.timeout);
		}

		return def.promise;
	}

	util.addCommonMethods(request);

	return request;
});
