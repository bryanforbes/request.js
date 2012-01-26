# RequestJS

## Basic Usage

Use the platform fallback (XHR in browsers):

	require(['dojo/request'], function(request){
		request('data.json', { handleAs: 'json' }).then(function(responseData){
			console.log(responseData.response);
		});
	});

Use a specific provider directly:

	require(['dojo/request/script'], function(script){
		script('jsonp.php').then(function(responseData){
			console.log(responseData.response);
		});
	});


Configure `request` to use a specific provider by default:

	<script>
		var dojoConfig = {
			requestProvider: 'dojo/request/script'
		};
	</script>
	<script src="path/to/dojo.js"></script>
	<script>
		require(['dojo/request'], function(request){
			request('jsonp.php').then(function(responseData){
				console.log(responseData.response);
			});
		});
	</script>

## Using the Registry

Use the registry with the platform default as a fallback:

	<script>
		var dojoConfig = {
			requestProvider: 'dojo/request/registry'
		};
	</script>
	<script src="path/to/dojo.js"></script>
	<script>
		require(['dojo/request', 'dojo/request/script'], function(request, script){
			request.register(/jsonp/, script);

			request('data.json', { handleAs: 'json' }).then(function(responseData){
				console.log(responseData.response);
			});

			request('jsonp.php').then(function(responseData){
				console.log(responseData.response);
			});
		});
	</script>

Use the registry with `dojo/request/script` as a fallback:

	<script>
		var dojoConfig = {
			requestProvider: 'dojo/request/registry!dojo/request/script'
		};
	</script>
	<script src="path/to/dojo.js"></script>
	<script>
		require(['dojo/request', 'dojo/request/xhr'], function(request, xhr){
			request.register(/\.json$/, xhr);

			request('data.json', { handleAs: 'json' }).then(function(responseData){
				console.log(responseData.response);
			});

			request('jsonp.php').then(function(responseData){
				console.log(responseData.response);
			});
		});
	</script>
