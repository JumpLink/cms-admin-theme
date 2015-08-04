jumplink.cms.controller('HomeContentController', function($rootScope, $scope, $window, contents, navs, events, news, $state, $log, $modal, HistoryService, ContentService, SubnavigationService, SortableService) {
  var page = $state.current.name;
  $scope.contents = contents;
  $scope.news = news;
  $scope.navs = navs; // for left navigation with affix, scrollspy and anchor
  $scope.events = events;
  ContentService.setEditModal($scope);
  SubnavigationService.setEditModal($scope);
  $scope.goTo = HistoryService.goToHashPosition;
  $scope.html = ContentService.getShowHtml();
  ContentService.subscribe();
  SubnavigationService.subscribe();

  // WORKAROUND wait until image is loaded to fix bs-sidebar
  SubnavigationService.resizeOnImagesLoaded();

  $scope.toogleHtml = function() {
    $scope.html = ContentService.toogleShowHtml($scope.contents);
  }

  $scope.addContent = function() {
    var errors = [
      "Error: Konnte Inhaltsblock nicht erzeugen",
      "Error: Konnte Inhaltsblock nicht hinzufügen",
    ];

    var successes = [
      "Neuen Inhaltsblock erfolgreich hinzugefügt",
      "Neue Subnavigation erfolgreich hinzugefügt",
      "Neuen Block erfolgreich hinzugefügt",
    ];

    if($rootScope.authenticated) {
      // generates new content and opens the modal
      ContentService.createEdit($scope.contents, page, function(err, content) {
        if(err) {
          $log.error(errors[0], err);
          $rootScope.pop('error', errors[0], err);
          $scope.$apply();
        } else {
          ContentService.append($scope.contents, content, function (err, contents) {
            if(err) {
              $log.error(errors[1], err);
              $rootScope.pop('error', errors[1], err);
              $scope.$apply();
            } else {
              // $scope.contents = contents;
              // $rootScope.pop('success', successes[0], content.title);
              $scope.$apply();
              SubnavigationService.append($scope.navs, {page:page, target: content.name, name: content.title}, function(err, navs) {
                if(err) {
                  $log.error(errors[2], err);
                  $rootScope.pop('error', errors[2], err);
                } else {
                  // $scope.navs = navs;
                  $rootScope.pop('success', successes[2], content.title);
                  $scope.$apply();
                }
              });
            }
          });  
        }
      });
    }
  }

  $scope.addNav = function() {
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

  $scope.moveForwardNav = function(index, nav) {
    SortableService.moveForward(index, $scope.navs, function(err, navs) {
      if(err) $log.error("Error: On move subnavigation forward!", err);
      else $scope.navs = navs;
    });
  }

  $scope.moveBackward = function(index, content) {
    SortableService.moveBackward(index, $scope.contents, function(err, contents) {
      if(err) $log.error("Error: On move content backward!", err);
      else $scope.contents = contents;
    });
  }

  $scope.moveBackwardNav = function(index, nav) {
    SortableService.moveBackward(index, $scope.navs, function(err, navs) {
      if(err) $log.error("Error: On move content backward!", err);
      else $scope.navs = navs;
    });
  }

  $scope.edit = function(index, content) {
    if($rootScope.authenticated) {
      ContentService.edit(content, function(err, content) {
        if(err) {
          if(err === 'discarded') $log.warn("Edit content ", err);
          else $log.error("Error: On edit content!", err);
        }

      });
    }
  }

  $scope.editNavs = function(navs) {
    if($rootScope.authenticated) {
      SubnavigationService.edit(navs, function(err) {
        if(err) $log.error("[HomeContentController.js] Error: On edit subnavigations!", err);
      });
    }
  }

  $scope.remove = function(index, content) {
    if($rootScope.authenticated) {
      ContentService.remove($scope.contents, index, content, page, function (err, contents) {
        if(err) {
          $log.error("Error: On remove content!", err);
          $rootScope.pop('error', 'Inhaltsblock konnte nicht entfernt werden', "");
        }
        else{
          $rootScope.pop('success', 'Inhaltsblock wurde entfernt', "");
          // $scope.contents = contents;

          SubnavigationService.removeByTarget($scope.navs, content.name, page, function (err, navs) {
            if(err) {
              $log.error("Error: On remove subnavigation!", err);
              $rootScope.pop('error', 'Subnavigation konnte nicht entfernt werden', "");
            }
            else{
              $rootScope.pop('success', 'Subnavigation wurde entfernt', "");
              
            }
          });

        }
      });
    }
  }

  $scope.removeNav = function(index, nav) {
    if($rootScope.authenticated) {
      SubnavigationService.remove($scope.navs, index, nav, page, function (err, navs) {
        if(err) $log.error("Error: On remove subnavigation!", err);
        else {
          $log.debug("remove done!");
          $scope.navs = navs;
        }
      });
    }
  }

  $scope.save = function(index, content) {
    if($rootScope.authenticated) {
      // Save all contents to be shure all positions are saved
      saveAll(function(err, result) {
        if(err) {
          $log.error("Error: On save all!", err);
          $rootScope.pop('error', 'Seite konnte nicht gespeichert werden', err);
        } else {
          $rootScope.pop('success', 'Seite wurde gespeichert', "");
        }
      });
    }
  }

  $scope.refresh = function(cb) {
    ContentService.refresh($scope.contents, cb);
  }

  var saveAll = function(cb) {
    if($rootScope.authenticated) {
      $log.debug("Save news");
      ContentService.saveOne($scope.news, page, function(err, content) {
        if(err) {
          $log.error("Error: On save content!", err);
          if(cb) return cb(err);
          return err;
        }
        $log.debug("Save other contents");
        ContentService.save($scope.contents, page, function(err, contents) {
          if(err) {
            $log.error("Error: On save content!", err);
            if(cb) return cb(err);
            return err;
          }
          $scope.contents = contents;
          // $rootScope.pop('success', 'Seiteninhalt wurde gespeichert', "");
          $log.debug("Save subnavigation");
          SubnavigationService.save($scope.navs, page, function(err, navs) {
            if(err) {
              $log.error("Error: On save navigation!", err);
              if(cb) return cb(err);
              return err;
            }
            $scope.navs = navs;
            // $rootScope.pop('success', 'Navigation wurde gespeichert', "");
            if(cb) cb(null, {contents:contents, navs:navs});
          });
        });
      });
    }
  }

  // TODO move to own drag and drops sortable navigation directive 
  $scope.onDragOnNavComplete = function(index, nav, evt) {
    if(nav == null) {
      $log.debug("*click*", index);
    }
    $log.debug("onDragOnNavComplete, nav:", nav, "index", index);
  }

  $scope.onDropOnNavComplete = function(dropnavindex, dragnav, event) {
    SortableService.dropMove($scope.navs, dropnavindex, dragnav, event, function(err, navs) {
      $scope.navs = navs;
    });
  }

  $scope.onDropOnAreaComplete = function(nav, evt) {
    var index = $scope.navs.indexOf(nav);
    // $log.debug("onDropOnAreaComplete, nav:", nav, "index", index);
  }

});