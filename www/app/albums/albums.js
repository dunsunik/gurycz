angular.module( 'gury.albums', [
	'gury.base'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config([ '$routeProvider', function config( $routeProvider ) {
	$routeProvider.when( '/albums', {
		controller: 'AlbumsCtrl',
		templateUrl: 'albums/albums.tpl.html'
	});
}])

/**
 * And of course we define a controller for our route.
 */
.controller( 'AlbumsCtrl', [ '$scope', 'titleService', 'picasaService', '$routeParams', 'cache', '$rootScope', '$filter', function PhotosController( $scope, titleService, picasaService, $routeParams, cache, $rootScope, $filter ) {
	titleService.setTitle( 'Albumy' );

	// disable all handlers listening on a window scroll
	$(window.document).off( "scroll");

	// get all albums and put them into a cache
	var albums = cache.get('albums');

	if(!albums) {
		var promise = picasaService.getAlbums({'max-results': 7, imagesize: 288}).then(function(data) {
			data = $filter('picasaExcludeSystemAlbums')(data);
			cache.put('albums', data);
			$scope.years = $filter('picasaItemsByYearsFilter')(data);
		});
	}
	else {
		$scope.years = $filter('picasaItemsByYearsFilter')(albums);
	}

}]);

