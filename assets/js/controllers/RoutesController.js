jumplink.cms.controller('RoutesController', function($rootScope, $scope, $log, ThemeService) {
  $scope.themeSettings = {};

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    $log.debug("[ThemesController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      ThemeService.findByHost(newValue, function(err, themes) {
        $scope.themeSettings = themes;
      });
    }
  });
  
  $scope.save = function() {
    $log.debug('themeSettings', $scope.themeSettings);
    ThemeService.updateOrCreateEachByHost($rootScope.selectedHost, $scope.themeSettings.available, function(data) {
      // $scope.themeSettings = data;
      $log.debug(data);
    });
  }
  
});