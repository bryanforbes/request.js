define([
	'exports',
	'dojo/io-query',
	'dojo/_base/array',
	'dojo/_base/lang'
], function(exports, ioQuery, array, lang){
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

	exports.addCommonMethods = function(provider){
		array.forEach(['GET', 'POST', 'PUT', 'DELETE'], function(method){
			provider[(method == 'DELETE' ? 'DEL' : method).toLowerCase()] = function(url, options){
				options = lang.delegate(options||{});
				options.method = method;
				return provider(url, options);
			};
		});
	};

	exports.createMatcher = function(m, provider){
		var matcher;
		if(m.test){
			// RegExp
			matcher = function(url){
				return m.test(url);
			};
		}else if(m.apply && m.call){
			matcher = m;
		}else{
			matcher = function(url){
				return url === m;
			};
		}

		if(provider){
			matcher.request = provider;
		}

		return matcher;
	};

	exports.parseArgs = function(url, options){
		var data = options.data,
			query = options.query;
		
		if(data){
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

		if(query){
			url += (~url.indexOf('?') ? '&' : '?') + query;
		}

		return [url, options];
	};
});
