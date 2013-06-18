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

	$scope.toggleWorking = function() {
		
		if(Working.isWorking('picasaWorking')) {
			Working.unset('picasaWorking');
		}
		else {
			Working.set('picasaWorking');
		}
	};

	// type - tag, latest, album
	var type = $routeParams.type;
	$scope.type = $routeParams.type;

	$scope.photosData = undefined;

	// when location change on this controller fire this
	// for global listening it should be $rootScope.$on....
	// it does nothing since it's just an example
	$scope.$on('$locationChangeSuccess', function() {
		//	$rootScope.actualLocation = $location.path();
	});   

	// modal settings parameters
	$scope.modal = {
		fsModeEnabled: false,
		exifInfoEnabled: false,
		isVisible: false,
		buttonsAreVisible: true,
		titleIsVisible: true
	};

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
			Working.set('picasaWorking');
			var promise = $scope.getNextItems($scope.photosData, $q.defer());
			promise.then(function(data) {
				$scope.actPhotoIndex = $scope.actPhotoIndex + 1;
			});
		}
		// has more photos -> go to next photo
		else if($scope.hasMorePhotos()) {
			Working.set('picasaWorking');
			$scope.actPhotoIndex = $scope.actPhotoIndex + 1;

		}
		// there are no more photos
		else {
			Working.unset('picasaWorking');
		}

		return $scope.actPhoto();
	};

	// move onto a previous photo and get it's data
	$scope.prevPhoto = function() {
		// we are already on a first image
		if($scope.actPhotoIndex <= 0) {
			$scope.actPhotoIndex = 0;
		}
		// go to on a previous image
		else {
			Working.set('picasaWorking');
			$scope.actPhotoIndex = $scope.actPhotoIndex - 1;
		}

		
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
			Gury.log(data);
		});
	};

	$scope.getTags = function() {
		var promise = picasaService.getTags();
		promise.then(function(data) {
			Gury.log(data);
		});
	};

	$scope.getPhotosByTag = function(maxResults) {
		var promise = picasaService.getLatestPhotos({'maxResults': maxResults, 'albumId': ''});
		promise.then(function(data) {
			Gury.log(data);
		});
	};


	$scope.getLatestPhotos = function(maxResults) {
		var promise = picasaService.getLatestPhotos({'maxResults': maxResults, 'albumId': ''});
		promise.then(function(data) {
			Gury.log(data);
		});
	};

	$scope.openPhoto = function(index) {
		$scope.actPhotoIndex = index;
		$scope.modal.isVisible = true;
	};

	$scope.closePhoto = function() {
		$scope.modal.isVisible = false;
	};

	$scope.toggleExifInfo = function() {
		// will become enabled -> regenerate and tidy exif data
		if(!$scope.modal.exifInfoEnabled) {
			picasaService.tuneExifData($scope.actPhoto());
		}

		$scope.modal.exifInfoEnabled = $scope.modal.exifInfoEnabled ? false : true;
	};

	// toogle fullscreen mode
	$scope.toggleFsMode = function() {
		$scope.modal.fsModeEnabled = $scope.modal.fsModeEnabled ? false : true;
	};

	// is called either from imageLoaded directive after an image is fully loaded
	// or from windowResized directive when dimensions of a window browser have changed
	$scope.maximizePopup = function(imgElm, imgW, imgH) {

		// disable working
		Working.unset('picasaWorking');

		if(imgW) {
			$scope.actPhoto().image.w = imgW;
		}
		else {
			imgW = $scope.actPhoto().image.w;
		}
		if(imgH) {
			$scope.actPhoto().image.h = imgH;
		}
		else {
			imgH = $scope.actPhoto().image.h;
		}

		imgElm = imgElm ? imgElm : $('#simple-modal');

		picasaService.tuneExifData($scope.actPhoto());
		picasaService.maximizeAndCenter( imgElm, $('#simple-modal'), imgW, imgH);

	};

	// toggles between title visible, buttons visible, nothing visible
	$scope.toggleVerbosity = function() {
		if($scope.modal.buttonsAreVisible) {
			$scope.modal.buttonsAreVisible = false;
			$scope.modal.titleIsVisible = false;
		}
		else {
			$scope.modal.buttonsAreVisible = true;
			$scope.modal.titleIsVisible = true;
		}
	};

	$scope.$watch('actPhoto()', function(newVal) {
		if(newVal) {
			picasaService.tuneExifData(newVal);
		}
	});

}]);

