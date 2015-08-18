jumplink.cms.controller('ToolbarController', function($scope, $log, routes) {

  $scope.routes = routes;
  $scope.title = "JumpLink CMS Administration";
  $scope.shorttitle = "Admin";
  $scope.position = "fixed-top";
  $scope.fluid = true;
});