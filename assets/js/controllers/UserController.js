jumplink.cms.controller('UserController', function($scope, $rootScope, user, $state, $log, UserService) {
  $scope.user = user;

  $scope.save = function (user) {
    if(angular.isUndefined(user)) {
      user = $scope.user;
    }
    UserService.updateOrCreateByHost($rootScope.selectedHost, user, function (err, user) {
      $state.go('layout.users');
    });
  };

  UserService.subscribe();
});