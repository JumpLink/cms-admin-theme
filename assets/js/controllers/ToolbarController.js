jumplink.cms.controller('ToolbarController', function($scope, $log, routes) {

  $scope.routes = routes;
  $log.debug($scope.routes);

});