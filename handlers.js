define(['dojo/json'], function(JSON){
	var handlers = {
		"json": function(responseData){
			return JSON.parse(responseData.responseText || null);
		}
	};
	function handle(responseData){
		var handler = handlers[responseData.options.handleAs];

		responseData.response = handler ? handler(responseData) : responseData.responseText;
	}

	return handle;
});
