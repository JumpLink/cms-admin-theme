if (typeof jumplink === 'undefined') {
  var jumplink = {};
}

jumplink.cms = angular.module('jumplink.cms', [
  'ui.router'                 // AngularUI Router: https://github.com/angular-ui/ui-router
  , 'ngAnimate'               // ngAnimate: https://docs.angularjs.org/api/ngAnimate
  , 'ngSanitize'              // ngSanitize: https://docs.angularjs.org/api/ngSanitize
  , 'sails.io'                // angularSails: https://github.com/balderdashy/angularSails
  , 'webodf'                  // custom module
  , 'FBAngular'               // angular-fullscreen: https://github.com/fabiobiondi/angular-fullscreen
  , 'mgcrea.ngStrap'          // AngularJS 1.2+ native directives for Bootstrap 3: http://mgcrea.github.io/angular-strap/
  , 'angularMoment'           // Angular.JS directive and filters for Moment.JS: https://github.com/urish/angular-moment
  // , 'wu.masonry'              // A directive to use masonry with AngularJS: http://passy.github.io/angular-masonry/
  , 'angular-carousel'        // An AngularJS carousel implementation optimised for mobile devices: https://github.com/revolunet/angular-carousel
  // , 'textAngular'             // A radically powerful Text-Editor/Wysiwyg editor for Angular.js: https://github.com/fraywing/textAngular
  , 'angular-medium-editor'   // AngularJS directive for Medium.com editor clone: https://github.com/thijsw/angular-medium-editor
  , 'ui.ace'                  // This directive allows you to add ACE editor elements: https://github.com/angular-ui/ui-ace
  , 'leaflet-directive'       // AngularJS directive to embed an interact with maps managed by Leaflet library: https://github.com/tombatossals/angular-leaflet-directive
  , 'toaster'                 // AngularJS Toaster is a customized version of "toastr" non-blocking notification javascript library: https://github.com/jirikavi/AngularJS-Toaster
  , 'angularFileUpload'       // Angular File Upload is a module for the AngularJS framework: https://github.com/nervgh/angular-file-upload
  , 'angular-filters'         // Useful filters for AngularJS: https://github.com/niemyjski/angular-filters
  , 'ngDraggable'             // Drag and drop module for Angular JS: https://github.com/fatlinesofcode/ngDraggable
  , 'toggle-switch'           // AngularJS Toggle Switch: https://github.com/JumpLink/angular-toggle-switch
  , 'ngAsync'
  , 'ngFocus'
  , 'ngHistory'
  , 'jumplink.cms.content'
  , 'jumplink.cms.sortable'
  , 'jumplink.cms.utilities'
  , 'jumplink.cms.subnavigation'
  , 'jumplink.cms.info'
  , 'jumplink.cms.config'
  , 'jumplink.cms.event'
  , 'jumplink.cms.user'
  , 'jumplink.cms.theme'
  , 'jumplink.cms.gallery'
  , 'jumplink.cms.admin'
  , 'jumplink.cms.session'
  , 'jumplink.cms.multisite'
]);

