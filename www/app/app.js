angular.module( 'gury', [
	'ui.bootstrap',
	'ui.directives',
	'ahTouch',
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
	$routeProvider.otherwise({ redirectTo: '/hp' });
}).

run([ 'titleService', '$rootScope', 'picasaService', 'Working', function run ( titleService, $rootScope, picasaService, Working ) {
	// set default picasa opts
	picasaService.setOpts({user: 'dunsun', imagesize: 1600 });

	titleService.setSuffix( ' | gury' );

	$rootScope.$watch('isWorking', function(val) {
		console.log('loading:' + val);
	});

	$rootScope.isWorking = function() {
		return Working.isWorking('picasaWorking') || Working.isWorking('scrollIsLoadingPhotos') ? true : false;
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

	$rootScope.scrollTop = function() {
		$('html, body').animate({ scrollTop: 0 }, 500, function(){ });
	};
}]).

// controller
controller( 'AppCtrl', [ '$scope', '$location', function AppCtrl ( $scope, $location ) {
	$scope.goBack = function() {
		window.history.back();
	};
}]);

// just start the whole angular thing after the document loading is ready
angular.element(document).ready(function() {
	angular.bootstrap(document, ['gury']);
});
 

