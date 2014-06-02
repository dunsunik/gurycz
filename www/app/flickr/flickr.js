angular.module('gury.flickr', ['gury.base', 'gury.photosBase'])

// http://jsfiddle.net/pmKpG/19/

// service
.factory('flickrService', ['$http', '$q', 'Working', '$filter', '$rootScope', 'cache', function($http, $q, Working, $filter, $rootScope, cache) {
	// default options
	var opts = {
		// 32, 48, 64, 72, 104, 144, 150, 160
		thumbsize: 't',
		// 94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600
		fullsize: 'o',
		// path to image placeholder (e.g. images/loader.gif).
		loader: '',
		// maximum number of photos to return (0 indicates all).
		'per_page': 100,
		// set overrideLayout to true if you want to handle the images and markup directly.
		overrideLayout: false,
		api_key: '',
		user_id: '',
		// on of: tag,latest,albumid
		pageType: 'latest'
	};	

	$http.defaults.useXDomain = true;

	// url functions
	var urls = {
		// generate complete picasa request url
		prepare : function(params) {
			params = params ? params : {};

			var url = 'http://api.flickr.com/services/rest/?format=json&jsoncallback=JSON_CALLBACK';

			var parameters = ['api_key', 'user_id', 'per_page', 'page', 'tags', 'photoset_id'];

			// test for params and add them to url if they are set
			angular.forEach(parameters, function(p) {
				if(params[p]) {
					url = url + '&' + p + '=' + params[p];
				}
			});

			return url;
		},

		phpproxycached: function(url) {
			Gury.log(url);
			// caching ttl is 2 days
			return '/serverside/cache.php?phpcache_ttl=172800&phpcache_method=getset&phpcache_key=' + $filter('encodeUri')(url);
		},

		photos : function(params) {
			var url = this.prepare(params);
			url = url + '&method=flickr.photos.search';
			url = url + '&extras=original_format,date_taken,url_o,o_dims,url_' + params.thumbSize + ',' + params.thumbSize + '_dims';
			return urls.phpproxycached(url);
		},

		photosInPhotoset : function(params) {
			var url = this.prepare(params);
			url = url + '&method=flickr.photosets.getPhotos';
			url = url + '&extras=original_format,date_taken,url_o,o_dims,url_' + params.thumbSize + ',' + params.thumbSize + '_dims';
			return urls.phpproxycached(url);
		},

		// will get all existing sets (albums)
		albums : function(params) {
			var url = this.prepare(params);
			url = url + '&method=flickr.photosets.getList';
			url = url + '&primary_photo_extras=date_taken,url_' + params.albumSize;
			return urls.phpproxycached(url);
		},

		// will get all existing sets (albums)
		exif : function(params) {
			var url = this.prepare(params);
			url = url + '&method=flickr.photos.getExif';
			url = url + '&photo_id=' + params.photoId;
			return urls.phpproxycached(url);
		},

		tags : function(params) {
		},

		thumbUrl: function(item, params) {
			var url = '';
			if(item) {
				url = "http://farm" + item.farm + ".staticflickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_" + params.thumbSize + ".jpg";
			}
			return url;
		},

		imageUrl: function(item, params) {
			var url = '';
			if(item) {
				if(params.fullSize == 'o') {
					url = "http://farm" + item.farm + ".staticflickr.com/" + item.server + "/" + item.id + "_" + item.originalsecret + "_o.jpg";
				}
				else {
					url = "http://farm" + item.farm + ".staticflickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_" + params.fullSize + ".jpg";
				}
			}
			return url;
		}

	};

	var getBlank = {
		image: function() {
			return { url: '', w: '', h: '' };
		},
		thumb: function() { 
			return { url: '', w: '', h: '' };
		}
	};

	// Public API here
	return {

	// params: max-results
	getAlbums: function(parameters) {
		Working.set('fetchingPhotosWorking');
		var params = this.extendParams(parameters);

		var url = params && params.absUrl ? params.absUrl : urls.albums(params);
		var d = $q.defer();

		$http.jsonp(url).success(function(data, status) {
			var out = {
				items: data.photosets.photoset
			};

			angular.forEach(out.items, function(item) {
				// add dateYear and dateFormated
				try {
					var date = new Date(item.date_create * 1000);
					item.dateYear = date.getFullYear();
					item.dateFormated = date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
				}
				catch(e) {
					item.dateFormated = "";
				}

				// add image
				item.image = getBlank.image();
				if(item.primary_photo_extras && item.primary_photo_extras['url_' + params.albumSize]) {
					item.image.url = item.primary_photo_extras['url_' + params.albumSize];
					item.image.w = item.primary_photo_extras['width_' + params.albumSize];
					item.image.h = item.primary_photo_extras['height_' + params.albumSize];
				}

				// title
				item.title = item.title._content;

				// description
				item.description = item.description._content;
			});

			Working.unset('fetchingPhotosWorking');
			d.resolve(out);
		}).error(function(data, status) {
			var errMsg = 'Chyba pri nahravani prosim obnovte stranku F5';
			Working.unset('fetchingPhotosWorking');
			alert(errMsg);
			d.reject(errMsg);
		});

		return d.promise;
	},

	// returns promise
	getAlbumsCached: function(params) {
		Working.set('fetchingPhotosWorking');

		// try to get albums from a cache
		var albums = cache.get('albums');

		var d = $q.defer();

		// there are no albums in a cache -> fetch them from google and put them into a cache
		if(!albums) {
			var promise = this.getAlbums(params).then(function(data) {
				albums = data;
				cache.put('albums', albums);
				Working.unset('fetchingPhotosWorking');
				d.resolve(albums);
			});
		}
		else {
			Working.unset('fetchingPhotosWorking');
			d.resolve(albums);
		}

		return d.promise;
	},

	extendParams: function(params) {
		var optsCopied = angular.copy(opts);
		return angular.extend(optsCopied, params);
	},

	// params: albumid, max-results
	getPhotos: function(parameters) {
		Working.set('fetchingPhotosWorking');
		var params = this.extendParams(parameters);

		// url
		var url = '';
		var dataCtg = '';
		if(params.pageType == 'albumid') {
			url = urls.photosInPhotoset(params);
			dataCtg = 'photoset';
		}
		else if(params.pageType == 'tag') {
			url = urls.photos(params);
			dataCtg = 'photos';
		}
		else if(params.pageType == 'latest') {
			url = urls.photos(params);
			dataCtg = 'photos';
		}

		if(params && params.nextLink) {
			url = params.nextLink;
		}

		var d = $q.defer();

		$http.jsonp(url).success(function(data, status) {
			var out = {
				items: data[dataCtg].photo,
				pages: data[dataCtg].pages,
				page: data[dataCtg].page
			};

			angular.forEach(out.items, function(item) {
				// add dateYear and dateFormated
				try {
					var date = new Date(item.date_taken * 1000);
					item.dateYear = date.getFullYear();
					item.dateFormated = date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
				}
				catch(e) {
					item.dateFormated = "";
				}

				// add image
				item.image = getBlank.image();
				item.image.url = urls.imageUrl(item, params);
				if(item['width_' + params.fullSize]) {
					item.image.w = item['width_' + params.fullSize];
					item.image.h = item['height_' + params.fullSize];
				}

				// add thumb
				item.thumb = getBlank.thumb();
				item.thumb.url = urls.thumbUrl(item, params);
				if(item['width_' + params.thumbSize]) {
					item.thumb.w = item['width_' + params.thumbSize];
					item.thumb.h = item['height_' + params.thumbSize];
				}
			});

			// nextLink
			if(out.pages > 1 && out.pages > out.page) {
				out.nextLink = Gury.updateQueryString(url, 'page', (parseInt(out.page, 10) + 1));
			}

			Working.unset('fetchingPhotosWorking');
			d.resolve(out);
		}).error(function(data, status) {
			var errMsg = 'Chyba pri nahravani prosim obnovte stranku F5';
			Working.unset('fetchingPhotosWorking');
			alert(errMsg);
			d.reject(errMsg);
		});
		return d.promise;
	},

	// params: albumid, max-results,
	getLatestPhotos: function(params) {
		return this.getPhotos(params);
	},

	// params: photoId
	getExif: function(parameters) {
		Working.set('fetchingPhotosWorking');
		var params = this.extendParams(parameters);

		var url = params && params.absUrl ? params.absUrl : urls.exif(params);
		var d = $q.defer();

		$http.jsonp(url).success(function(data, status) {
			Working.unset('fetchingPhotosWorking');
			var out = {
				'data': data.photo
			};
			d.resolve(out);
		}).error(function(errMsg, status) {
			Working.unset('fetchingPhotosWorking');
			d.reject(errMsg);
		});
		return d.promise;
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
			description: '',
			id: '',
			isSystemAlbum: false
		};
		return item;
	},

	// maximize elmForScaling (img usually)
	// center elmForCentering (parent usually)
	maximizeAndCenter: function(elmForScaling, elmForCentering, imgW, imgH) {
		if(imgW && imgH || 1==1) {
			imgW = parseInt(imgW, 10);
			imgH = parseInt(imgH, 10);
			var footerHeight = 8;

			var imgScale = imgW / imgH;

			var docW = $(window).width();
			var docH = ($(window).height()-footerHeight) > 0 ? ($(window).height()-footerHeight) : 0;
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

			// scale (maximize) element
			if(elmForScaling) {
				$(elmForScaling).width(Math.floor(imgW));
				$(elmForScaling).height(Math.floor(imgH));
			}

			// center element
			if(elmForCentering) {
				$(elmForCentering).css('margin-left', '0');
				$(elmForCentering).css('left', Math.floor((docW - imgW) / 2));
				$(elmForCentering).css('top', Math.floor((docH - imgH) / 2));
			}
		}
	},

	tuneExifData: function(item) {
		if(!item.exifTuned && item.exif) {
			var exifArray = [];
			var val;

			var exifHash = {};

			for(var i = 0; i < item.exif.length; i++) {
				exifHash[item.exif[i].tag] = item.exif[i].clean &&  item.exif[i].clean._content ? item.exif[i].clean._content : item.exif[i].raw._content;
			}

			val = exifHash['FNumber'];
			if(val) {
				exifArray.push({ "Clona" : val });
			}

			val = exifHash['ExposureTime'];
			if(val) {
				exifArray.push({ "Čas" : val });
			}

			val = exifHash['FocalLength'];
			if(val) {
				exifArray.push({ "Ohnisko" : val });
			}

			val = exifHash['ISO'];
			if(val) {
				val = val;
				exifArray.push({ "ISO" : val });
			}
			
			val = exifHash['Flash'];
			if(val) {
				exifArray.push({ "Blesk" : val });
			}

			val = exifHash['Make'];
			if(val) {
				val = val;
				exifArray.push({ "Značka" : val });
			}

			val = exifHash['Model'];
			if(val) {
				val = val;
				exifArray.push({ "Model" : val });
			}

			val = exifHash['Lens'];
			if(val) {
				val = val;
				exifArray.push({ "Lens" : val });
			}

			val = exifHash['DateTimeOriginal'];
			if(val) {
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
.filter('addNbspPaddingFilter', ['$filter', function($filter) {
	return function(input, count) {
		if(input && count > 0) {
			var nbsp = '';
			for(var i = 0;  i<count; i++) {
				nbsp = nbsp + '&nbsp;';
			}
			input = nbsp + input + nbsp;
		}
		return input;
	};
}])

// for IE78 there will be added ?time to a src so that it's not cached by IE78 browsers
.filter('imgSrcFilter', ['$http', function($http) {
	return function(src) {
		
		var isIE78 = function() {																				 
			return jQuery.support.leadingWhitespace === false ? true : false;
		};
		
		src = src ? src : ''; 
		src = isIE78() ? (src + "?" + new Date().getTime()) : src;

		return src;
	};
}]);

