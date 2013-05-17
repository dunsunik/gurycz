angular.module('gury.picasa', ['gury.base'])

// http://jsfiddle.net/pmKpG/19/

.directive('maximizeSize', ['Working', '$rootScope', '$timeout', function(Working, $rootScope, $timeout) {
return {
	restrict: 'AC',
	link: function(scope, elm, attrs) {
		var photoData = scope.actPhoto();
		var enabled = scope.modalIsVisible;

		var handle = function() {
			if(enabled && photoData && photoData.width && photoData.height) {
				var imgW = photoData.width;
				var imgH = photoData.height;
				var imgScale = imgW / imgH;

				var docW = $(window).width();
				var docH = ($(window).height()-70) > 0 ? ($(window).height()-70) : 0;
				var docScale = docW / docH;				

				var imgScale = imgW / imgH;
				var docScale = docW / docH;

				// documment is wider then img
				if(docScale < imgScale) {
					// img's width is higher then document's width so scale it down
					if(docW <= imgW) {
						var scale = docW / imgW;
						imgW = scale * imgW;
						imgH = scale * imgH;
					}
					else {
						imgW = imgW;
						imgH = imgH;
					}
				}
				else {
					// img's width is higher then document's width so scale it down
					if(docH <= imgH) {
						var scale = docH / imgH;
						//scale = 1;
						imgW = scale * imgW;
						imgH = scale * imgH;
					}
					else {
						imgW = imgW;
						imgH = imgH;
					}
				}

				$(elm).css('position', 'absolute');
				$(elm).css('margin-left', '0');

				$(elm).width(Math.floor(imgW));
				$(elm).height(Math.floor(imgH));

				// center a photo
				$(elm).css('left', Math.floor((docW - imgW) / 2));
				$(elm).css('top', (Math.floor((docH - imgH) / 2) + 5));
			}
		};

		handle();

		var unregister1 = scope.$watch('modalIsVisible', function(newVal) {
			enabled = newVal;
			unregister2();
			unregister1();
			handle();
		});

		var unregister2 = scope.$watch('actPhoto()', function(newVal) {
			photoData = newVal;
			handle();
		});

		$(window).off('resize', handle);

		$(window).on('resize', handle);

		scope.$on('destroy', function() {
			$(window).off('resize', handle);
		});
	}
};
}])

.directive('windowResized', ['Working', '$rootScope', '$timeout', function(Working, $rootScope, $timeout) {
return {
	restrict: 'A',
	link: function(scope, elm, attrs) {
		var enabled = scope.$eval(attrs.windowResizedEnabled);

		scope.$watch(attrs.windowResizedEnabled, function(newVal) {
			enabled = newVal;
		});

		var handle = function(e) {
			if(enabled) {
				if(angular.isDefined(attrs.windowResized)) {
					scope.$apply(function() {
						try {
							scope.$eval(attrs.windowResized);
						}
						catch(e) {
						}
					});
				}
			}
		};

		$(window).resize(function(e) {
			handle(e);
		});

		scope.$on('destroy', function() {
			$(window).off('resize', handle);
		});
	}
};
}])

.directive('globalKeydown', ['Working', '$rootScope', '$timeout', function(Working, $rootScope, $timeout) {
return {
	restrict: 'A',
	link: function(scope, elm, attrs) {
		var keysEvents = scope.$eval(attrs.globalKeydown);
		var enabled = scope.$eval(attrs.globalKeydownEnabled);

		scope.$watch(attrs.globalKeydownEnabled, function(newVal) {
console.log('ano')
			enabled = newVal;
		});

		$(document).keydown(function(e) {
console.log('jede');
			if(enabled) {
				var action = keysEvents[e.which];
				if(action) {
					scope.$apply(function() {
						try {
							scope.$eval(action);
						}
						catch(e) {
						}
					});
				}
			}
		});
	}
};
}])

// inifiniteScroll
.directive('infScroll', ['Working', '$rootScope', '$timeout', function(Working, $rootScope, $timeout) {
return {
	restrict: 'A',
	link: function(scope, elm, attrs) {

		var isDisabled = scope.$eval(attrs.infScrollIsDisabled);
		var fn = attrs.infScroll;
		var heightOffset = angular.isDefined(attrs.infScrollOffset) ? attrs.infScrollOffset : 0;

		var isVisible = function(el) {
			var docViewTop = $(window).scrollTop();
			var docViewBottom = docViewTop + $(window).height();

			var elemTop = $(el).offset().top;
			var elemBottom = elemTop + $(el).height();

			return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= docViewBottom) &&	(elemTop >= docViewTop) );
		};

		var handler = function() {
			if(isVisible(elm) && !isDisabled && angular.isDefined(fn)) {
				// if fn is a sync method
				if($rootScope.$$phase) {
					scope.$eval(fn);
				}
				// if fn is an async method
				else {
					scope.$apply(function() {
						scope.$eval(fn);
					});
				}
			}
		};

		scope.$watch(attrs.infScrollIsDisabled, function(isDisabledNewVal) {
			isDisabled = isDisabledNewVal;
			if(!isDisabledNewVal) {
				handler();
			}
		});

		$(window.document).on('scroll', function() {
			handler();
		});

		scope.$on('destroy', function() {
			$(window.document).off('scroll', handler);
		});
	}
};
}])


// directive
.directive('picasaPhoto', ['picasaService', '$compile', function(picasaService, $compile) {
    return {
	restrict: 'E',
	replace: true,
	scope: {
		index: '=',		
		data: '=',
		showPhotoBridge: '&'
	},
	templateUrl: function(elm, attrs) {
		return attrs.include;
	},
	link: function(scope, elm, attrs) {
		scope.showPhotoBasic = function(data) {
		};
	}
    };
}])

