// contains all my helper functions
var jsonFlickrApi = function(data) {
	console.log('sece');
	console.log(data);
	return data;
};

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

Gury.updateQueryString = function(url, key, value) {
    if (!url) url = window.location.href;
    var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");

    if (re.test(url)) {
        if (typeof value !== 'undefined' && value !== null)
            return url.replace(re, '$1' + key + "=" + value + '$2$3');
        else {
            var hash = url.split('#');
            url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
            if (typeof hash[1] !== 'undefined' && hash[1] !== null) 
                url += '#' + hash[1];
            return url;
        }
    }
    else {
        if (typeof value !== 'undefined' && value !== null) {
            var separator = url.indexOf('?') !== -1 ? '&' : '?',
                hash = url.split('#');
            url = hash[0] + separator + key + '=' + value;
            if (typeof hash[1] !== 'undefined' && hash[1] !== null) 
                url += '#' + hash[1];
            return url;
        }
        else
            return url;
    }
};
