jumplink.cms.controller('RoutesController', function($rootScope, $scope, $log, RoutesService) {
  // $scope.themeSettings = {};

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    $log.debug("[ThemesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {

    }
  });
  
  $scope.save = function() {
    $log.debug('themeSettings', $scope.themeSettings);
    RoutesService.updateOrCreateEachByHost($rootScope.selectedHost, $scope.themeSettings.available, function(data) {
      // $scope.themeSettings = data;
      $log.debug(data);
    });
  }


  $scope.add = function() {
    if($rootScope.authenticated) {
      SubnavigationService.add($scope.navs, {page:page}, function(err, navs) {
        if(err) $log.error("Error: On add navs!", err);
        $log.debug("add navs done!", navs);
      });
    }
  }

  $scope.moveForward = function(index, content) {
    SortableService.moveForward(index, $scope.contents, function(err, contents) {
      if(err) $log.error("Error: On move content forward!", err);
      else $scope.contents = contents;
    });
  }

  $scope.moveBackward = function(index, content) {
    SortableService.moveBackward(index, $scope.contents, function(err, contents) {
      if(err) $log.error("Error: On move content backward!", err);
      else $scope.contents = contents;
    });
  } 

});
