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

  var appendToStatename = function (statename, toAppend) {
    $log.debug("[RoutesController.appendToStatename]", statename, toAppend);
    if(angular.isString(toAppend) && toAppend.length > 0) {
      if(angular.isString(statename) && statename.length > 0) {
        statename += "."+toAppend.toLowerCase();
      } else {
        statename = toAppend.toLowerCase();
      }
    }
    return statename;
  }

  var generateObjectnameAndStatename = function (route) {
    route.state.name = "";
    route.state.name = appendToStatename(route.state.name, route.state.parent);
    route.state.name = appendToStatename(route.state.name, route.key);
    route.objectName = RoutesService.generateObjectnameFromStatename(route.state.name);
    if(!angular.isString(route.objectName) || route.objectName.length <= 0) {
      route.objectName = RoutesService.generateObjectnameFromUrl(route.url);
    }
    return route;
  }

  $scope.$watch('routes', function (newValue, oldValue) {
    $log.log("[RoutesController.watch.routes]", newValue);
    for(var i = 0; i < $scope.routes.length; i++) {
      $scope.routes[i] = generateObjectnameAndStatename($scope.routes[i]);
    };
  }, true);

  $scope.save = function() {
    RoutesService.saveEachByHost($rootScope.selectedHost, $scope.routes, function(results) {
      $scope.routes = results;
      $log.debug('[RouteController.save] result', results);
    });
  };

  $scope.destroy = function(index, route) {
    $log.debug('[RouteController.destroy] route', route);
    RoutesService.destroy($scope.routes, index, route, function(result) {
      $log.debug('[RouteController.destroy] result', result);
    });
  }

  $scope.add = function() {
    $log.error("[RoutesController.add]");
    var data = {main: true};
    RoutesService.append($scope.routes, data, function(err, routes) {
      $scope.routes = routes;
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
