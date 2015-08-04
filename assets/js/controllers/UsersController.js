jumplink.cms.controller('UsersController', function($scope, $rootScope, $sailsSocket, users, $log, UserService) {
  $scope.users = users;

  $scope.remove = function(user) {
    UserService.remove($scope.users, user);
  }

  UserService.subscribe();

});