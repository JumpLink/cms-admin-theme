jumplink.cms.controller('AppController', function($rootScope, $scope, $state, $window, $timeout, Fullscreen, toaster, $sailsSocket, $location, HistoryService, $log) {

  // fix scroll to top on route change
  $scope.$on("$stateChangeSuccess", function () {
    HistoryService.autoScroll();
  });

  //AngularJS Toaster - AngularJS Toaster is a customized version of "toastr" non-blocking notification javascript library: https://github.com/jirikavi/AngularJS-Toaster
  $rootScope.pop = function(type, title, body, timeout, bodyOutputType, clickHandler) {
    toaster.pop(type, title, body, timeout, bodyOutputType, clickHandler);
  };

  var generalSubscribes = function () {

    $sailsSocket.post('/session/subscribe', {}).success(function(data, status, headers, config){

      // react to subscripe from server: http://sailsjs.org/#/documentation/reference/websockets/sails.io.js/io.socket.on.html
      $sailsSocket.subscribe('connect', function(msg){
        $log.debug('socket.io is connected');
      });

      $sailsSocket.subscribe('disconnect', function(msg){
        $rootScope.pop('error', 'Verbindung zum Server verloren', "");
        $rootScope.authenticated = false;
      });

      $sailsSocket.subscribe('reconnect', function(msg){
        $rootScope.pop('info', 'Sie sind wieder mit dem Server verbunden', "");
      });

    });

  }

  var adminSubscribes = function() {
    // subscripe on server
    $sailsSocket.post('/session/subscribe', {}).success(function(data, status, headers, config){

      // called on any sended email from server
      $sailsSocket.subscribe('email', function(email){

        var body = ''
          +'<dl>'
            +'<dt>Absender</dt>'
            +'<dd><a href="mailto:'+email.from+'">'+email.from+'</a></dd>'
            +'<dt>Betreff</dt>'
            +'<dd>'+email.subject+'</dd>';
            if(email.attachments) {
              body += ''
              +'<dt>Anhänge</dt>'
              +'<dd>'+email.attachments.length+'</dd>';
            }
            body += ''
          +'</dl>';

        $rootScope.pop('info', 'Eine E-Mail wurde versendet.', body, null, 'trustedHtml');
      });

      // admin room
      $sailsSocket.subscribe('admins', function(msg){
        $log.debug(msg);
      });

    });
  }

  // http://stackoverflow.com/questions/18608161/angularjs-variable-set-in-ng-init-undefined-in-scope
  $rootScope.$watch('authenticated', function () {
    // $log.debug("authenticated: "+$rootScope.authenticated);
    if($rootScope.authenticated) {
      $rootScope.mainStyle = {'padding-bottom':'50px'};
      $rootScope.toasterPositionClass = 'toast-bottom-right-with-toolbar';
      adminSubscribes();
    } else {
      $rootScope.mainStyle = {'padding-bottom':'0px'};
      $rootScope.toasterPositionClass = 'toast-bottom-right';
    }
  });
  generalSubscribes();

  $rootScope.fullscreenIsSupported = Fullscreen.isSupported();
  $rootScope.isFullscreen = false;
  Fullscreen.$on('FBFullscreen.change', function(evt, isFullscreenEnabled){
    $rootScope.isFullscreen = isFullscreenEnabled == true;
    $rootScope.$apply();
  });

  $rootScope.toggleFullscreen = function () {
    if (Fullscreen.isEnabled()) {
      Fullscreen.cancel();
    } else {
      Fullscreen.all();
    }
  };

  // TODO loading animation on $stateChangeStart
    $rootScope.$on('$stateChangeStart',
  function(event, toState, toParams, fromState, fromParams){
    // $rootScope.loadclass = 'loading'; // WORKAROUND comment because event is not always fired, see FIXME
  });

  // on new url
  $rootScope.$on('$stateChangeSuccess',
  function(event, toState, toParams, fromState, fromParams){
    $rootScope.loadclass = 'finish'; // FIXME this event is not always fired
    switch(toState.name) {
      case "layout.home":
        $rootScope.bodyclass = 'home';
      break;
      case "layout.gallery":
        $rootScope.bodyclass = 'gallery';
      break;
      case "layout.gallery-slider":
        $rootScope.bodyclass = 'gallery-slider';
      break;
      default:
        $rootScope.bodyclass = toState.name;
      break;
    }
  });

  $rootScope.getWindowDimensions = function () {
    return { 'height': angular.element($window).height(), 'width': angular.element($window).width() };
  };

  angular.element($window).bind('resize', function () {
    // $timeout(function(){
    //   $rootScope.$apply();
    // });
    // $rootScope.$apply();
  });

  // http://stackoverflow.com/questions/641857/javascript-window-resize-event
  if(angular.element($window).onresize) { // if jQuery is used
    angular.element($window).onresize = function(event) {
      $timeout(function(){
        $rootScope.$apply();
      });
    };
  }

  // http://stackoverflow.com/questions/22991481/window-orientationchange-event-in-angular
  angular.element($window).bind('orientationchange', function () {
    $timeout(function(){
      $rootScope.$apply();
    });
  });

  angular.element($window).bind('deviceorientation', function () {
    $timeout(function(){
      $rootScope.$apply();
    });
  });

  $rootScope.$watch($rootScope.getWindowDimensions, function (newValue, oldValue) {
    $rootScope.windowHeight = newValue.height;
    $rootScope.windowWidth = newValue.width;
    $timeout(function(){
      $rootScope.$apply();
    });
  }, true);

  $rootScope.logout = function() {
    $sailsSocket.post("/session/destroy", {}).success(function(data, status, headers, config) {
      $rootScope.authenticated = false;
      $rootScope.pop('success', 'Erfolgreich abgemeldet', "");
    });
  }

  $scope.goToState = $state.go;

});