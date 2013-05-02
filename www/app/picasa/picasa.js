angular.module('gury.picasa', [])

// directive
.directive('picasa', ['picasaService', function(picasaService) {
    return {
      //works on attribute
      restrict: 'A',
      replace: true,
      scope: {},
      template: '<div ng-show="ready"><div class="picasa-photo"><img src="{{current.url}}" height="{{height}}" width="{{width}}"></div>' +
                          '<div class="picasa-thumbs" ng-mousemove="move($event)">' +
                          '<ul ng-repeat="photo in photos">' + 
                          '<li><a ng-mouseover="setCurrent(photo)"><img src="{{photo.thumb}}" height="{{thumbHeight}}" width="{{thumbWidth}}"></a></li>' + 
                          '</ul>' + 
                          '</div></div>',
      link: function(scope, element, attrs) {
        scope.height = attrs.height;
        scope.width = attrs.width;
        scope.thumbWidth = attrs.thumbWidth;
        scope.thumbHeight = attrs.thumbHeight;

        picasaService.get(attrs.picasa).then(function(data) {
          scope.photos = data;
          scope.current = picasaService.current();
          scope.ready = true;
        });

        scope.setCurrent = function(photo) {
          scope.current = photo;
        };

        scope.move = function(event) {
          var thumbDiv = element[0].lastChild;
          var x = event.clientX - thumbDiv.offsetLeft;
          var center = thumbDiv.offsetWidth / 2;
          var factor = 20;

          var delta = (x - center)/center * factor;

          if (delta > 0 && thumbDiv.scrollLeft < (thumbDiv.scrollWidth - thumbDiv.clientWidth)) {
              thumbDiv.scrollLeft += delta;
          }
          if (delta < 0 && thumbDiv.scrollLeft > 0) {
              thumbDiv.scrollLeft += delta;
          }
        };

      }
    };
  }])


// directive
.directive('picasaPhoto', ['picasaService', '$compile', function(picasaService, $compile, $eval) {
    return {
      restrict: 'E',
      replace: true,
	scope: {
		origData: '=data'
	},
      link: function(scope, elm, attrs) {
		scope.data = {
			id: scope.origData.id,
			title: scope.origData.title,
			descr: scope.origData.description,
			dateCreated: scope.origData.published,
			thumb: {
				src: (scope.origData.media.thumbnails && scope.origData.media.thumbnails.length > 0 ? scope.origData.media.thumbnails[0] : ''),
				alt: scope.origData.title
			},
			image: {
				src: ''
			},
			selfLink: scope.origData.selfLink
		};
      }
    };
  }])

// service
.factory('picasaService', ['$http', '$q', function($http, $q) {
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
    
    var current = $q.defer();

    function parsePhoto(entry) {
      var lastThumb = entry.media$group.media$thumbnail.length - 1;
      var photo = {
        thumb: entry.media$group.media$thumbnail[lastThumb].url,
        thumbHeight: entry.media$group.media$thumbnail[lastThumb].height,
        thumbWidth: entry.media$group.media$thumbnail[lastThumb].width,
        url: entry.media$group.media$content[0].url
      };
      return photo;
    }
    
    function parsePhotos(url) {
      var d = $q.defer();
      var photo;
      var photos = [];
      loadPhotos(url).then(function(data) {
        if (!data.feed) {
          photos.push(parsePhoto(data.entry));
        } else {
          data.feed.entry.forEach(function(entry) {
            photos.push(parsePhoto(entry));
          });
        }
        console.log("resolving");
        current.resolve(photos[0]);
        d.resolve(photos);
        console.log("resolving");
        
      });
      return d.promise;
    }

    function loadPhotos(url) {
      var d = $q.defer();
      $http.jsonp(url + '?alt=json&kind=photo&hl=pl&imgmax=912&callback=JSON_CALLBACK').success(function(data, status) {
        d.resolve(data);
      });
      return d.promise;
    }

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
				if(val != undefined) {
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
      get : function (url) {
        return parsePhotos(url);
      },

      current : function () {
        return current.promise;
      },

	// params: user, max-results
	getAlbums: function(params) {
		var url = params && params.absUrl ? params.absUrl : urls.albums(params);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			console.log(data.data.items);
			var items = [];
			angular.forEach(data.data.items, function(item) {
				if(!item.type) {
					console.log(item);
					items.push(
						{
						id: item.id,
						title: item.title,
						descr: item.description,
						dateCreated: item.published,
						thumb: {
							src: (item.media.thumbnails && item.media.thumbnails.length > 0 ? item.media.thumbnails[0] : ''),
							alt: item.title
						},
						selfLink: item.selfLink
						}
					);
				}
			});
			d.resolve(items);
		});

		return d.promise;
	},

	// params: user, albumid, max-results
	getPhotos: function(params) {
		var url = params && params.nextLink ? params.nextLink + '&callback=JSON_CALLBACK' : urls.photos(params);
		console.log(url);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
				console.log(data);
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
}]);
