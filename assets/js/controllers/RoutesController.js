jumplink.cms.controller('RoutesController', function($rootScope, $scope, $log, RoutesService, UtilityService, HistoryService) {
  if(angular.isUndefined($scope.routes)) $scope.routes = [];
  $scope.showMainRoutes = true;

  $scope.goToHashPosition = HistoryService.goToHashPosition;

  // $scope.showOnlyMainRoutes = function() {
  //   return function (route) {
  //     $log.debug("showOnlyMainRoutes", route);
  //     if($scope.showMainRoutes === false) return true;
  //     else return route.main;
  //   }
  // };

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    // $log.debug("[RoutesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      RoutesService.findByHost({host:newValue}, function(err, routes) {
        if(err) $scope.routes = [];
        else $scope.routes = routes;
        // $log.debug("[RoutesController] new routes",routes);
      });
    }
  });

  $scope.$watch('routes', function (newValue, oldValue) {
    $log.log(newValue);
    for(var i = 0; i < newValue.length; i++) {
      if(angular.isDefined(newValue[i].state.parent) && angular.isUndefined(newValue[i].key)) {
        newValue[i].state.name = newValue[i].state.parent.toLowerCase();
        newValue[i].objectName = newValue[i].state.parent.toLowerCase();
      }
      if(angular.isDefined(newValue[i].state.parent) && angular.isDefined(newValue[i].key)) {
        var keys = newValue[i].key.split('.');
        newValue[i].state.name = newValue[i].state.parent.toLowerCase() + "." + newValue[i].key.toLowerCase();
        newValue[i].objectName = newValue[i].state.parent.toLowerCase();
        for (var k = 0; k < keys.length; k++) {
          newValue[i].objectName += UtilityService.capitalizeFirstLetter(keys[k]);
        };
      }
    };
  }, true);

  $scope.save = function() {
    RoutesService.saveEachByHost($rootScope.selectedHost, $scope.routes, function(result) {
      $log.debug('[RouteController.save] result', result);
    });
  };

  $scope.destroy = function(index, route) {
    $log.debug('[RouteController.destroy] route', route);
    RoutesService.destroy($scope.routes, index, route, function(result) {
      $log.debug('[RouteController.destroy] result', result);
    });
  }

  $scope.add = function() {
    RoutesService.append($scope.routes, {}, function(err, routes) {
      if(err) $log.error("Error: On add routes!", err);
      $log.debug("[RoutesController.add] Add routes done!", routes);
    });
  };

  $scope.addAlternativeUrl = function($index, route) {
    $log.debug("[RoutesController.addAlternativeUrl]", $index, route);
    if(angular.isUndefined(route.alternativeUrls) || !angular.isArray(route.alternativeUrls)) route.alternativeUrls = [""];
    else route.alternativeUrls.push("");
  };

  $scope.removeAlternativeUrl = function($index, route) {
    $log.debug("[RoutesController.removeAlternativeUrl]", $index, route);
    if(route.alternativeUrls.length >= 1) route.alternativeUrls.pop();
  };

  $scope.edit = function($index, route) {
    $log.debug("[RoutesController.edit] TODO!", $index, route);
  };

  $scope.moveForward = function(index, route) {
    RoutesService.moveForward(index, $scope.routes, function(err, routes) {
      if(err) $log.error("Error: On move route forward!", err);
      else $scope.routes = routes;
    });
  };

  $scope.moveBackward = function(index, route) {
    RoutesService.moveBackward(index, $scope.routes, function(err, routes) {
      if(err) $log.error("Error: On move route backward!", err);
      else $scope.routes = routes;
    });
  };

});
