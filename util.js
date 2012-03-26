define([
	'exports',
	'dojo/_base/Deferred',
	'dojo/io-query',
	'dojo/_base/array',
	'dojo/_base/lang'
], function(exports, Deferred, ioQuery, array, lang){
	exports.deepCopy = function deepCopy(target, source){
		for(var name in source){
			var tval = target[name],
				sval = source[name];
			if(tval !== sval){
				if(tval && typeof tval == 'object' && sval && typeof sval == 'object'){
					exports.deepCopy(tval, sval);
				}else{
					target[name] = sval;
				}
			}
		}
		return target;
	};

	exports.deepCreate = function deepCreate(source, properties){
		properties = properties || {};
		var target = lang.delegate(source),
			name, value;

		for(name in source){
			value = source[name];

			if(value && typeof value == 'object'){
				target[name] = exports.deepCreate(value, properties[name]);
			}
		}
		return exports.deepCopy(target, properties);
	};

	var freeze = Object.freeze || function(obj){ return obj; };
	exports.deferred = function deferred(data, cancel, ok, err, fnlly){
		var def = new Deferred(function(dfd){
			dfd.canceled = true;
			cancel(dfd, data);

			var err = data.error;
			if(!err){
				err = new Error('request cancelled');
				err.responseData = data;
				err.dojoType='cancel';
			}
			return err;
		});
		var okHandler = ok ?
			function(responseData){
				return freeze(ok(responseData));
			} :
			function(responseData){
				return freeze(responseData);
			};
		var errHandler = err ?
			function(error){
				error.responseData = data;
				err(error, data);
				throw error;
			} :
			function(error){
				error.responseData = data;
				throw error;
			};

		var promise = def.then(okHandler, errHandler);

		if(fnlly){
			def.then(
				function(responseData){
					fnlly(responseData);
				},
				function(error){
					fnlly(data, error);
					throw error;
				}
			);
		}

		def.promise = promise;
		def.then = promise.then;

		return def;
	};

	exports.addCommonMethods = function addCommonMethods(provider, methods){
		array.forEach(methods||['GET', 'POST', 'PUT', 'DELETE'], function(method){
			provider[(method == 'DELETE' ? 'DEL' : method).toLowerCase()] = function(url, options){
				options = lang.delegate(options||{});
				options.method = method;
				return provider(url, options);
			};
		});
	};

	exports.parseArgs = function parseArgs(url, options, skipData){
		var data = options.data,
			query = options.query;
		
		if(data && !skipData){
			if(typeof data == 'object'){
				options.data = ioQuery.objectToQuery(data);
			}
		}

		if(query){
			if(typeof query == 'object'){
				query = ioQuery.objectToQuery(query);
			}
			if(options.preventCache){
				query += (query ? '&' : '') + 'request.preventCache=' + +(new Date);
			}
		}else if(options.preventCache){
			query = 'request.preventCache=' + +(new Date);
		}

		if(url && query){
			url += (~url.indexOf('?') ? '&' : '?') + query;
		}

		return [url, options];
	};
});
