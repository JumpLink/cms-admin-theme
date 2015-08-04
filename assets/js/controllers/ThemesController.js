jumplink.cms.controller('ThemesController', function($scope, $log, ThemeService, themes, sites) {
  $scope.themeSettings = themes;
  $scope.sites = sites;

  $log.debug("sites", $scope.sites);
  
  $scope.save = function() {
    ThemeService.save($scope.themeSettings.available, function(data) {
      // $scope.themeSettings = data;
      $log.debug(data);
    });
  }
  
});