jumplink.cms.controller('StatusController', function($rootScope, $scope, status, $location, $anchorScroll, $state, $log, $interval, CmsService, moment) {
  var page = $state.current.name;
  $scope.status = status;

  $log.debug("[StatusController]", $scope.status);

  $scope.goTo = function (hash) {
    $location.hash(hash);
    $anchorScroll.yOffset = 60;
    $anchorScroll();
  };

  $scope.restart = function () {
    $log.debug("[StatusController.restart]");
    CmsService.restart(function (err, res) {
      $log.debug(err, res);
    });
  };

  var calcUptime = function () {
    $scope.uptime = moment($scope.status.pm2[0].pm2_env.pm_uptime).fromNow(true);
  };
  calcUptime();
  $interval(calcUptime, 1000);

});