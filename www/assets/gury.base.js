// contains all my helper functions

var Gury = Gury || {};

Gury.isIE78 = function() {																				 
	return jQuery.support.leadingWhitespace === false ? true : false;
};

// console log
Gury.log = function(msg) {																				 
	try {
		console.log(msg);
	}
	catch(e) {}
};