jumplink.cms.config( function($stateProvider, $urlRouterProvider, $locationProvider, $provide, $logProvider) {

  // see init.jade environment variable
  $logProvider.debugEnabled(environment === 'development');

  // Used for routes you can only visit if you are signed in, throws an error message if your are not authenticated
  var authenticated = ['$q', '$sailsSocket', function ($q, $sailsSocket) {
    console.log("authenticated");
    var deferred = $q.defer();
    $sailsSocket.get('/session/authenticated').then (function (data) {
      if (data.data) {
        console.log("is authenticated", data);
        deferred.resolve();
      } else {
        console.log("is not authenticated", data);
        deferred.reject('Not logged in');
      }
    });
    return deferred.promise;
  }];

  // Used if you need authentication conditions
  var isauthenticated = function ($q, $sailsSocket) {
    console.log("authenticated");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/authenticated').then (function (data) {
      return data.data;
    });
    return deferred.promise;
  };

  // use the HTML5 History API
  $locationProvider.html5Mode(false);

  $urlRouterProvider.otherwise('/home');

  $stateProvider
  // LAYOUT
  .state('layout', {
    abstract: true
    , templateUrl: '/views/modern/layout.jade'
    , controller: 'LayoutController'
  })
  .state('layout.home', {
    url: '/home'
    , resolve:{
      authenticated: authenticated
    }
    , views: {
      'content' : {
        templateUrl: '/views/modern/home/home.jade'
        , controller: 'HomeController'
      }
      , 'toolbar' : {
        templateUrl: '/views/modern/toolbar.jade'
        , controller: 'ToolbarController'
      }
    }
  })
  .state('layout.themes', {
    url: '/themes'
    , resolve:{
      authenticated: authenticated,
      sites: function(MultisiteService) {
        return MultisiteService.resolveNames({});
      },
      themes: function(ThemeService) {
        return ThemeService.resolve({});
      }
    }
    , views: {
      'content' : {
        templateUrl: '/views/modern/themes/themes.jade'
        , controller: 'ThemesController'
      }
      , 'toolbar' : {
        templateUrl: '/views/modern/toolbar.jade'
        , controller: 'ToolbarController'
      }
    }
  })
  .state('layout.users', {
    url: '/users'
    , resolve:{
      authenticated: authenticated,
      users: function($sailsSocket, $log) {
        return $sailsSocket.get('/user').then (function (data) {
          return data.data;
        }, function error (resp){
          $log.error(resp);
        });
      }
    }
    , views: {
      'content' : {
        templateUrl: '/views/modern/user/users.jade'
        , controller: 'UsersController'
      }
      , 'toolbar' : {
        templateUrl: '/views/modern/toolbar.jade'
        , controller: 'ToolbarController'
      }
    }
  })
  .state('layout.user', {
    url: '/user/:index'
    , resolve:{
      authenticated: authenticated,
      user: function($sailsSocket, $stateParams, $log) {
        return $sailsSocket.get('/user'+'/'+$stateParams.index).then (function (data) {
          delete data.data.password;
          return data.data;
        }, function error (resp){
          $log.error(resp);
        });
      }
    }
    , views: {
      'content' : {
        templateUrl: '/views/modern/user/user.jade'
        , controller: 'UserController'
      }
      , 'toolbar' : {
        templateUrl: '/views/modern/toolbar.jade'
        , controller: 'ToolbarController'
      }
    }
  })
  .state('layout.new-user', {
    url: '/new/user'
    , resolve:{
      authenticated: authenticated,
      user: function() {
        return {

        };
      }
    }
    , views: {
      'content' : {
        templateUrl: '/views/modern/user/user.jade'
        , controller: 'UserController'
      }
      , 'toolbar' : {
        templateUrl: '/views/modern/toolbar.jade'
        , controller: 'ToolbarController'
      }
    }
  })
  // cms
  .state('layout.cms', {
    url: '/cms'
    , resolve:{
      authenticated: authenticated,
      info: function(CmsService, $log) {
        $log.debug("start get cms info");
        return CmsService.infoUser();
      },
    }
    , views: {
      'content' : {
        templateUrl: '/views/modern/cms/content.jade'
        , controller: 'CmsController'
      }
      , 'toolbar' : {
        templateUrl: '/views/modern/toolbar.jade'
        , controller: 'ToolbarController'
      }
      , 'footer' : {
        templateUrl: '/views/modern/footer.jade'
        , controller: 'FooterController'
      }
    }
  })
  .state('layout.error', {
    url: '/error/:error'
    , views: {
      'content' : {
        templateUrl: '/views/modern/error/error.jade'
        , controller: 'ErrorController'
      }
      , 'toolbar' : {
        templateUrl: '/views/modern/toolbar.jade'
        , controller: 'ToolbarController'
      }
      , 'footer' : {
        templateUrl: '/views/modern/footer.jade'
        , controller: 'FooterController'
      }
    }
  })
})
.run(function ($rootScope, $state, $window, $log) {
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    $state.go('layout.error', {error: error});
  });
})
;
