define([
	'module',
	'require',
	'./watch',
	'./util',
	'./handlers',
	'dojo/_base/lang',
	'dojo/query',
	'dojo/has',
	'dojo/dom',
	'dojo/dom-construct',
	'dojo/_base/window'
], function(module, require, watch, util, handlers, lang, query, has, dom, domConstruct, win){
	var mid = module.id.replace(/[\/\.-]/g, '_'),
		onload = mid + "_onload",
		global = this,
		queue = [],
		current = null;

	if(!win.global[onload]){
		win.global[onload] = function(){
			var data = current;
			if(!data){
				iframe._fireNextRequest();
				return;
			}

			var responseData = data[1],
				options = responseData.options,
				formNode = dom.byId(options.form);

			if(formNode){
				// remove all the hidden content inputs
				var toClean = responseData._contentToClean;
				for(var i=0; i<toClean.length; i++){
					var key = toClean[i];
					//Need to cycle over all nodes since we may have added
					//an array value which means that more than one node could
					//have the same .name value.
					for(var j=0; j<formNode.childNodes.length; j++){
						var childNode = formNode.childNodes[j];
						if(childNode.name == key){
							domConstruct.destroy(childNode);
							break;
						}
					}
				}

				// restore original action + target
				responseData._originalAction && formNode.setAttribute("action", responseData._originalAction);
				if(responseData._originalTarget){
					formNode.setAttribute("target", responseData._originalTarget);
					formNode.target = responseData._originalTarget;
				}
			}

			responseData._finished = true;
		};
	}

	function create(name, onloadstr, uri){
		if(win.global[name]){
			return win.global[name];
		}

		if(win.global.frames[name]){
			return win.global.frames[name];
		}

		if(!uri){
			if(has('config-useXDomain') && !has('config-dojoBlankHtmlUrl')){
				console.warn("dojo/request/iframe: When using cross-domain Dojo builds," +
					" please save dojo/resources/blank.html to your domain and set dojoConfig.dojoBlankHtmlUrl" +
					" to the path on your domain to blank.html");
			}
			uri = (has('config-dojoBlankHtmlUrl')||require.toUrl('dojo/resources/blank.html'));
		}

		var frame = domConstruct.place(
			'<iframe id="'+name+'" name="'+name+'" src="'+uri+'" onload="'+onloadstr+
			'" style="position: absolute; left: 1px; top: 1px; height: 1px; width: 1px; visibility: hidden">',
			win.body());

		win.global[name] = frame;

		return frame;
	}

	function setSrc(iframe, src, replace){
		var frame = global.frames[iframe.name];

		try{
			if(!frame.contentWindow){
				frame.src = src;
			}else if(!replace || !frame.contentWindow.document){
				frame.contentWindow.location = src;
			}else{
				frame.contentWindow.location.replace(src);
			}
		}catch(e){
			console.log("dojo/request/iframe.setSrc: ", e);
		}
	}

	function doc(iframeNode){
		if(iframeNode.contentDocument){
			return iframeNode.contentDocument;
		}
		var name = iframeNode.name;
		if(name){
			var iframes = win.doc.getElementsByTagName("iframe");
			if(iframeNode.document && iframes[name].contentWindow && iframes[name].contentWindow.document){
				return iframes[name].contentWindow.document;
			}else if(win.doc.frames[name] && win.doc.frames[name].document){
				return win.doc.frames[name].document;
			}
		}
		return null;
	}

	function fireNextRequest(){
		// summary: Internal method used to fire the next request in the queue.
		try{
			if(current || !queue.length){
				return;
			}
			do{
				var data = current = queue.shift();
			}while(data && data[0].canceled && queue.length);

			if(!data || data[0].canceled){
				current = null;
				return;
			}

			var dfd = data[0],
				responseData = data[1],
				options = responseData.options,
				c2c = responseData._contentToClean = [],
				formNode = dom.byId(options.form);

			data = options.data || null;

			if(formNode){
				// if we have things in data, we need to add them to the form
				// before submission
				if(data){
					var createInput = function(name, value){
						domConstruct.create('input', {
							type: 'hidden',
							name: name,
							value: value
						}, formNode);
						c2c.push(name);
					};
					for(var x in data){
						var val = data[x];
						if(lang.isArray(val) && val.length > 1){
							for(var i=0; i<val.length; i++){
								createInput(x, val[i]);
							}
						}else{
							if(!formNode[x]){
								createInput(x, val);
							}else{
								formNode[x].value = val;
							}
						}
					}
				}

				//IE requires going through getAttributeNode instead of just getAttribute in some form cases,
				//so use it for all.  See #2844
				var actionNode = formNode.getAttributeNode("action"),
					methodNode = formNode.getAttributeNode("method"),
					targetNode = formNode.getAttributeNode("target");

				if(responseData.url){
					responseData._originalAction = actionNode ? actionNode.value : null;
					if(actionNode){
						actionNode.value = responseData.url;
					}else{
						formNode.setAttribute("action", responseData.url);
					}
				}
				if(methodNode){
					methodNode.value = options.method;
				}else{
					formNode.setAttribute("method", options.method);
				}

				responseData._originalTarget = targetNode ? targetNode.value : null;
				if(targetNode){
					targetNode.value = iframe._iframeName;
				}else{
					formNode.setAttribute("target", iframe._iframeName);
				}
				formNode.target = iframe._iframeName;
				formNode.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe
				iframe.setSrc(iframe._frame, responseData.url, true);
			}
		}catch(e){
			dfd.reject(e);
		}
	}

	var defaultOptions = {
		method: 'POST'
	};
	function iframe(url, options){
		var args = util.parseArgs(url, util.deepCreate(defaultOptions, options), true);

		var responseData = {
			url: url = args[0],
			options: options = args[1],
			_callNext: function(){
				if(!this._calledNext){
					this._calledNext = true;
					current = null;
					iframe._fireNextRequest();
				}
			}
		};

		if(options.method != 'GET' && options.method != 'POST'){
			throw new Error(options.method + " not supported by dojo/request/iframe");
		}

		if(!iframe._frame){
			iframe._frame = iframe.create(iframe._iframeName, onload + "();");
		}

		var dfd = util.deferred(
			responseData,
			function(dfd, responseData){
				// summary: canceller for deferred
				responseData._callNext();
			},
			function(responseData){
				// summary: okHandler function for deferred
				try{
					var options = responseData.options,
						doc = iframe.doc(iframe._frame),
						handleAs = options.handleAs;

					if(handleAs != 'html'){
						if(handleAs == 'xml'){
							// IE6-8 have to parse the XML manually. See http://bugs.dojotoolkit.org/ticket/6334
							if(doc.documentElement.tagName.toLowerCase() == "html"){
								query('a', doc.documentElement).orphan();
								var xmlText = doc.documentElement.innerText;
								xmlText = xmlText.replace(/>\s+</g, '><');
								responseData.text = lang.trim(xmlText);
							}else{
								responseData.response = doc;
							}
						}else{
							// "json" and "javascript" and "text"
							responseData.text = doc.getElementsByTagName('textarea')[0].value; // text
						}
						handlers(responseData);
					}else{
						responseData.response = doc;
					}

					return responseData;
				}catch(e){
					throw e;
				}
			},
			function(error, responseData){
				// error handler
				responseData.error = error;
			},
			function(responseData){
				// finally
				responseData._callNext();
			}
		);

		queue.push([dfd, responseData]);
		iframe._fireNextRequest();

		watch(
			dfd,
			responseData,
			function(dfd, responseData){
				// validCheck
				return !responseData.error;
			},
			function(dfd, responseData){
				// ioCheck
				return !!responseData._finished;
			},
			function(dfd, responseData){
				// resHandle
				if(responseData._finished){
					dfd.resolve(responseData);
				}else{
					dfd.reject(new Error("Invalid dojo/request/iframe request state"));
				}
			}
		);

		return dfd.promise;
	}

	iframe._iframeName = mid + "_IoIframe";
	iframe.create = create;
	iframe.doc = doc;
	iframe.setSrc = setSrc;
	iframe._fireNextRequest = fireNextRequest;

	util.addCommonMethods(iframe, ['GET', 'POST']);

	return iframe;
});
