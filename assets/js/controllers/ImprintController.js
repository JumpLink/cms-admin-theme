jumplink.cms.controller('ImprintController', function($rootScope, $scope, $sailsSocket, imprint, navs, config, $location, $anchorScroll, $state, $log) {
  var page = $state.current.name;
  // $scope.config = config;
  $scope.imprint = imprint;
  $scope.navs = navs;

  $scope.email = {
    from: null
    , name: null
    , subject: null
    , content: null
  }

  $scope.goTo = function (hash) {
    $location.hash(hash);
    $anchorScroll.yOffset = 60;
    $anchorScroll();
  }

  $scope.toogleHtml = function() {
    $scope.html = !$scope.html;
  }

  $scope.save = function() {
    $scope.imprint.page = page;
    $sailsSocket.put("/content/replace", $scope.imprint, function (response) {
      if(response != null && typeof(response) !== "undefined") {
        $log.debug (response);
      } else {
        $log.debug ("Can't save site");
      }
    });

    $sailsSocket.put('/navigation/replaceall', {navs: $scope.navs, page: page}).success(function(data, status, headers, config) {
      if(data != null && typeof(data) !== "undefined") {
        $log.debug (data);
      } else {
        $log.debug ("Can't save site");
      }
    });
  }

  $scope.sendMail = function() {

    var cc = $scope.email.from;
    var to = config.email;
    var from = $scope.email.from;
    var subject = 'Kontaktanfrage von '+$scope.email.name+': '+$scope.email.subject;

    var html = ''
    +'<dl>'
      +'<dt>Absender</dt>'
      +'<dd><a href="mailto:'+$scope.email.from+'">'+$scope.email.from+'</a></dd>'
      +'<dt>Betreff</dt>'
      +'<dd>'+$scope.email.subject+'</dd>'
    +'</dl>'
    +'<br>'
    +$scope.email.content;

    var text = String(html).replace(/<[^>]+>/gm, '');

    $sailsSocket.post('/email/send', {from: from, to: to+','+cc, subject:subject, text: text, html: html}).success(function(data, status, headers, config){
      if(!$rootScope.authenticated) {
        $rootScope.pop('success', 'E-Mail wurde versendet.');
      }
      $log.debug(data);
    });
  }

  angular.extend($scope, {
    nvc: {
      lat: 53.86411893791266,
      lng: 8.70941162109375,
      zoom: 14
    },
    markers: {
      main_marker: {
        lat: 53.86682040225137,
        lng: 8.706825971603394,
        focus: true,
        //message: "Hey, drag me if you want",
        title: "Nautischer Verein Cuxhaven e.V.",
        draggable: false,
        label: {
          message: "<a target='_blank' title='Anfahrt' href='https://www.google.de/maps/dir//Kapit%C3%A4n-Alexander-Stra%C3%9Fe+40,+27472+Cuxhaven/@53.8668035,8.7066221,17z/data=!4m13!1m4!3m3!1s0x47b4040e075eaf1f:0xfaba82b12994a2e!2sKapit%C3%A4n-Alexander-Stra%C3%9Fe+40,+27472+Cuxhaven!3b1!4m7!1m0!1m5!1m1!1s0x47b4040e075eaf1f:0xfaba82b12994a2e!2m2!1d8.7066221!2d53.8668035?hl=de'>Nautischer Verein Cuxhaven e.V.<br>Kapitän­-Alexander­-Str. 40<br>27472 Cuxhaven</a>",
          options: {
            noHide: true
          }
        }
      }
    }
  });

  // called on content changes
  $sailsSocket.subscribe('content', function(msg){
    $log.debug(msg);
    switch(msg.verb) {
      case 'updated':
        switch(msg.id) {
          case 'imprint':
            $scope.imprint = msg.data;
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Impressums-Text wurde aktualisiert', "");
            }
          break;
        }
      break;
    }
  });

});
