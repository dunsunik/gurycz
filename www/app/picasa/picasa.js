angular.module('gury.picasa', ['gury.base'])

// http://jsfiddle.net/pmKpG/19/

.directive('maximizeSize', ['Working', '$rootScope', '$timeout', 'picasaService', function(Working, $rootScope, $timeout, picasaService) {
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

				var scale = 1;

				// documment is wider then img
				if(docScale < imgScale) {
					// img's width is higher then document's width so scale it down
					if(docW <= imgW) {
						scale = docW / imgW;
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
						scale = docH / imgH;
						//scale = 1;
						imgW = scale * imgW;
						imgH = scale * imgH;
					}
					else {
						imgW = imgW;
						imgH = imgH;
					}
				}

				$(elm).css('position', 'fixed');
				$(elm).css('margin-left', '0');

				$(elm).width(Math.floor(imgW));
				$(elm).height(Math.floor(imgH));

				// center a photo
				$(elm).css('left', Math.floor((docW - imgW) / 2));
				$(elm).css('top', (Math.floor((docH - imgH) / 2) + 5 ));
			}
		};

		handle();

		var unregister1 = scope.$watch('modalIsVisible', function(newVal) {
			enabled = newVal;

			if(!newVal) {
				unregister2();
				unregister1();
			}
			handle();
		});

		var unregister2 = scope.$watch('actPhoto()', function(newVal) {
			photoData = newVal;
			handle();
			picasaService.tuneExifData(newVal);
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


// toggle fs mode
// requires attribute fsModeEnabled
.directive('toggleFsMode', ['Working', '$rootScope', '$timeout', function(Working, $rootScope, $timeout) {
return {
	restrict: 'A',
	link: function(scope, elm, attrs) {

		scope.$watch(attrs.toggleFsMode, function(newVal) {
			if(newVal) {
				startFsMode(document.documentElement);
			}
			else {
				stopFsMode();
			}
		});

		var startFsMode = function(element) {
			if(element.requestFullScreen) {
				element.requestFullScreen();
			} else if(element.mozRequestFullScreen) {
				element.mozRequestFullScreen();
			} else if(element.webkitRequestFullScreen) {
				element.webkitRequestFullScreen();
			}
		};

		var stopFsMode = function() {
			if(document.cancelFullScreen) {
				document.cancelFullScreen();
			} else if(document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if(document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
		};
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
			enabled = newVal;
		});

		$(document).keydown(function(e) {
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
		return val;
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
				'kind': 'photo',
				'alt': params.alt
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
			data = $filter('picasaItemsFilter')(data, 'album');
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
		console.log(url);

		$http.jsonp(url).success(function(data, status) {
			console.log(data);
			console.log('po sekacovi');

			// transform data with our filter
			data = $filter('picasaItemsFilter')(data, 'photo');

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
	},

	getBlankItemStructure: function() {
		var item = {
			thumb: {
				url: '',
				alt: '',
				w: 'auto',
				h: 'auto'
			},
			image: {
				url: '',
				alt: '',
				w: 'auto',
				h: 'auto'
			},
			dateFormated: '',
			dateYear: '',
			title: '',
			descr: '',
			id: '',
			isSystemAlbum: false
		};
		return item;
	},

	tuneExifData: function(item) {
		if(!item.exifTuned && item.exif) {
			var exifArray = [];
			var val;

			val = item.exif['fstop'];
			if(val) {
				val = val + " f";
				exifArray.push({ "Clona" : val });
			}

			val = item.exif['exposure'];
			if(val) {
				val = "1/" + (1 / item.exif['exposure']) + " s";
				exifArray.push({ "Čas" : val });
			}

			val = item.exif['focallength'];
			if(val) {
				val = parseInt(val + 0) + " mm";
				exifArray.push({ "Ohnisko" : val });
			}

			val = item.exif['iso'];
			if(val) {
				val = val;
				exifArray.push({ "ISO" : val });
			}
			
			val = item.exif['flash'];
			if(val) {
				val = val ? "ano" : "ne";
				exifArray.push({ "Blesk" : val });
			}

			val = item.exif['make'];
			if(val) {
				val = val;
				exifArray.push({ "Značka" : val });
			}

			val = item.exif['model'];
			if(val) {
				val = val;
				exifArray.push({ "Model" : val });
			}

			val = item.exif['time'];
			if(val) {
				var date = new Date();
				date.setTime((val + 0) / 10);
				val = date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();
				exifArray.push({ "Datum" : val });
			}

			item.exifTuned = exifArray;
		}
	}
	
    }; // end of all public methods
}])

// input = data  (hash responded from a google which byt the way contains array of items (photos))
// type = 'photo', 'album'
.filter('shortenFilter', ['$filter', function($filter) {
	return function(input, maxChars) {
		if(input && input.length > maxChars) {
			input = input.slice(0, maxChars) + '...';
		}
		return input;
	};
}])

// input = data  (hash responded from a google which byt the way contains array of items (photos))
// type = 'photo', 'album'
// dataFormat - vy default it's not set and we guess it
// it returns our normalized data structure containing photos array and more
.filter('picasaItemsFilter', ['$filter', function($filter) {
	return function(input, type, dataFormat) {
		if(input) {
			var filterName;

			// jsonc
			if(input.data && input.data.items) {
				filterName = 'picasaItemsJsoncToJsoncFilter';
			}
			// rss
			else if(typeof(input) === 'string') {
				filterName = 'picasaItemsRssToJsoncFilter';
			}
			// json
			else {
				filterName = 'picasaItemsJsonToJsoncFilter';
			}

			input.data = $filter(filterName)(input);
		}

		return input;
	};
}])

// transform json data format to jsonc data format
.filter('picasaItemsJsoncToJsoncFilter', ['$filter', 'picasaService', function($filter, picasaService) {
	return function(input) {
		var out = {
			origData: angular.copy(input),
			items: [],
			nextLink: ''
		};


		if(input) {
			// items
			if(input.data && input.data.items) {
				var outItems = [];
				angular.forEach(input.data.items, function(entry) {
					var item = picasaService.getBlankItemStructure();

					// image url, w, h, alt
					if(entry.media.image && entry.media.image.url && entry.media.image.url.length > 0) {
							var image = entry.media.image;
							item.image.url = image.url && image.url.length > 0 ? image.url : '';
							item.image.w = image.width ? image.width : 'auto';
							item.image.h = image.height ? image.height : 'auto';
							item.image.alt = '';
					}

					// thumbnail url, w, h, alt - if it exists
					if(entry.media.thumbnails && entry.media.thumbnails.length>0 && entry.media.thumbnails[0].url && entry.media.thumbnails[0].url.length > 0) {
							var thumb = entry.media.thumbnails[0];
							item.thumb.url = thumb.url && thumb.url.length > 0 ? thumb.url : '';
							item.thumb.w = thumb.width ? thumb.width : 'auto';
							item.thumb.h = thumb.height ? thumb.height : 'auto';
							item.thumb.alt = '';
					}
					// thumbnail url, w, h, alt - hack - get it from full image's url
					else {
						var splited = item.image.url.split('/');
						if(splited && (splited.length - 2) >= 0) {
							var size = splited[splited.length-2];
							size = 's160-c';
							splited[splited.length-2] = size;
							item.thumb.url = splited.join('/');
						}
					}

					// title
					if(entry.title) {
						item.title = entry.title;
					}

					// descr
					if(entry.description) {
						item.descr = entry.description;
					}

					// id
					if(entry.id) {
						item.id = entry.id;
					}

					// isSystemAlbum
					if(entry.type && entry.type.length > 0) {
						item.isSystemAlbum = true;
					}

					// exif
					if(entry.exif) {
						item.exif = entry.exif;
					}

					// dateFormated, dateYear
					try {
						var date = new Date(Date.parse(entry.published));
						item.dateYear = date.getFullYear();
						item.dateFormated = date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
					}
					catch(e) {
						item.dateFormated = "";
						item.dateYear = "";
					}

					outItems.push(item);
				});
				out.items = outItems;
			}

			// nextLink
			if(input.data && input.data.nextLink && input.data.nextLink.length >= 0) {
				out.nextLink = input.data.nextLink;
			}
		}

		console.log(out);

		return out;
	};
}])

// transform json data format to jsonc data format
.filter('picasaItemsJsonToJsoncFilter', ['$filter', 'picasaService', function($filter, picasaService) {
	return function(input) {
		var out = {
			items: [],
			nextLink: ''
		};

		if(input) {
			// items
			if(input.feed && input.feed.entry) {
				var outItems = [];
				angular.forEach(input.feed.entry, function(entry) {
					console.log('jo');
					var item = picasaService.getBlankItemStructure();

					// thumbnail url, w, h, alt
					if(entry.media$group && entry.media$group.media$thumbnail && entry.media$group.media$thumbnail.length > 0) {
							var thumb = entry.media$group.media$thumbnail[0];
							item.thumb.url = thumb.url && thumb.url.length > 0 ? thumb.url : '';
							item.thumb.w = thumb.width ? thumb.width : 'auto';
							item.thumb.h = thumb.height ? thumb.height : 'auto';
							item.thumb.alt = '';
					}

					// image url, w, h, alt
					if(entry.media$group && entry.media$group.media$content && entry.media$group.media$content.length > 0) {
							var image = entry.media$group.media$content[0];
							item.image.url = image.url && image.url.length > 0 ? image.url : '';
							item.image.w = image.width ? image.width : 'auto';
							item.image.h = image.height ? image.height : 'auto';
							item.image.alt = '';
					}

					// title
					if(entry.summary) {
						item.title = entry.summary.$t;
					}

					// descr
					if(entry.title) {
						item.descr = entry.title.$t;
					}

					// dateFormated, dateYear
					try {
						var date = new Date(Date.parse(entry.published.$t));
						item.dateYear = date.getFullYear();
						item.dateFormated = date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
					}
					catch(e) {
						item.dateFormated = "";
						item.dateYear = "";
					}

					outItems.push(item);
				});
				out.items = outItems;
			}

			// nextLink
			if(input.feed && input.feed.link && input.feed.link.length >= 6) {
				out.nextLink = input.feed.link[5].href;
			}

		}

		return out;
	};
}])

// transform xml rss data format to jsonc data format
.filter('picasaItemsRssToJsoncFilter', ['$filter', 'picasaService', function($filter, picasaService) {
	return function(input) {
		var out = {
			items: [],
			nextLink: ''
		};

		if(input) {
			var data = x2js.xml_str2json(input);

			// items
			if(data.channel && data.channel.item_asArray) {
				var outItems = [];
				angular.forEach(data.channel.item_asArray, function(entry) {
					var item = picasaService.getBlankItemStructure();

					outItems.push(item);
				});
				out.items = outItems;
			}

			// nextLink
			if(input.feed && input.feed.link && input.feed.link.length >= 6) {
				out.nextLink = input.feed.link[5].href;
			}

		}

		return out;
	};
}])

// input = data.items.item  (photo)
// type = 'photo', 'album'
.filter('picasaItemFilter', ['$http', function($http) {
	return function(input, type) {
		// thumb src
		var src;
		// for some reason when getting photos byt tag there is no thumbnails so we have to check for it
		if(input && input.media.thumbnails && input.media.thumbnails.length > 0) {
			src = input.media.thumbnails[0];
		}
		// when thumbnails miss we create thumb's url from a media.image
		else if(input && input.media && input.media.image && input.media.image.url && input.media.image.url.length > 0) {
			src = input.media.image.url;
		}
		else {
			src = "";
		}
		input.thumb = {
			src: src,
			alt: input.title
		};

		if(type == "album") {
			try {
				var date = new Date(Date.parse(input.published));

				input.dateYear = date.getFullYear();
				input.dateFormated = date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
			}
			catch(e) {
				input.dateFormated = "";
			}
		}

		return input;
	};
}])

// input = data containing albums
// will remove ScrapBook and other System picasa albums 
.filter('picasaExcludeSystemAlbums', ['$http', function($http) {
	return function(input) {
		if(input) {
			var outItems = [];
			angular.forEach(input.items, function(item) {
				if(!item.isSystemAlbum) {
					outItems.push(item);
				}
			});
			input.items = outItems;
		}
		return input;
	};
}])

// input = data.items.item  (photo)
// type = 'photo', 'album'
.filter('picasaItemsByYearsFilter', ['$http', function($http) {
	return function(input) {

		var years = [];
		var prevYear;
		var items = [];

		var breakYearRow = function(years, items, prevYear) {
			years.push({
				year: prevYear,
				items: items
			});
		};

		angular.forEach(input.items, function(item) {
			// first item
			if(prevYear === undefined) {
				prevYear = item.dateYear;
			}

			// is new year -> so break row
			if(prevYear != item.dateYear) {
				breakYearRow(years, items, prevYear);
				items = [];
				prevYear = item.dateYear;
			}

			items.push(item);
		});

		breakYearRow(years, items, prevYear);

		return years;
	};
}])


// input = data.items.item  (photo)
// type = 'photo', 'album'
.filter('picasaItemFilterJson', ['$http', function($http) {
	return function(input, type) {
		// thumb src
		var src;
		// for some reason when getting photos byt tag there is no thumbnails so we have to check for it
		if(input && input.media.thumbnails && input.media.thumbnails.length > 0) {
			src = input.media.thumbnails[0];
		}
		// when thumbnails miss we create thumb's url from a media.image
		else if(input && input.media && input.media.image && input.media.image.url && input.media.image.url.length > 0) {
			src = input.media.image.url;
		}
		else {
			src = "";
		}
		input.thumb = {
			src: src,
			alt: input.title
		};

		if(type == "album") {
			try {
				var date = new Date(Date.parse(input.published));

				input.dateYear = date.getFullYear();
				input.dateFormated = date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
			}
			catch(e) {
				input.dateFormated = "";
			}
		}

		return input;
	};
}]);
