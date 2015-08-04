jumplink.cms.controller('GalleryContentController', function($rootScope, $scope, $state, Fullscreen, $sailsSocket, $stateParams, contents_images, navs, config, $modal, $log, $location, $state, SortableService, GalleryService, ContentService, SubnavigationService, HistoryService) {
  $scope.images = contents_images.images;;
  $scope.config = config;
  $scope.contents = contents_images.contents;
  $scope.navs = navs;
  $scope.html = ContentService.getShowHtml();
  $scope.dropdown = GalleryService.getDropdown();
  $scope.goTo = HistoryService.goToHashPosition;

  var page = $state.current.name;

  GalleryService.setEditModal($scope);
  GalleryService.setUploadModal($scope, $scope.images, $scope.contents);
  GalleryService.subscribe();

  ContentService.setEditModal($scope);
  ContentService.subscribe();

  SubnavigationService.setEditModal($scope);
  SubnavigationService.subscribe();

  $scope.toogleHtml = function() {
    $scope.html = ContentService.toogleShowHtml($scope.contents);
  };

  $scope.removeContent = function(index, content) {
    if($rootScope.authenticated) {
      ContentService.remove($scope.contents, index, content, page, function (err, contents) {
        if(err) {
          $log.error("Error: On remove content!", err);
          $rootScope.pop('error', 'Inhaltsblock konnte nicht entfernt werden', "");
        }
        else{
          // $rootScope.pop('success', 'Inhaltsblock wurde entfernt', "");
          // $scope.contents = contents;
          SubnavigationService.removeByTarget($scope.navs, content.name, page, function (err, navs) {
            if(err) {
              $log.error("Error: On remove subnavigation!", err);
              $rootScope.pop('error', 'Subnavigation konnte nicht entfernt werden', "");
            }
            else{
              // $rootScope.pop('success', 'Subnavigation wurde entfernt', "");
              $rootScope.pop('success', 'Erfolgreich entfernt', "");
            }
          });
        }
      });
    }
  };

  $scope.removeImage = function(image) {
    $log.debug("removeImage", "image", image);
    if($rootScope.authenticated) {
      GalleryService.remove($scope.images[image.content], null, image, page, function (err, images) {
        if(err) {
          $log.error("Error: On remove content!", err);
          $rootScope.pop('error', 'Bild konnte nicht entfernt werden', "");
        } else{
          $rootScope.pop('success', 'Bild wurde entfernt', "");
          $scope.images[content.name] = images;
        }
      });
    }
  };

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

  var addImage = function() {
    if($rootScope.authenticated) {
      GalleryService.add($scope.images, $scope.contents, function(err, image) {
        if(err) $log.error("Error: On image content!", err);
      });
    }
  };

  var addContent = function() {
    var errors = [
      "Error: Konnte Inhaltsblock nicht erzeugen",
      "Error: Konnte Inhaltsblock nicht hinzufügen",
      "Error: Konnte subnavigation nicht hinzufügen",
      "Error: Konnte Bilderblock nicht hinzufügen"
    ];

    var successes = [
      "Neuen Inhaltsblock erfolgreich hinzugefügt",
      "Neue Subnavigation erfolgreich hinzugefügt",
      "Neuen Bilderblock erfolgreich hinzugefügt",
      "Neuen Block erfolgreich hinzugefügt",
    ];

    if($rootScope.authenticated) {
      ContentService.createEdit($scope.contents, page, function(err, content) {
        if(err) {
          $log.error(errors[0], err);
          $rootScope.pop('error', errors[0], err);
          $scope.$apply();
        } else {
          ContentService.append($scope.contents, content, function (err, contents) {
            if(err) {
              $log.error(errors[1], err);
              // $rootScope.pop('error', errors[1], err);
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
                  // $rootScope.pop('success', successes[1], content.name);
                  $scope.$apply();

                  // also add an image block to content block
                  GalleryService.addBlock($scope.images, content, function(err, imageBock) {
                    if(err) {
                      $log.error(errors[3], err);
                      $rootScope.pop('error', errors[3], err);
                    } else {
                      $rootScope.pop('success', successes[3], content.name);
                      $scope.$apply();
                    }
                  });
                }
              });
            }
          });  
        }
      });
    }
  };

  $scope.addNav = function() {
    if($rootScope.authenticated) {
      SubnavigationService.append($scope.navs, {page:page}, function(err, navs) {
        if(err) $log.error("Error: On add subnavigation!", err);
        // $log.debug("add done on subnavigation!", '');
      });
    }
  };

  $scope.moveForwardContent = function(index, content) {
    SortableService.moveForward(index, $scope.contents, function(err, contents) {
      if(err) $log.error("Error: On move content forward!", err);
      else $scope.contents = contents;
    });
  };

  $scope.moveForwardNav = function(index, nav) {
    SortableService.moveForward(index, $scope.navs, function(err, navs) {
      if(err) $log.error("Error: On move subnavigation forward!", err);
      else $scope.navs = navs;
    });
  };

  $scope.moveBackwardContent = function(index, content) {
    SortableService.moveBackward(index, $scope.contents, function(err, contents) {
      if(err) $log.error("Error: On move content backward!", err);
      else $scope.contents = contents;
    });
  }

  $scope.moveBackwardNav = function(index, nav) {
    SortableService.moveBackward(index, $scope.navs, function(err, navs) {
      if(err) $log.error("[GalleryContentController.js] Error: On move content backward!", err);
      else $scope.navs = navs;
    });
  };

  $scope.editImage = GalleryService.edit;

  $scope.editContent = function(index, content) {
    if($rootScope.authenticated) {
      ContentService.edit(content, function(err, newContent) {
        if(err) $log.error("[GalleryContentController.js] Error: On edit content!", err);
        else {
          content = newContent;
          $scope.save();
        }
      });
    }
  };

  $scope.editNavs = function(navs) {
    if($rootScope.authenticated) {
      SubnavigationService.edit(navs, function(err) {
        if(err) $log.error("[GalleryContentController.js] Error: On edit subnavigations!", err);
      });
    }
  }

  $scope.saveImage = function(image) {
    if($rootScope.authenticated) {
      if(angular.isDefined(image)) {  
        GalleryService.saveOne(image, page, image.name, function (err, image) {
          if(err) {
            $log.error (err, image);
            $rootScope.pop('error', err, image);
          } else {
            $rootScope.pop('success', 'Bild wurde aktualisiert', '');
          }
        });
      }
    }
  };


  $scope.save = function() {
    if($rootScope.authenticated) {
      GalleryService.saveAllBlocks($scope.images, page, function (err, images) {
        if(err) {
          $log.error (err, images);
          $rootScope.pop('error', err, images);
        } else {
          $log.debug ("Bilder wurden aktualisiert", images);
          // $rootScope.pop('success', 'Bilder wurden auf dem Server gespeichert', '');
          ContentService.save($scope.contents, page, function(err, contents) {
            if(err) {
              $log.error("Error: On save content!", err);
              if(cb) return cb(err);
              return err;
            } else {
              $log.debug ('Contentblocks wurden aktualisiert', contents);
              // $rootScope.pop('success', 'Contentblocks wurden auf dem Server gespeichert', '');
              SubnavigationService.save($scope.navs, page, function(err, navs) {
                if(err) {
                  $log.error("Error: On save subnavigations!", err);
                  if(cb) return cb(err);
                  return err;
                } else {
                  $log.debug ('Subnavigation wurde aktualisiert', contents);
                  // $rootScope.pop('success', 'Subnavigation wurde auf dem Server gespeichert', '');
                  $rootScope.pop('success', 'Galerie wurde gespeichert', '');
                }
              });
            }
          });
        }
      });
    }
  };

  // http://stackoverflow.com/questions/21702375/angularjs-ng-click-over-ng-click
  $scope.stopPropagation = function (event) {
     event.stopPropagation();
  };

  $scope.goToImage = function (image) {
    $state.go('layout.gallery-fullscreen', {id:image.id});
  }

  /* ==== Drag and Drop Stuff ==== */
  $scope.onDragOnImageComplete = function(index, image, evt, content) {
    if(image == null) {
      $log.debug("*click*", index);
      var image = $scope.images[content.name][index];
      $scope.goToImage(image);
    }
  };

  $scope.onDropOnImageComplete = function(dropimageindex, dragimage, evt, content) {


    SortableService.dropMove($scope.images[content.name], dropimageindex, dragimage, evt, function(err, images) {
      $scope.images[content.name] = images;
      $scope.save();
    }, SortableService.move);
  };

  $scope.onDropOnAreaComplete = function(image, evt, content) {
    $log.debug("onDropOnAreaComplete");
    // $log.debug("images", $scope.images);
    // $log.debug("content", content);

    // var index = $scope.images[content.name].indexOf(image);

    if(image !== null && image.content != content.name) {
      $log.debug("Move image from one content block to another:\n\t"+image.content+" => "+content.name);
      var content_from = image.content;
      var content_to = content.name;
      SortableService.moveObjectToAnotherArray(image, null, $scope.images[content_from], $scope.images[content_to], function (err, result) {
        if(err) $rootScope.pop('error', "Bild konnte nicht verschoben werden", err);
        else {
          result.array_to[result.index_to].content = content_to;
          // $rootScope.pop('success', "Bild erfolgreich verschoben", content_from+" => "+content_to);
        }
        $scope.save();
        $scope.$apply();
      });
    } else {
      $log.debug("Move image within the content block:\n\t"+content.name);
    }

  };

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

  $scope.addDropdownActions = {
    'addImage': addImage,
    'addContent': addContent
  }

  $scope.addDropdown = [
    {
      "text": "<i class=\"fa fa-file-image-o\"></i>&nbsp;Bild",
      "click": "addDropdownActions.addImage()"
    },
    {
      "text": "<i class=\"fa fa-header\"></i>&nbsp;Überschrift",
      "click": "addDropdownActions.addContent()"
    }
  ];

});