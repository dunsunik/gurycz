angular.module( 'gury.about', [
	'gury.base'
])

.config([ '$routeProvider', function config( $routeProvider ) {
	$routeProvider.when( '/about', {
		controller: 'AboutCtrl',
		templateUrl: 'about/about.tpl.html'
	});
}])

.controller( 'AboutCtrl', [ '$scope', 'titleService', function AboutCtrl( $scope, titleService ) {
	titleService.setTitle( 'O mě' );
  
	// This is simple a demo for UI Boostrap.
	$scope.dropdownDemoItems = [
		"The first choice!",
		"And another choice for you.",
		"but wait! A third!"
	];
}]);
