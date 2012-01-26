define([
	'exports',
	'dojo/io-query',
	'./has!request-es5?:es5-shim'
], function(exports, ioQuery){
	exports.mix = function mix(target, source){
		for(var name in source){
			if(target[name] !== source[name]){
				target[name] = source[name];
			}
		}
		return target;
	};

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
		var target = Object.create(source),
			name, value;

		for(name in source){
			value = source[name];

			if(value && typeof value == 'object'){
				target[name] = exports.deepCreate(value, properties[name]);
			}
		}
		return exports.deepCopy(target, properties);
	};

	var ap = Array.prototype,
		slice = ap.slice;
	exports.curry = function curry(func /*, args*/){
		var args = slice.call(arguments, 1);
		return function(){
			return func.apply(this, args.concat(slice.call(arguments, 0)));
		};
	};

	exports.addCommonMethods = function(provider){
		['GET', 'POST', 'PUT', 'DELETE'].forEach(function(method){
			provider[(method == 'DELETE' ? 'DEL' : method).toLowerCase()] = function(url, options){
				options = Object.create(options||{});
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
