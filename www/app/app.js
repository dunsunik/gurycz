angular.module( 'gury', [
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

run([ 'titleService', '$rootScope', 'picasaService', 'Working', 'cache', '$filter', '$q', function run ( titleService, $rootScope, picasaService, Working, cache, $filter, $q ) {
	// set default picasa opts
	picasaService.setOpts({user: 'dunsun', imagesize: 1600 });

	titleService.setSuffix( ' | gury' );

	$rootScope.isWorking = function() {
		return Working.isWorking('picasaWorking') ? true : false;
	};

	$rootScope.resetAllLoadings = function() {
		Working.unset('picasaWorking');
	};

	$rootScope.showWorking = function() {
		Working.set('picasaWorking');
	};

	$rootScope.hideWorking = function() {
		Working.unset('picasaWorking');
	};

	$rootScope.albumOpts = {'max-results': 30, imagesize: 288};
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
 

