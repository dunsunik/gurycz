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
	$routeProvider.when( '/photos/album-id/:albumId', {
		controller: 'PhotosCtrl',
		templateUrl: 'photos/photos.tpl.html'
	});
}])

/**
 * And of course we define a controller for our route.
 */
.controller( 'PhotosCtrl', [ '$scope', 'titleService', 'picasaService', '$routeParams', function PhotosController( $scope, titleService, picasaService, $routeParams ) {
	titleService.setTitle( 'Photos' );

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

