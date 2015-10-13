jumplink.cms.controller('UsersController', function($scope, $rootScope, $sailsSocket, $log, UserService) {
  $scope.users = {};

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    $log.debug("[ThemesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      UserService.findByHost(newValue, function(err, users) {
        $scope.users = users;
      });
    }
  });

  $scope.remove = function(user) {
    UserService.remove($scope.users, user);
  }

  UserService.subscribe();

});