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
angular.module( 'gury.portfolio', [
	'gury.base'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config([ '$routeProvider', function config( $routeProvider ) {
	$routeProvider.when( '/portfolio', {
		controller: 'PortfolioCtg',
		templateUrl: 'portfolio/portfolio.tpl.html'
	});
}])

/**
 * And of course we define a controller for our route.
 */
.controller( 'PortfolioCtg', [ '$scope', '$rootScope', 'titleService', 'picasaService', 'cache', function HpController( $scope, $rootScope, titleService, picasaService, cache ) {
	titleService.setTitle( 'Home' );

	// enquire - media queries - replace images
	enquire.register("(max-width: 767px)", {
		match : function() {
			var img = $('.portfolio-ctgs .big-ctg a img');
			img.attr('src', img.attr('data-src-mobile'));
		},
		unmatch : function() {
			var img = $('.portfolio-ctgs .big-ctg a img');
			img.attr('src', img.attr('data-src-desktop'));
		},
		deferSetup : true	// OPTIONAL, defaults to false If set to true, defers execution the setup function until the media query is first matched. still triggered just once
	});

	$(window.document).off( "scroll");

	// get albums and put them into a cache
	picasaService.getAlbumsCached($rootScope.albumOpts).then(function(albums) {
	});

	/*
	// get 5 latest photos
	if(cache.get('latestTopPhotos') === undefined) {
		promise = picasaService.getLatestPhotos({'maxResults': 5});
		promise.then(function(data) {
			$scope.latestPhotos = data;
			cache.put('latestTopPhotos', data);
		});
	}
	else {
			$scope.latestPhotos = data;
	}
	*/
}]);

