angular.module( 'gury', [
	'ui.bootstrap',
	'app-templates',
	'component-templates',
	'gury.base',
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

run([ 'titleService', '$rootScope', 'picasaService', 'Working', function run ( titleService, $rootScope, picasaService, Working ) {
	// set default picasa opts
	picasaService.setOpts({user: 'dunsun'});

	titleService.setSuffix( ' | gury' );

	$rootScope.$watch("Working.isWorking('scrollIsLoadingPhotos')", function(val) {
		console.log('loadingggggggg');
	});


	$rootScope.isWorking = function() {
		return Working.isWorking('picasaLoading') || Working.isWorking('scrollIsLoadingPhotos') ? true : false;
	};

	$rootScope.resetAllLoadings = function() {
		Working.unset('picasaLoading');
		Working.unset('scrollIsLoadingPhotos');
	};


	$rootScope.showWorking = function() {
		Working.set('loading-global');
	};

	$rootScope.hideWorking = function() {
		Working.unset('loading-global');
	};
}]).

// controller
controller( 'AppCtrl', [ '$scope', '$location', function AppCtrl ( $scope, $location ) {

}]);

// just start the whole angular thing after the document loading is ready
angular.element(document).ready(function() {
	angular.bootstrap(document, ['gury']);
});
 

