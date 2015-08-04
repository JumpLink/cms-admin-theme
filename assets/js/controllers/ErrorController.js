jumplink.cms.controller('ErrorController', function($scope, $log, $stateParams, SessionService, $state) {
  $scope.error = $stateParams.error;

  $scope.signin = function () {
    $log.debug($scope.user);
    $scope.user.role = 'superadmin';
    SessionService.create($scope.user, function (error, result) {
      if(error) $scope.error = error;
      else {
        $state.go('layout.home');
      }
      $log.debug(result);
    });
  }
  
});