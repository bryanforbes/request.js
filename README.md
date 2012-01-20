# RequestJS

## Basic Usage

Use the platform fallback (XHR in browsers):

	require(['request'], function(request){
		request('data.json', { handleAs: 'json' }).then(function(responseData){
			console.log(responseData.response);
		});
	});

Use a specific transport directly:

	require(['request/script'], function(script){
		script('jsonp.php').then(function(responseData){
			console.log(responseData.response);
		});
	});


Configure `request` to use a specific transport by default:

	<script>
		var dojoConfig = {
			defaultTransport: 'request/script'
		};
	</script>
	<script src="path/to/dojo.js"></script>
	<script>
		require(['request'], function(request){
			request('jsonp.php').then(function(responseData){
				console.log(responseData.response);
			});
		});
	</script>

## Using the Registry

Use the registry with the platform default as a fallback:

	<script>
		var dojoConfig = {
			defaultTransport: 'request/registry'
		};
	</script>
	<script src="path/to/dojo.js"></script>
	<script>
		require(['request', 'request/script'], function(request, script){
			request.register(/jsonp/, script);

			request('data.json', { handleAs: 'json' }).then(function(responseData){
				console.log(responseData.response);
			});

			request('jsonp.php').then(function(responseData){
				console.log(responseData.response);
			});
		});
	</script>

Use the registry with `request/script` as a fallback:

	<script>
		var dojoConfig = {
			defaultTransport: 'request/registry!request/script'
		};
	</script>
	<script src="path/to/dojo.js"></script>
	<script>
		require(['request', 'request/xhr'], function(request, xhr){
			request.register(/\.json$/, xhr);

			request('data.json', { handleAs: 'json' }).then(function(responseData){
				console.log(responseData.response);
			});

			request('jsonp.php').then(function(responseData){
				console.log(responseData.response);
			});
		});
	</script>
