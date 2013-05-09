angular.module('gury.picasa', ['gury.base'])

// http://jsfiddle.net/pmKpG/19/

.directive('onScrollNext', ['picasaService', '$compile', 'Working', '$rootScope', function(picasaService, $compile, Working, $rootScope) {
return {
      restrict: 'A',
      link: function(scope, elm, attrs) {
		var workingName = attrs.onScrollIsLoading;
		// var workingName = 'scrollIsLoadingPhotos';

		$(window.document).bind('scroll', function(event) {
			var heightOffset = 0;
			var isVisible = $(window).scrollTop() + $(window).height() + heightOffset >= $(document).height() - $(elm).height() ? true : false;
			if(isVisible && !Working.isWorking(workingName)) {
				if(angular.isDefined(attrs.onScrollNext)) {
					scope.$apply(function() {
						console.log('loaduju dalsi:' + workingName);

						// show loading
						Working.set(workingName);

						// call function
						scope.$eval(attrs.onScrollNext);
					});
				}
			}
		});

		// called function has finished it's job 
		scope.$on('onScrollNextFinished', function(params) {
			console.log('finishedloaduju dalsi:' +  workingName);
			// hide loading
			Working.unset(workingName);
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
		data: '='
	},
	templateUrl: function(elm, attrs) {
		return attrs.include;
	},
      link: function(scope, elm, attrs) {
      }
    };
}])

// service
.factory('picasaService', ['$http', '$q', 'Working', '$filter', function($http, $q, Working, $filter) {
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
		user: 'dun',
		hide_albums: ['Profile Photos', 'scrapBook', 'instantUpload', 'Photos from posts']
	};	

	$http.defaults.useXDomain = true;
    
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
		Working.set('picasaLoading');
		var url = params && params.absUrl ? params.absUrl : urls.albums(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			// transform data with our filter - will exclude special picasa internal albums
			data.data = $filter('picasaItemsFilter')(data.data, 'album');
			Working.unset('picasaLoading');
			d.resolve(data.data);
		}).error(function(data, status) {
			var errMsg = 'Chyba pri nahravani prosim obnovte stranku F5';
			Working.unset('picasaLoading');
			alert(errMsg);
			d.reject(errMsg);
		});

		return d.promise;
	},

	// params: albumid, max-results
	getPhotos: function(params) {
		Working.set('picasaLoading');
		var url = params && params.nextLink ? params.nextLink + '&callback=JSON_CALLBACK' : urls.photos(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			// transform data with our filter
			data.data = $filter('picasaItemsFilter')(data.data, 'photo');
			Working.unset('picasaLoading');
			d.resolve(data.data);
		}).error(function(data, status) {
			var errMsg = 'Chyba pri nahravani prosim obnovte stranku F5';
			Working.unset('picasaLoading');
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

// input = data.items  (array of photos)
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
