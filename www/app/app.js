angular.module( 'gury', [
	'ngRoute',
	'ahTouch',
	'app-templates',
	'component-templates',
	'gury.base',
	'gury.photosBase',
	'gury.flickr',
	'gury.picasa',
	'gury.hp',
	'gury.portfolio',
	'gury.albums',
	'gury.photos',
	'gury.about'
]).

config( function myAppConfig ( $routeProvider ) {
	$routeProvider.otherwise({ redirectTo: '/portfolio' });
}).

run([ 'titleService', '$rootScope', 'picasaService', 'flickrService', 'Working', 'cache', '$filter', '$q', function run ( titleService, $rootScope, picasaService, flickrService, Working, cache, $filter, $q ) {
	// set flickr settings
	flickrService.setOpts({
		api_key: 'acc0d15f07c3f8cb5838d583971cc3e5',
		user_id: '30314549@N02',
		thumbSize: 'q',
		fullSize: 'o',
		albumSize: 'm',
		albumPerPage: 100
	});

	// picasaService.setOpts({user: 'gury.cz', imgmax: 1600 });

	titleService.setSuffix( ' | gury' );

	$rootScope.isWorking = function() {
		return Working.isWorking('fetchingPhotosWorking') ? true : false;
	};

	$rootScope.resetAllLoadings = function() {
		Working.unset('fetchingPhotosWorking');
	};

	$rootScope.showWorking = function() {
		Working.set('fetchingPhotosWorking');
	};

	$rootScope.hideWorking = function() {
		Working.unset('fetchingPhotosWorking');
	};
}]).

// controller
controller( 'AppCtrl', [ '$scope', '$location', 'Working', '$rootScope', function AppCtrl ( $scope, $location, Working, $rootScope ) {
	$scope.goBack = function() {
		window.history.back();
	};

	$scope.scrollTop = function() {
		$('html, body').animate({ scrollTop: 0 }, 500, function(){ });
	};

	// good for a testing only
	$scope.toggleSpinner = function() {
		if($rootScope.isWorking()) {
			Working.unset('picasaWorking');
		}
		else {
			Working.set('picasaWorking');
		}
	};
}]);

// just start the whole angular thing after the document loading is ready
angular.element(document).ready(function() {
	angular.bootstrap(document, ['gury']);
});
 

