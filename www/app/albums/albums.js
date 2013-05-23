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

	$(window.document).off( "scroll");

	var albumsDataReady = function(data) {
		var years = [];

		var prevYear = undefined;
		var items = [];

		var breakYearRow = function(years, items, prevYear) {
			years.push({
				year: prevYear,
				items: items
			});
		};

		angular.forEach(data.items, function(item) {
			item = $filter('picasaItemFilter')(item, 'album');

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

		$rootScope.years = years;
	};

	// get all albums and put them into a cache
	var albums = cache.get('albums');

	if(!albums) {
		var promise = picasaService.getAlbums({'max-results': 7}).then(function(data) {
			cache.put('albums', data);
			albumsDataReady(data);
		});
	}
	else {
		albumsDataReady(albums);
	}

}]);

