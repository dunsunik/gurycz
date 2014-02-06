angular.module('gury.photosBase', ['gury.base'])

.directive('spinner', ['Working', '$rootScope', '$timeout', function(Working, $rootScope, $timeout) {
return {
	restrict: 'A',
	scope: {
		spinner: '='		
	},
	link: function(scope, elm, attrs) {
		var enabled = scope.spinner;

		var opts = {
			lines: 13, // The number of lines to draw
			length: 20, // The length of each line
			width: 10, // The line thickness
			radius: 30, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#FFFF00', // #rgb or #rrggbb
			speed: 1, // Rounds per second
			trail: 60, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: 'auto', // Top position relative to parent in px
			left: 'auto' // Left position relative to parent in px
		};

		var spinner = new Spinner(opts);

		// should be a body element 
		var target = $('body')[0];

		var handle = function(enabled) {
			if(enabled) {
				$(elm).addClass('spinner-is-enabled');
				spinner.spin(target);
			}
			else {
				$(elm).removeClass('spinner-is-enabled');
				spinner.stop();
			}
		};

		var unregister2 = scope.$watch('spinner', function(newVal) {
			handle(newVal);
			
			

		});

		var unregister1 = scope.$watch('modalIsVisible', function(newVal) {
		});

		scope.$on('destroy', function() {
			// $(window).off('resize', handle);
		});
	}
};
}])

// just after image's content is fully loaded a specified action is fired
.directive('imageLoaded', ['$rootScope', '$parse', function($rootScope, $parse) {
return {
	restrict: 'A',
	link: function(scope, elm, attrs) {
		var fn = $parse(attrs.imageLoaded);

		var isIE78 = function() {																				 
			return jQuery.support.leadingWhitespace === false ? true : false;
		};

		// returns an image's real width and height
		var getNaturalDimension = function(imgEl) {
			// hack for IE7,8 
			if(isIE78()) {
				var tmpImage = new Image();
				tmpImage.src = imgEl.attr('src');
				return { w: tmpImage.width, h: tmpImage.height };
			}
			else {
				return { w: imgEl[0].naturalWidth, h: imgEl[0].naturalHeight };
			}
		};

		$(elm).load(function() {
			var dim = getNaturalDimension($(elm));
			
			// if fn is a sync method
			if($rootScope.$$phase) {
				// fire an action and pass some params into it
				fn(scope)(elm, dim.w, dim.h);
			}
			// if fn is an async method
			else {
				scope.$apply(function() {
					// fire an action and pass some params into it
					fn(scope)(elm, dim.w, dim.h);
				});
			}
		});
	}
};
}])

.directive('simpleModal', ['Working', '$rootScope', '$timeout', function(Working, $rootScope, $timeout ) {
return {
	restrict: 'A',
	link: function(scope, elm, attrs) {
		var isVisible = scope.$eval(attrs.simpleModal);

		// init modal but do not show it yet
		$(elm).modal({show: isVisible});

		// show
		$(elm).on('show', function() {
			$timeout(function() {
				try {
					scope.$eval(attrs.show);
				}
				catch(e) {
				}
			}, 0);
			/*
			scope.$apply(function() {
				try {
					scope.$eval(attrs.show);
				}
				catch(e) {
				}
			});
			*/
		});

		// shown
		$(elm).on('shown', function() {
			scope.$apply(function() {
				try {
					scope.$eval(attrs.shown);
				}
				catch(e) {
				}
			});
		});

		// hide
		$(elm).on('hide', function() {
			var action = function() {
				try { scope.$eval(attrs.hide); } catch(e) {}
			};

			// is digest or apply in a progress ?
			if(scope.$$phase) {
				action();
			}
			else {
				scope.$apply(function() { action(); });
			}
		});

		// hidden
		$(elm).on('hidden', function() {
			scope.$apply(function() {
				try {
					scope.$eval(attrs.hidden);
				}
				catch(e) {
				}
			});
		});

		// watch isVisible
		scope.$watch(attrs.simpleModal, function(newVal) {
			// open modal
			if(newVal) {
				$('body').css('overflow', 'hidden');
				$(elm).modal('show');
			}
			// hide modal
			else {
				$('body').css('overflow', 'auto');
				$(elm).modal('hide');
			}
		});

		// when user clicks on a back history button modal overlay still covers the browser
		// so we need to remove it manualy
		scope.$on('$destroy', function() {
			$('body').css('overflow', 'auto');
			$(elm).modal('hide');
			$('.modal-backdrop').remove();
		});
	}
};
}])

.directive('windowResized', ['Working', '$rootScope', '$timeout', '$parse', function(Working, $rootScope, $timeout, $parse) {
return {
	restrict: 'A',
	link: function(scope, elm, attrs) {
		var enabled = scope.$eval(attrs.windowResizedEnabled);

		// this functin is fired whenever window resizes
		var fn = function() {
			var f = $parse(attrs.windowResized);
			f(scope)(elm);
		};

		scope.$watch(attrs.windowResizedEnabled, function(newVal) {
			enabled = newVal;
			
			// first disabled all previous resize listeners
			$(window).off('resize', fn);

			if(enabled) {
				$(window).on('resize', fn);
			}
		});

		scope.$on('destroy', function() {
			$(window).off('resize', fn);
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
		var enabled = attrs.globalKeydownEnabled;

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

// input = data.items.item  (photo)
// type = 'photo', 'album'
.filter('itemsByYearsFilter', ['$http', function($http) {
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
}]);


