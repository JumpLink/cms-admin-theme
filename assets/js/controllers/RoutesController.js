jumplink.cms.controller('RoutesController', function($rootScope, $scope, $log, RoutesService) {
  if(angular.isUndefined($scope.routes)) $scope.routes = [];

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    $log.debug("[RoutesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      RoutesService.findByHost({host:newValue}, function(err, routes) {
        if(err) $scope.routes = [];
        else $scope.routes = routes;
        $log.debug("[RoutesController] new routes",routes);
      });
    }
  });

  
  $scope.save = function() {
    $log.debug('themeSettings', $scope.themeSettings);
    RoutesService.updateOrCreateEachByHost($rootScope.selectedHost, $scope.routes, function(data) {
      // $scope.themeSettings = data;
      $log.debug(data);
    });
  }


  $scope.add = function() {
    RoutesService.append($scope.routes, {}, function(err, routes) {
      if(err) $log.error("Error: On add routes!", err);
      $log.debug("[RoutesController.add] Add routes done!", routes);
    });
  }

  $scope.moveForward = function(index, content) {
    RoutesService.moveForward(index, $scope.contents, function(err, contents) {
      if(err) $log.error("Error: On move content forward!", err);
      else $scope.contents = contents;
    });
  }

  $scope.moveBackward = function(index, content) {
    RoutesService.moveBackward(index, $scope.contents, function(err, contents) {
      if(err) $log.error("Error: On move content backward!", err);
      else $scope.contents = contents;
    });
  } 

});