// service
.factory('picasaService', ['$http', '$q', 'Working', '$filter', '$rootScope', function($http, $q, Working, $filter, $rootScope) {
	// default options
	var opts = {
		// access private or public
		access: 'visible',
		// 32, 48, 64, 72, 104, 144, 150, 160
		thumbsize: 160,
		// 94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600
		imagesize: 720,
		// path to image placeholder (e.g. images/loader.gif).
		loader: '',
		// maximum number of photos to return (0 indicates all).
		'max-results': 30,
		// set overrideLayout to true if you want to handle the images and markup directly.
		overrideLayout: false,
		user: 'dunsun',
		hide_albums: ['Profile Photos', 'scrapBook', 'instantUpload', 'Photos from posts']
	};	

	$http.defaults.useXDomain = true;

	var picasaWorking = function(key, val) {
		if(key !== undefined) {
			// set
			if(val !== undefined) {
				Working.setOrUnset(key, val);
			}
			// get
			else {
				return Working.get(key);
			}
		}
		return val;
	};
    
	// url functions
	var urls = {
		// generate complete picasa request url
		prepare : function(params) {
			params = params ? params : {};

			// delete all undefined params
			$.each(params, function(key, val) {
				if(val === undefined) {
					delete(params[key]);
				}
			});

			// merge second parameter to a first one
			params = angular.extend({
				'user': opts['user'],
				'albumid': '',
				'kind': 'photo',
				'tag': undefined,
				'max-results': opts['max-results'],
				'thumbsize': opts.thumbsize + "c",
				'imgmax': opts.imagesize,
				'alt': 'jsonc',
				'access': 'visible',
				'callback': 'JSON_CALLBACK'
			}, params);

			var url = 'https://picasaweb.google.com/data/feed/api/';

			// user
			if(params.user) {
				url = url + 'user/' + params.user;
				delete(params['user']);
			}

			// albumid
			if(params.albumid) {
				url = url + '/albumid/' + params.albumid;
				delete(params['albumid']);
			}

			// picasa version 2
			url = url + '?v=2';

			// add all other &key=val parameters
			angular.forEach(params, function (val, key) {
				if(val !== undefined) {
					url = url + '&' + key + '=' + val;
				}
			});

			console.log('URL:' + url);

			return url;
		},

		photos : function(params) {
			return this.prepare({
				'user': params.user,
				'albumid': params.albumid,
				'tag': params.tag,
				'max-results': params['max-results'],
				'kind': 'photo'
			});
		},

		albums : function(params) {
			return this.prepare({
				'user': params.user,
				'max-results': params['max-results'],
				'kind': 'album'
			});
		},

		tags : function(params) {
			return this.prepare({
				'user': params.user,
				'albumid': params.albumid,
				'max-results': params['max-results'],
				'kind': 'tag'
			});
		}

	};


    // Public API here
    return {

	// params: max-results
	getAlbums: function(params) {
		picasaWorking(params.picasaWorking, true);

		var url = params && params.absUrl ? params.absUrl : urls.albums(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			// transform data with our filter - will exclude special picasa internal albums
			data.data = $filter('picasaItemsFilter')(data.data, 'album');
			picasaWorking(params.picasaWorking, false);
			d.resolve(data.data);
		}).error(function(data, status) {
			var errMsg = 'Chyba pri nahravani prosim obnovte stranku F5';
			picasaWorking(params.picasaWorking, false);
			alert(errMsg);
			d.reject(errMsg);
		});

		return d.promise;
	},

	// params: albumid, max-results
	getPhotos: function(params) {
		picasaWorking(params.picasaWorking, true);
		var url = params && params.nextLink ? params.nextLink + '&callback=JSON_CALLBACK' : urls.photos(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			// transform data with our filter
			data.data = $filter('picasaItemsFilter')(data.data, 'photo');
			picasaWorking(params.picasaWorking, false);
			d.resolve(data.data);
		}).error(function(data, status) {
			var errMsg = 'Chyba pri nahravani prosim obnovte stranku F5';
			picasaWorking(params.picasaWorking, false);
			alert(errMsg);
			d.reject(errMsg);
		});
		return d.promise;
	},

	// params: albumid, max-results,
	getLatestPhotos: function(params) {
		return this.getPhotos(params);
	},

	// params: albumid, max-results
	getTags: function(params) {
		var url = urls.tags(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			d.resolve(data);
		});
		return d.promise;
	},

	// override default picasa opts
	setOpts: function(params) {
		params = params ? params : {};
		opts = angular.extend(opts, params);
	},

	// get opts object
	getOpts: function() {
		return opts;
	}
	
    };
}])

// input = data  (hash responded from a google which byt the way contains array of items (photos))
// type = 'photo', 'album'
.filter('picasaItemsFilter', ['$filter', function($filter) {
	return function(input, type) {
		if(input && input.items) {
			var outItems = [];
			angular.forEach(input.items, function(item) {
				// album filter
				if(type=="album") {
					// do not include special picasa internal default albums
					if(!item.type) {
						outItems.push($filter('picasaItemFilter')(item, type));
					}
				}
				// photo filter
				else if(type=="photo") {
					outItems.push($filter('picasaItemFilter')(item, type));
				}
			});
			input.items = outItems;
		}
		return input;
	};
}])

// input = data.items.item  (photo)
// type = 'photo', 'album'
.filter('picasaItemFilter', ['$http', function($http) {
	return function(input, type) {
		input.thumb = {
			src: (input.media.thumbnails && input.media.thumbnails.length > 0 ? input.media.thumbnails[0] : ''),
			alt: input.title
		};

		input.image = {
			src: ''
		};

		return input;
	};
}]);
