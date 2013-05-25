/**
 * Each section of the site has its own module. It probably also has
 * submodules, though this boilerplate is too simple to demonstrate it. Within
 * `src/app/home`, however, could exist several additional folders representing
 * additional modules that would then be listed as dependencies of this one.
 * For example, a `note` section could have the submodules `note.create`,
 * `note.delete`, `note.edit`, etc.
 *
 * Regardless, so long as dependencies are managed correctly, the build process
 * will automatically take take of the rest.
 *
 * The dependencies block here is also where component dependencies should be
 * specified, as shown below.
 */
angular.module( 'gury.photos', [
	'gury.base'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config([ '$routeProvider', function config( $routeProvider ) {
	// type can be one of: tag, latest, album
	// val can be for example 344 (albumid) or a tag name can be for example landscape
	$routeProvider.when( '/photos/:type/:val', {
		controller: 'PhotosCtrl',
		templateUrl: 'photos/photos.tpl.html'
	});
}])

/**
 * And of course we define a controller for our route.
 */
.controller( 'PhotosCtrl', [ '$scope', 'titleService', 'picasaService', '$routeParams', 'Working', '$q', function PhotosController( $scope, titleService, picasaService, $routeParams, Working, $q ) {
	titleService.setTitle( 'Photos' );

	// type - tag, latest, album
	var type = $routeParams.type;
	$scope.type = $routeParams.type;

	$scope.photosData = undefined;

	$scope.fsModeEnabled = false;

	$scope.exifInfoEnabled = false;

	// show photos for a specified tag
	if(type == "tag") {
		picasaService.getPhotos({'max-results': 20, tag: $routeParams.val, picasaWorking: 'picasaWorking'}).then(function(data) {
			$scope.photosData = data;
			$scope.resetActPhotoIndexToZero();
		});
	}
	// show latest photos
	else if(type == "latest") {
		picasaService.getPhotos({'max-results': 4, tag: $routeParams.val}).then(function(data) {
			$scope.resetActPhotoIndexToZero();
		});
	}
	// show photos in a specified album
	else if(type == "albumid") {
		picasaService.getPhotos({'max-results': 20, 'albumid': $routeParams.val, picasaWorking: 'picasaWorking'}).then(function(data) {
			$scope.photosData = data;
			$scope.resetActPhotoIndexToZero();
		});
	}


	// modal dialog settings
	$scope.modalOpts = {
		backdropFade: false,
		dialogFade: false,
		dialogClass: 'maximize-size modal'
	};

	// get photos items array - just a shortcut for $scope.photosData.items
	var photos = function() {
		return $scope.photosData && $scope.photosData.items ? $scope.photosData.items : [];
	};

	// set act photo index to 0
	$scope.resetActPhotoIndexToZero = function() {
		if(photos() && photos().length > 0) {
			$scope.actPhotoIndex = 0;
		}
	};

	// get actual photo data
	$scope.actPhoto = function() {
		return photos()[$scope.actPhotoIndex];
	};

	// move onto a next photo and get it's data
	$scope.nextPhoto = function() {
		// is last photo but has more pages -> fetch another photos
		if($scope.isLastPhotoButHasMorePages()) {
			var promise = $scope.getNextItems($scope.photosData, $q.defer());
			promise.then(function(data) {
				$scope.actPhotoIndex = $scope.actPhotoIndex + 1;
			});
		}
		// has more photos -> go to next photo
		else if($scope.hasMorePhotos()) {
			$scope.actPhotoIndex = $scope.actPhotoIndex + 1;

		}
		return $scope.actPhoto();
	};

	// move onto a previous photo and get it's data
	$scope.prevPhoto = function() {
		$scope.actPhotoIndex = $scope.actPhotoIndex <= 0 ? 0 :  $scope.actPhotoIndex - 1;
		return $scope.actPhoto();
	};

	$scope.hasMorePhotos = function() {
		return $scope.actPhotoIndex + 1 < photos().length ? true : false;
	};

	$scope.isLastPhotoButHasMorePages = function() {
		if(($scope.actPhotoIndex + 1 == photos().length) && $scope.photosData && $scope.photosData.nextLink && $scope.photosData.nextLink.length > 0) {
			return true;
		}
		else {
			return false;
		}
	};

	// will fetch next items (photos) from google
	$scope.getNextItems = function(data, defer) {
		if(data && data.nextLink) {
			picasaService.getPhotos({ nextLink: data.nextLink, picasaWorking: 'picasaWorking' }).then(function(data) {
				// if there are some photos already append newly responded photos to it
				if(photos().length > 0) {
					angular.forEach(data.items, function(item) {
						photos().push(item);
					});
				}
				// there are no photos on a screen yet
				else {
					$scope.photosData = data;
				}

				$scope.photosData.nextLink = data.nextLink;

				if(defer) {
					defer.resolve($scope.photosData);
				}
			}, function() {
				defer.reject('Next photos could not be loaded');
			});
		}
		if(defer) {
			return defer.promise;
		}
	};

	// infinite scroll is disabled if we are alreading fetching photos or if there are no more photos
	$scope.scrollIsDisabled = function() {
		return Working.isWorking('picasaLoading') || !($scope.photosData && $scope.photosData.nextLink && $scope.photosData.nextLink.length > 0) ? true : false;
	};
		
	$scope.getAlbums = function() {
		var promise = picasaService.getAlbums();
		promise.then(function(data) {
			$scope.albums = data;
			console.log('OK');
			console.log(data);
		});
	};

	$scope.getTags = function() {
		console.log(picasaService);
		var promise = picasaService.getTags();
		promise.then(function(data) {
			console.log('OK');
			console.log(data);
		});
	};

	$scope.getPhotosByTag = function(maxResults) {
		console.log(picasaService);
		var promise = picasaService.getLatestPhotos({'maxResults': maxResults, 'albumId': ''});
		promise.then(function(data) {
			console.log('OK');
			console.log(data);
		});
	};


	$scope.getLatestPhotos = function(maxResults) {
		console.log(picasaService);
		var promise = picasaService.getLatestPhotos({'maxResults': maxResults, 'albumId': ''});
		promise.then(function(data) {
			console.log('OK');
			console.log(data);
		});
	};

	$scope.openPhoto = function(index) {
		$scope.actPhotoIndex = index;
		$scope.modalIsVisible = true;
	};

	$scope.closePhoto = function() {
		$scope.modalIsVisible = false;
	};

	$scope.toggleExifInfo = function() {
		console.log('toggle exif info');

		// will become enabled -> regenerate and tidy exif data
		if(!$scope.exifInfoEnabled) {
			picasaService.tuneExifData($scope.actPhoto());
		}

		$scope.exifInfoEnabled = $scope.exifInfoEnabled ? false : true;
	};

	// toogle fullscreen mode
	$scope.toggleFsMode = function() {
		console.log('toggle fsMode');
		$scope.fsModeEnabled = $scope.fsModeEnabled ? false : true;
	};

		
/*
	$.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
		{
		//id: "51997044@N03",
		tags: 'landscape wide',
		tagmode: "all", 
		format: "json" 
		},
		function(data) {
			console.log(data);
			var images = [];
			angular.forEach(data.items, function(item) {
				images.push({ src: item.media.m.replace('_m\\.jpg', '_b.jpg'), fade: 1500});
			});
			console.log(images);

			// init vegas backgrounds
			$.vegas('slideshow', {
				delay: 13000,
				backgrounds : images
			});
			$.vegas('overlay', {
				src: 'assets/vegas/overlays/02.png'
			});

		}
	);
*/


}]);

