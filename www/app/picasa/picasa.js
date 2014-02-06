angular.module('gury.picasa', ['gury.base'])

// http://jsfiddle.net/pmKpG/19/

// service
.factory('picasaService', ['$http', '$q', 'Working', '$filter', '$rootScope', 'cache', function($http, $q, Working, $filter, $rootScope, cache) {
	// default options
	var opts = {
		// access private or public
		access: 'visible',
		// 32, 48, 64, 72, 104, 144, 150, 160
		thumbsize: 160,
		// 94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600
		imgmax: 720,
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
				'imgmax': opts.imgmax,
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
				'imgmax': params.imgmax,
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
		params.picasaWorking = params && params.picasaWorking ? params.picasaWorking : 'picasaWorking';
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

	// returns promise
	getAlbumsCached: function(params) {
		params.picasaWorking = params && params.picasaWorking ? params.picasaWorking : 'picasaWorking';
		picasaWorking(params.picasaWorking, true);

		// try to get albums from a cache
		var albums = cache.get('albums');

		var d = $q.defer();

		// there are no albums in a cache -> fetch them from google and put them into a cache
		if(!albums) {
			var promise = this.getAlbums(params).then(function(data) {
				albums = $filter('picasaExcludeSystemAlbums')(data);
				cache.put('albums', albums);
				picasaWorking(params.picasaWorking, false);
				d.resolve(albums);
			});
		}
		else {
			picasaWorking(params.picasaWorking, false);
			d.resolve(albums);
		}

		return d.promise;
	},

	// params: albumid, max-results
	getPhotos: function(params) {
		params.picasaWorking = params && params.picasaWorking ? params.picasaWorking : 'picasaWorking';
		picasaWorking(params.picasaWorking, true);

		var url = params && params.nextLink ? params.nextLink + '&callback=JSON_CALLBACK' : urls.photos(params);
		var d = $q.defer();

		$http.jsonp(url).success(function(data, status) {
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

			val = item.exif['fstop'];
			if(val) {
				val = val + " f";
				exifArray.push({ "Clona" : val });
			}

			val = item.exif['exposure'];
			if(val) {
				val = "1/" + Math.round(1 / val) + " s";
				exifArray.push({ "Čas" : val });
			}

			val = item.exif['focallength'];
			if(val) {
				val = parseInt(val + 0, 10) + " mm";
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
							// hack replace s1600 -> s2048 since google does not support imgmax=2048 directly
							item.image.url = item.image.url.replace("/s1600/","/s2048/");
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
