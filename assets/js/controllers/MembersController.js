jumplink.cms.controller('MembersController', function($rootScope, $scope, members, $sailsSocket, $filter, $modal, FileUploader, $log) {
  $scope.uploader = new FileUploader({url: 'member/upload', removeAfterUpload: true});
  $scope.uploader.filters.push({
    name: 'imageFilter',
    fn: function(item /*{File|FileLikeObject}*/, options) {
      var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
      return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
    }
  });
  var editMemberModal = $modal({scope: $scope, title: 'Person bearbeiten', uploader: $scope.uploader, templateUrl: '/views/modern/members/editmodal.jade', show: false});

  $scope.upload = function(fileItem, member) {
    fileItem.member = member;
    fileItem.upload();
  }

  $scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
    fileItem.member.image = response.files[0].thumb;
  };


  var removeFromClient = function (member) {
    var index = $scope.members.indexOf(member);
    if (index > -1) {
      $scope.members.splice(index, 1);
    }
  }

  $scope.abort = function(hide) {
    hide();
  }

  $scope.members = members;
  $scope.remove = function(member, hide) {
    if($rootScope.authenticated) {
      if($scope.members.length > 2) {
        if(member.id) {
          $log.debug(member);
          $sailsSocket.delete('/member/'+member.id).success(function(users, status, headers, config) {
            removeFromClient(member);
          });
        } else {
          removeFromClient(member);
        }
      }
    }
    hide();
  }

  $scope.add = function() {
    if($rootScope.authenticated) {
      if(!angular.isArray($scope.members)) $scope.members = [];
      // var newMember = angular.copy($scope.members[$scope.members.length - 1]);
      var newMember = {
        position: $scope.members.length || 0,
        name: "",
        job: "",
        image: "photo.png",
        site: $scope.members[$scope.members.length - 1].site
      }
      // delete newMember.id;
      // delete newMember.position++;
      $scope.members.push(newMember);
      $scope.edit(newMember);
    }
  }

  var saveMember = function (member, cb) {
    if(angular.isUndefined(member.id)) {
      // create member
      $sailsSocket.post('/member', member).success(function(data, status, headers, config) {
        if(angular.isArray(data)) data = data[0];
        $log.debug(data);
        if(cb) cb(null, data);
      });
    } else {
      // update member
      $sailsSocket.put('/member/'+member.id, member).success(function(data, status, headers, config) {
        if(angular.isArray(data)) data = data[0];
        $log.debug(data);
        if(cb) cb(null, data);
      });
    }
  }

  $scope.save = function(member, hide) {
    if($rootScope.authenticated) {
      if(angular.isUndefined(member)) {  // save all members
        angular.forEach($scope.members, function(member, index) {
          saveMember(member, function (err, result) {
            if(err) {
              $rootScope.pop('error', member.name, "Konnte Mitglied nicht speichern.", member.name);
            } else {
              $rootScope.pop('success', "Mitglied erfolgreich auf dem Server gespeichert.", member.name);
            }
          });
        });
      } else { // save just this member
        saveMember(member, function (err, result) {
          if(err) {
            $rootScope.pop('error', member.name, "Konnte Mitglied nicht speichern.", member.name);
          } else {
            $rootScope.pop('success', "Mitglied erfolgreich auf dem Server gespeichert.", member.name);
          }
        });
      }
    }
    hide();
  }

  $scope.edit = function(member) {
    if($rootScope.authenticated) {
      editMemberModal.$scope.member = member;
      //- Show when some event occurs (use $promise property to ensure the template has been loaded)
      editMemberModal.$promise.then(editMemberModal.show);
    }
  }

  $scope.moveForward = function(member) {
    if($rootScope.authenticated) {
      var index = $scope.members.indexOf(member);
      if(index < $scope.members.length && angular.isDefined($scope.members[index+1])) {
        var newPosition = $scope.members[index+1].position;
        var oldPosition = $scope.members[index].position;
        $log.debug(newPosition+" <-> "+oldPosition);
        $scope.members[index].position = newPosition;
        $scope.members[index+1].position = oldPosition;
        $scope.members = $filter('orderBy')($scope.members, 'position');
      } else {
        $rootScope.pop('error', member.name, "Kann nicht verschoben werden.");
      }
    }
  }
  $scope.moveBackward = function(member) {
    if($rootScope.authenticated) {
      var index = $scope.members.indexOf(member);
      if(index > 0 && angular.isDefined($scope.members[index-1])) {
        var newPosition = $scope.members[index-1].position;
        var oldPosition = $scope.members[index].position;
        $log.debug(newPosition+" <-> "+oldPosition);
        $scope.members[index].position = newPosition;
        $scope.members[index-1].position = oldPosition;
        $scope.members = $filter('orderBy')($scope.members, 'position');
      } else {
        $rootScope.pop('error', member.name, "Kann nicht verschoben werden.");
      }
    }
  }

  $sailsSocket.subscribe('member', function(msg){
    $log.debug(msg);

    switch(msg.verb) {
      case 'updated':
        if($rootScope.authenticated)
          $rootScope.pop('success', 'Eine Person wurde aktualisiert', msg.data.name);
      break;
      case 'created':
        if($rootScope.authenticated)
          $rootScope.pop('success', 'Eine Person wurde erstellt', msg.data.name);
      break;
      case 'removedFrom':
        if($rootScope.authenticated)
          $rootScope.pop('success', 'Eine Person wurde entfernt', msg.id);
      break;
      case 'destroyed':
        if($rootScope.authenticated)
          $rootScope.pop('success', 'Eine Person wurde gelöscht', msg.id);
      break;
      case 'addedTo':
        if($rootScope.authenticated)
          $rootScope.pop('success', 'Eine Person wurde hinzugefügt', msg.data.name);
      break;
    }
  });

});