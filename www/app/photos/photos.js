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
.controller( 'PhotosCtrl', [ '$scope', 'titleService', 'picasaService', '$routeParams', 'Working', function PhotosController( $scope, titleService, picasaService, $routeParams, Working ) {
	titleService.setTitle( 'Photos' );

	// type - tag, latest, album
	var type = $routeParams.type;
	$scope.type = $routeParams.type;

	// show photos for a specified tag
	if(type == "tag") {
		picasaService.getPhotos({'max-results': 6, tag: $routeParams.val}).then(function(data) {
			console.log('prijely fota by tag');
			console.log(data);
			$scope.photos = data;
		});
	}
	// show latest photos
	else if(type == "latest") {
		picasaService.getPhotos({'max-results': 4, tag: $routeParams.val}).then(function(data) {
			console.log('prijely fota latest');
			console.log(data);
		});
	}
	// show photos in a specified album
	else if(type == "albumid") {
		picasaService.getPhotos({'max-results': 20, 'albumid': $routeParams.val}).then(function(data) {
			$scope.photos = data;
			console.log('prijely fota by albumid');
			console.log(data);
		});
	}

	$scope.getNextItemsAbsUrl = function() {
		var last = $scope.photos.length;
		last = last > 0 ? last - 1 : 0;

		console.log($scope.photos[last]);

		return 'neco';
	};


	// will fetch next items (photos) from google
	$scope.getNextItems = function(data) {
		console.log('fetchuju');
		if(data && data.nextLink) {
			picasaService.getPhotos({ nextLink: data.nextLink }).then(function(data) {
				// if there are some photos already append newly responded photos to it
				if($scope.photos && $scope.photos.items.length > 0) {
					angular.forEach(data.items, function(item) {
						$scope.photos.items.push(item);
					});
				}
				else {
					$scope.photos = data;
				}

				// execute all $on listeners
				$scope.$broadcast('onScrollNextFinished', data);
			});
		}
	};
		
	$scope.getAlbums = function() {
		console.log('jede');
		console.log(picasaService);
		var promise = picasaService.getAlbums();
		promise.then(function(data) {
			$scope.albums = data;
			console.log('OK');
			console.log(data);
		});
	};

	$scope.getTags = function() {
		console.log('jede');
		console.log(picasaService);
		var promise = picasaService.getTags();
		promise.then(function(data) {
			console.log('OK');
			console.log(data);
		});
	};

	$scope.getPhotosByTag = function(maxResults) {
		console.log('jede');
		console.log(picasaService);
		var promise = picasaService.getLatestPhotos({'maxResults': maxResults, 'albumId': ''});
		promise.then(function(data) {
			console.log('OK');
			console.log(data);
		});
	};


	$scope.getLatestPhotos = function(maxResults) {
		console.log('jede');
		console.log(picasaService);
		var promise = picasaService.getLatestPhotos({'maxResults': maxResults, 'albumId': ''});
		promise.then(function(data) {
			console.log('OK');
			console.log(data);
		});
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

