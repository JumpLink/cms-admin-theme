jumplink.cms.controller('TimelineController', function($rootScope, $scope, events, config, EventService, $state, HistoryService, $log) {
  var page = $state.current.name;
  $scope.events = events; // TODO rename to eventBlocks
  $scope.config = config;
  $scope.goTo = HistoryService.goToHashPosition;
  $scope.chooseType = EventService.chooseType;
  var modals = EventService.setModals($scope);
  EventService.subscribe(); // TODO not working anymore

  $scope.save = function(event, eventBlockName) {
    var errors = [
      "TimelineController: Can't save event.",
      "TimelineController: Can't save eventBlocks."
    ];
    var sussces = [
      'Ereignis wurde auf dem Server gespeichert.',
      'Timeline wurde auf dem Server gespeichert.'
    ];
    if($rootScope.authenticated) {
      // save just this event if defined
      if(angular.isDefined(event) && angular.isDefined(eventBlockName)) {
        EventService.saveOne($scope.events, eventBlockName, event, function (err, savedEvent) {
          if(err) $log.error(errors[0], err);
          else {
            event = savedEvent;
            $log.debug(sussces[0], event);
            $rootScope.pop('success', sussces[0], event.title);
          }
        });
      } else { // save all eventBlocks
        EventService.saveBlocks($scope.events, function (err, savedEvents) {
          if(err) $log.error(errors[1], err);
          else {
            $scope.events = savedEvents;
            $log.debug(sussces[1], events);
            $rootScope.pop('success', sussces[1], '');
          }
        });
      }

    }
  };

  $scope.add = function() {
    var errors = [
      "Error: Konnte Ereignis nicht erzeugen",
      "Error: Konnte Ereignis nicht hinzufügen",
    ];

    var successes = [
      "Neues Ereignis erfolgreich hinzugefügt",
    ];

    if($rootScope.authenticated) {
      EventService.createEdit($scope.events, {page:page}, function(err, event) {
        if(err) {
          $log.error(errors[0], err);
          $rootScope.pop('error', errors[0], err);
          $scope.$apply();
        } else {
          $log.debug("start append");
          EventService.append($scope.events, event, function (err, events) {
            if(err) {
              $log.error(errors[1], err);
              $rootScope.pop('error', errors[1], err);
              $scope.$apply();
            } else {
              $scope.events = events;
              $rootScope.pop('success', successes[0], event.title);
              $scope.$apply();
            }
          });  
        }
      });
    }
  }

  // TODO use async "not found"-callback is fired after value was found
  var findEvent = function(id, callback) {
    $log.debug("findEvent", id);
    angular.forEach(['after', 'before', 'unknown'], function(eventPart, index) {
      if(eventPart === 'unknown' && $scope.events[eventPart].length <= 0) {
        return callback("not found");
      }
      angular.forEach($scope.events[eventPart], function(event, index) {
        $log.debug("event.id", event.id);
        if(event.id == id) {
          return callback(null, event, eventPart, index);
        }
        if(eventPart === 'unknown' && index === $scope.events[eventPart].length - 1 &&  event.id != id) {
          return callback("not found");
        }
      });
    });
  };

  $scope.remove = function(event, eventBlockName) {
    if($rootScope.authenticated) {
      EventService.remove($scope.events, event, eventBlockName, function (err, events) {
        if(err) {
          $log.error(err);
          $rootScope.pop('error', "Ereignis konnte nicht entfernt werden.", event.name);
        } else {
          $rootScope.pop('success', 'Ereignis erfolgreich entfernt', '');
        }
      });
    }
  };

  $scope.refresh = function() {
    $scope.events = EventService.refresh($scope.events);
  };

  $scope.edit = function(event, eventBlockName) {
    if($rootScope.authenticated) {
      EventService.edit(event, eventBlockName, function(err, event) {
        if(err) {
          if(err === 'discarded') {
            $log.debug("Edit event ", err);
          } else {
            $log.error("Error: On edit event!", err);
          }
        }
      });
    }
  }

  $scope.openTypeChooserModal = function(event) {
    if($rootScope.authenticated) {
      EventService.openTypeChooserModal(event);
    }
  };

});