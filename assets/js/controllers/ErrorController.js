jumplink.cms.controller('ErrorController', function($rootScope, $scope, $log, $stateParams, SessionService, SigninService, $state) {
  $scope.error = $stateParams.error;

  $scope.signin = function () {
    $log.debug($scope.user);
    // $scope.user.role = 'superadmin';
    SigninService.signin($scope.user, false, function (error, result) {
      if(error) $scope.error = error;
      else {
        $state.go('layout.home');
      }
      $log.debug(result);
    });
  }

  $scope.signin = function () {
    $log.debug("[SigninController.signin]", $scope.user);
    SigninService.signin($scope.user, false, function (error, result) {
      if(error) {
        $scope.error = error;
        return $scope.error ;
      }
      if(result.authenticated) {
        $rootScope.authenticated = result.authenticated;
        $rootScope.user = result.user;
        $rootScope.site = result.site;
        SessionService.isAuthenticated(function (err, isAuthenticated) {
          $rootScope.authenticated = isAuthenticated;
          SessionService.superadmin(function (err, isSuperadmin) {
            $rootScope.superadmin = isSuperadmin;
            $state.go('layout.home');
          });
        });        
      }
      $log.debug("[SigninController.signin]", result);
    });
  };
  
});