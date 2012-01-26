define([
	'dojo/has'
], function(has){
	has.add('request-no-addeventlistener', function(){
		return has('host-browser') && !has('dom-addeventlistener');
	});

	has.add('request-activex', typeof ActiveXObject != 'undefined');

	return has;
});
