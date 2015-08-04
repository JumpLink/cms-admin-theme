jumplink.cms.controller('LinksController', function($rootScope, $scope, $sailsSocket, links, $location, $anchorScroll, $state, $log) {
  var page = $state.current.name;
  $scope.links = links;

  $scope.goTo = function (hash) {
    $location.hash(hash);
    $anchorScroll.yOffset = 60;
    $anchorScroll();
  }

  $scope.toogleHtml = function() {
    $scope.html = !$scope.html;
  }

  $scope.save = function() {
    $scope.links.page = page;
    ContentService.saveOne($scope.news, page, function(err, contents) {
      if(err) {
        $log.error("Error: On save content!", err);
        if(cb) return cb(err); else return err; }
      else {
        $rootScope.pop('success', 'Links-Text wurde aktualisiert', "");
      }
    });
  }

  // called on content changes
  $sailsSocket.subscribe('content', function(msg) {
    $log.debug(msg);
    switch(msg.verb) {
      case 'updated':
        switch(msg.id) {
          case 'links':
            $scope.links = msg.data;
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Links-Text wurde aktualisiert', "");
            }
          break;
        }
      break;
    }
  });

});