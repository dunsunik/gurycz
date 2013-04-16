angular.module( 'gury', [
	'ui.bootstrap',
	'app-templates',
	'component-templates',
	'gury.base',
	'gury.home',
	'gury.photos',
	'gury.albums',
	'gury.about',
	'gury.picasa'
]).

config( function myAppConfig ( $routeProvider ) {
	$routeProvider.otherwise({ redirectTo: '/home' });
}).

run([ 'titleService', function run ( titleService ) {
  titleService.setSuffix( ' | gury' );
}]).

// controller
controller( 'AppCtrl', [ '$scope', '$location', function AppCtrl ( $scope, $location ) {

}]);

// just start the whole angular thing after the document loading is ready
angular.element(document).ready(function() {
	angular.bootstrap(document, ['gury']);
});
 

