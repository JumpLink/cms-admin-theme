jumplink.cms.controller('RoutesController', function($rootScope, $scope, $log, $download, RoutesService, RoutesBootstrapService, UtilityService, HistoryService, SortableService) {
  if(angular.isUndefined($scope.routes)) {
    $scope.routes = [];
  }
  $scope.showMainRoutes = false;
  $scope.goToHashPosition = HistoryService.goToHashPosition;

  // ================ START: import export stuff ================
  var onImportFinsih = function (err, routes) {
    if(err) {
      $log.error("[RoutesController.onImportFinsih]", err);
      return err;
    }
    $log.debug("[RoutesController.onImportFinsih]", routes);
    $scope.routes = routes;
  };

  RoutesBootstrapService.setupImportModal($scope, onImportFinsih);
  RoutesBootstrapService.setHost($rootScope.selectedHost);

  /**
   * Export routes and download them
   */
  $scope.download = function() {
    RoutesService.exportByHost($rootScope.selectedHost, true, function(err, results) {

    });
  };

  /**
   * Upload routes and import them
   */
  $scope.upload = function() {
    RoutesBootstrapService.showImportModal(function(err, result) {
      $log.debug("RoutesController.upload", err, result);
    });
  };

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    // $log.debug("[RoutesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      RoutesBootstrapService.setHost(newValue);
      RoutesService.findByHost({host:newValue}, function(err, routes) {
        if(err) {
          $scope.routes = [];
        }
        else {
          $scope.routes = SortableService.sort(routes);
        }
        // $log.debug("[RoutesController] new routes",routes);
      });
    }
  });

  // ================ END: import export stuff ================

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
  };

  var generateObjectnameAndStatename = function (route) {
    route.state.name = "";
    route.state.name = appendToStatename(route.state.name, route.state.parent);
    route.state.name = appendToStatename(route.state.name, route.key);
    route.objectName = RoutesService.generateObjectnameFromStatename(route.state.name);
    if(!angular.isString(route.objectName) || route.objectName.length <= 0) {
      route.objectName = RoutesService.generateObjectnameFromUrl(route.url);
    }
    return route;
  };

  $scope.$watch('routes', function (newValue, oldValue) {
    $log.log("[RoutesController.watch.routes]", newValue);
    for(var i = 0; i < $scope.routes.length; i++) {
      $scope.routes[i] = generateObjectnameAndStatename($scope.routes[i]);
    }
  }, true);

  $scope.save = function() {
    RoutesService.saveEachByHost($rootScope.selectedHost, $scope.routes, function(err, results) {
      if(err) {
        $log.error("[RouteController.save] Error!", err);
        return err;
      }
      $scope.routes = results;
    });
  };

  $scope.destroy = function(index, route) {
    $log.debug('[RouteController.destroy] route', route);
    RoutesService.destroy($scope.routes, index, route, function(result) {
      $log.debug('[RouteController.destroy] result', result);
    });
  };

  $scope.add = function() {
    var data = {main: true};
    RoutesService.append($scope.routes, data, function(err, routes) {
      $scope.routes = routes;
      if(err) {
        $log.error("Error: On add routes!", err);
        return err;
      }
      $log.debug("[RoutesController.add] Add routes done!", routes);
    });
  };

  $scope.addAlternativeUrl = function($index, route) {
    $log.debug("[RoutesController.addAlternativeUrl]", $index, route);
    if(angular.isUndefined(route.alternativeUrls) || !angular.isArray(route.alternativeUrls)) {
      route.alternativeUrls = [""];
    }
    route.alternativeUrls.push("");
  };

  $scope.removeAlternativeUrl = function($index, route) {
    $log.debug("[RoutesController.removeAlternativeUrl]", $index, route);
    if(route.alternativeUrls.length >= 1) {
      route.alternativeUrls.pop();
    }
  };

  $scope.edit = function($index, route) {
    $log.debug("[RoutesController.edit] TODO!", $index, route);
  };

  $scope.moveForward = function(index, route) {
    RoutesService.moveForward(index, $scope.routes, function(err, routes) {
      if(err) {
        $log.error("Error: On move route forward!", err);
        return err;
      }
      $scope.routes = routes;
    });
  };

  $scope.moveBackward = function(index, route) {
    RoutesService.moveBackward(index, $scope.routes, function(err, routes) {
      if(err) {
        $log.error("Error: On move route backward!", err);
        return err;
      }
      $scope.routes = routes;
    });
  };

});
