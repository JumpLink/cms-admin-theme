jumplink.cms.controller('CmsController', function($rootScope, $scope, info, $location, $anchorScroll, $state, $log) {
  var page = $state.current.name;
  $scope.info = info;

  $scope.goTo = function (hash) {
    $location.hash(hash);
    $anchorScroll.yOffset = 60;
    $anchorScroll();
  }

});