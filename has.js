define([
	'dojo/has'
], function(has){
	has.add('request-no-addeventlistener', function(){
		return has('host-browser') && !has('dom-addeventlistener');
	});

	has.add('request-es5', function(){
		var arr = [];
		return !!(arr.forEach && arr.map && arr.some && Object.create);
	});

	has.add('request-activex', typeof ActiveXObject != 'undefined');

	return has;
});
