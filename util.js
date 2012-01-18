define(["exports"], function(exports){
	exports.mix = function mix(target, source){
		for(var name in source){
			if(target[name] !== source[name]){
				target[name] = source[name];
			}
		}
		return target;
	};

	var ap = Array.prototype,
		slice = ap.slice;
	exports.curry = function curry(func /*, args*/){
		var args = slice.call(arguments, 1);
		return function(){
			return func.apply(this, args.concat(slice.call(arguments, 0)));
		};
	};

	exports.createMatcher = function(m, transport){
		var matcher;
		if(m.test){
			// RegExp
			matcher = function(method, url){
				return m.test(url);
			};
		}else if(m.apply && m.call){
			matcher = m;
		}else{
			matcher = function(method, url){
				return url == m;
			};
		}

		if(transport){
			matcher.request = transport;
		}

		return matcher;
	};
});
