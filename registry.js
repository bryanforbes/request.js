define([], function(){
	return Object.defineProperties([], {
		defaultTransport: {
			writable: true,
			value: null
		},
		setDefault: {
			value: function(defaultTransport){
				this.defaultTransport = defaultTransport;
			}
		},
		register: {
			value: function(matcher, first){
				this[(first ? "unshift" : "push")](matcher);

				return {
					remove: function(){
						var idx;
						if(~(idx = this.indexOf(matcher))){
							this.splice(idx, 1);
						}
					}
				};
			}
		}
	});
});
