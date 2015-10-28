jumplink.cms.controller('ContentController', function($rootScope, $scope, $log, $download, ContentService, ContentBootstrapService, UtilityService, HistoryService, SortableService) {
  if(angular.isUndefined($scope.contents)) {
    $scope.contents = [];
  }
  $scope.showMaincontents = false;
  $scope.goToHashPosition = HistoryService.goToHashPosition;

  // ================ START: import export stuff ================
  var onImportFinsih = function (err, contents) {
    if(err) {
      $log.error("[ContentController.onImportFinsih]", err);
      return err;
    }
    $log.debug("[ContentController.onImportFinsih]", contents);
    $scope.contents = contents;
  };

  ContentBootstrapService.setupImportModal($scope, onImportFinsih);
  ContentBootstrapService.setHost($rootScope.selectedHost);

  /**
   * Export contents and download them
   */
  $scope.download = function() {
    ContentService.exportByHost($rootScope.selectedHost, true, function(err, results) {

    });
  };

  /**
   * Upload contents and import them
   */
  $scope.upload = function() {
    ContentBootstrapService.showImportModal(function(err, result) {
      $log.debug("ContentController.upload", err, result);
    });
  };

  $rootScope.$watch('selectedHost', function(newValue, oldValue) {
    // $log.debug("[ContentController] selectedHost changed from",oldValue,"to",newValue);
    if(angular.isDefined(newValue)) {
      ContentBootstrapService.setHost(newValue);
      ContentService.findByHost({host:newValue}, function(err, contents) {
        if(err) {
          $scope.contents = [];
        }
        else {
          $scope.contents = SortableService.sort(contents);
        }
        $log.debug("[ContentController] new contents", contents);
      });
    }
  });

  // ================ END: import export stuff ================

  $scope.save = function() {
    ContentService.saveEachByHost($rootScope.selectedHost, $scope.contents, function(err, results) {
      if(err) {
        $log.error("[contentController.save] Error!", err);
        return err;
      }
      $scope.contents = results;
    });
  };

  $scope.destroy = function(index, content) {
    $log.debug('[contentController.destroy] content', content);
    ContentService.destroy($scope.contents, index, content, function(result) {
      $log.debug('[contentController.destroy] result', result);
    });
  };

  $scope.add = function() {
    var data = {main: true};
    ContentService.append($scope.contents, data, function(err, contents) {
      $scope.contents = contents;
      if(err) {
        $log.error("Error: On add contents!", err);
        return err;
      }
      $log.debug("[ContentController.add] Add contents done!", contents);
    });
  };

 
  $scope.edit = function($index, content) {
    $log.debug("[ContentController.edit] TODO!", $index, content);
  };


});
