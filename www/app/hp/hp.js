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
angular.module( 'gury.hp', [
	'gury.base'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config([ '$routeProvider', function config( $routeProvider ) {
	$routeProvider.when( '/hp', {
		controller: 'HpCtrl',
		templateUrl: 'hp/hp.tpl.html'
	});
}])

/**
 * And of course we define a controller for our route.
 */
.controller( 'HpCtrl', [ '$scope', '$rootScope', 'titleService', 'cache', 'flickrService', function HpController( $scope, $rootScope, titleService, cache, flickrService) {
	titleService.setTitle( 'Home' );

	$scope.test = function() {
		flickrService.getAlbums();
	};

	/*
	// get albums
	flickrService.getAlbumsCached().then(function(albums) {
		$rootScope.albums = albums;
	});
	*/

/*		
	$.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
		{
		//id: "51997044@N03",
		tags: 'landscape wide',
		tagmode: "all", 
		format: "json" 
		},
		function(data) {
			var images = [];
			angular.forEach(data.items, function(item) {
				images.push({ src: item.media.m.replace('_m\\.jpg', '_b.jpg'), fade: 1500});
			});

			// init vegas backgrounds
			$.vegas('slideshow', {
				delay: 13000,
				backgrounds : images
			});
			$.vegas('overlay', {
				src: 'assets/vegas/overlays/00.png' //02
			});

		}
	);
*/

}]);

