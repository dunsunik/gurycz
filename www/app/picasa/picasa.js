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
		username: 'dunsun',
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
		prepare : function(url, params) {
			url = 'https://picasaweb.google.com/data/feed/api/' + url + '?v=2';

			params = params ? params : {};

			params = angular.extend({
				'kind': 'photo',
				'max-results': opts['max-results'],
				'thumbsize': opts.thumbsize + "c",
				'imgmax': opts.imagesize,
				'alt': 'jsonc',
				'access': 'visible',
				'callback': 'JSON_CALLBACK'
			}, params);

			angular.forEach(params, function (val, key) {
				url = url + '&' + key + '=' + val;
			});

			return url;
		},

		photos : function(username, album) {
			return this.prepare("user/" + username + "/albumid/" + album, {});
		},

		albums : function(username) {
			return this.prepare("user/" + username, {kind: 'album'});
		},

		latestPhotos : function(maxResults, albumId, username) {
			return this.prepare("user/" + username , {kind: 'photo', 'max-results': maxResults});
		},

		tags : function(username) {
			return this.prepare("user/" + username, {kind: 'tag'});
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
	getAlbums: function() {
		var url = urls.albums(opts.username);
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
	getPhotos: function(albumId) {
		return urls.photos(opts.username, albumId);
	},
	getLatestPhotos: function(params) {
		var url = urls.latestPhotos(params.maxResults, params.albumId, opts.username);
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
	getTags: function() {
		var url = urls.tags(opts.username);
		var d = $q.defer();
		$http.jsonp(url).success(function(data, status) {
			d.resolve(data);
		});
		return d.promise;
	}
    };
}]);
