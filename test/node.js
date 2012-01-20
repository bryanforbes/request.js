require(['require', 'request/main'], function(require, request){
	var http = require.nodeRequire('http'),
		timeout;

	var server = http.createServer(function(request, response){
		var body = '{ "foo": "bar" }';
		response.writeHead(200, {
			'Content-Length': body.length,
			'Content-Type': 'application/json'
		});
		response.write(body);
		response.end();
	});

	server.on('close', function(){
		if(timeout){ clearTimeout(timeout); }
	});

	server.on('listening', function(){
		request.get('http://localhost:8124', {
			handleAs: 'json',
			headers: { 'Range': '1-2' },
			timeout: 1000
		}).then(function(responseData){
			console.log(responseData.response);
			server.close();
		}, function(err){
			console.log(err);
			server.close();
		});
	});

	server.listen(8124);
});
