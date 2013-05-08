angular.module('gury.picasa', ['gury.base'])

// http://jsfiddle.net/pmKpG/19/

.directive('onScrollVisible', ['picasaService', '$compile', 'Working', function(picasaService, $compile, Working) {
return {
      restrict: 'A',
	scope: {
		fn: '&',
		onScrollVisible: '&'
	},
      link: function(scope, elm, attrs) {
		$(window.document).bind('scroll', function(event) {
			var heightOffset = 0;
			var isVisible = $(window).scrollTop() + $(window).height() + heightOffset >= $(document).height() - $(elm).height() ? true : false;
			if(isVisible && !Working.isWorking('picasaLoading')) {
				if(angular.isDefined(attrs.onScrollVisible)) {
					scope.$apply(function() {
						scope.onScrollVisible();
					});
				}
			}
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
		/*
		scope.data.thumb = {
			src: (scope.data.media.thumbnails && scope.data.media.thumbnails.length > 0 ? scope.data.media.thumbnails[0] : ''),
			alt: scope.data.title
		};

		scope.data.image = {
			src: ''
		};
		*/
      }
    };
}])

// service
.factory('picasaService', ['$http', '$q', 'Working', function($http, $q, Working) {
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
    
	// url functions
	var urls = {
		// generate complete picasa request url
		prepare : function(params) {

			params = params ? params : {};

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
			}

			// albumid
			if(params.albumid) {
				url = url + '/albumid/' + params.albumid;
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

	// params: user, max-results
	getAlbums: function(params) {
		Working.set('picasaLoading');
		var url = params && params.absUrl ? params.absUrl : urls.albums(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			// exclude special implicit picasa albums
			var items = [];
			angular.forEach(data.data.items, function(item) {
				if(!item.type) {
					items.push(item);
				}
			});
			data.data.items = items;

			Working.unset('picasaLoading');

			d.resolve(data.data);
		});

		return d.promise;
	},

	// params: user, albumid, max-results
	getPhotos: function(params) {
		Working.set('picasaLoading');
		var url = params && params.nextLink ? params.nextLink + '&callback=JSON_CALLBACK' : urls.photos(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			Working.unset('picasaLoading');
			d.resolve(data.data);
		});
		return d.promise;
	},

	// params: user, albumid, max-results,
	getLatestPhotos: function(params) {
		return this.getPhotos(params);
	},

	// params: user, albumid, max-results
	getTags: function(params) {
		var url = urls.tags(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			d.resolve(data);
		});
		return d.promise;
	}
    };
}])

.filter('picasaItemData', ['$http', '$q', function($http, $q) {
	return function(input, type) {
		input.thumb = {
			src: (input.media.thumbnails && input.media.thumbnails.length > 0 ? input.media.thumbnails[0] : ''),
			alt: input.title
		};

		input.image = {
			src: ''
		};

		return input;
	}
}]);
