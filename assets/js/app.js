jumplink.cms = angular.module('jumplink.cms', [
  'ui.router'                 // AngularUI Router: https://github.com/angular-ui/ui-router
  , 'ngAnimate'               // ngAnimate: https://docs.angularjs.org/api/ngAnimate
  , 'ngSanitize'              // ngSanitize: https://docs.angularjs.org/api/ngSanitize
  , 'sails.io'                // angularSails: https://github.com/balderdashy/angularSails
  //, 'webodf'                  // custom module
  , 'FBAngular'               // angular-fullscreen: https://github.com/fabiobiondi/angular-fullscreen
  , 'mgcrea.ngStrap'          // AngularJS 1.2+ native directives for Bootstrap 3: http://mgcrea.github.io/angular-strap/
  , 'angularMoment'           // Angular.JS directive and filters for Moment.JS: https://github.com/urish/angular-moment
  // , 'wu.masonry'              // A directive to use masonry with AngularJS: http://passy.github.io/angular-masonry/
  , 'angular-carousel'        // An AngularJS carousel implementation optimised for mobile devices: https://github.com/revolunet/angular-carousel
  // , 'textAngular'             // A radically powerful Text-Editor/Wysiwyg editor for Angular.js: https://github.com/fraywing/textAngular
  , 'angular-medium-editor'   // AngularJS directive for Medium.com editor clone: https://github.com/thijsw/angular-medium-editor
  , 'ui.ace'                  // This directive allows you to add ACE editor elements: https://github.com/angular-ui/ui-ace
 // , 'leaflet-directive'       // AngularJS directive to embed an interact with maps managed by Leaflet library: https://github.com/tombatossals/angular-leaflet-directive
  , 'toaster'                 // AngularJS Toaster is a customized version of "toastr" non-blocking notification javascript library: https://github.com/jirikavi/AngularJS-Toaster
  //, 'angularFileUpload'       // Angular File Upload is a module for the AngularJS framework: https://github.com/nervgh/angular-file-upload
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
  //, 'jumplink.cms.event'
  , 'jumplink.cms.user'
  , 'jumplink.cms.theme'
  //, 'jumplink.cms.gallery'
  , 'jumplink.cms.admin'
  , 'jumplink.cms.session'
  , 'jumplink.cms.multisite'
  , 'jumplink.cms.routes'
  , 'jumplink.cms.sidebar'
  , 'jumplink.cms.toolbar'
]);

jumplink.cms.config( function($stateProvider, $urlRouterProvider, $locationProvider, $provide, $logProvider) {

  // see init.jade environment variable
  $logProvider.debugEnabled(environment === 'development');

  // use the HTML5 History API
  $locationProvider.html5Mode(false);

  $urlRouterProvider.otherwise('/error/Request not found!');

  // LAYOUT
  $stateProvider.state('layout', {
    abstract: true,
    templateUrl: '/views/modern/layout.jade',
    controller: 'LayoutController',
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.authenticated();
      },
      sites: function(MultisiteService) {
        return MultisiteService.resolveNames({});
      },
      hosts: function(MultisiteService) {
        return MultisiteService.resolveHosts({});
      }
    },
  });

  $stateProvider.state('layout.home', {
    url: '/home',
    resolve: {
      
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/home/home.jade',
        controller: 'HomeController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  });

  $stateProvider.state('layout.themes', {
    url: '/themes',
    views: {
      'content' : {
        templateUrl: '/views/modern/themes/themes.jade',
        controller: 'ThemesController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  });

  $stateProvider.state('layout.routes', {
    url: '/routes',
    views: {
      'content' : {
        templateUrl: '/views/modern/routes/routes.jade',
        controller: 'RoutesController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  });

  $stateProvider.state('layout.users', {
    url: '/users'
    , resolve: {
      authenticated: function (SessionService) {
        return SessionService.authenticated();
      },
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
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  });

  $stateProvider.state('layout.user', {
    url: '/user/:index'
    , resolve: {
      authenticated: function (SessionService) {
        return SessionService.authenticated();
      },
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
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  });

  $stateProvider.state('layout.new-user', {
    url: '/new/user'
    , resolve: {
      authenticated: function (SessionService) {
        return SessionService.authenticated();
      },
      user: function() {
        return {

        };
      }
    }
    , views: {
      'content' : {
        templateUrl: '/views/modern/user/user.jade'
        , controller: 'UserController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
    }
  })

  // cms
  $stateProvider.state('layout.cms', {
    url: '/cms'
    , resolve: {
      authenticated: function (SessionService) {
        return SessionService.authenticated();
      },
      info: function(CmsService, $log) {
        $log.debug("start get cms info");
        return CmsService.infoUser();
      },
    }
    , views: {
      'content' : {
        templateUrl: '/views/modern/cms/content.jade'
        , controller: 'CmsController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
      'footer' : {
        templateUrl: '/views/modern/footer.jade',
        controller: 'FooterController'
      }
    }
  });

  // ERROR LAYOUT
  $stateProvider.state('error', {
    abstract: true,
    templateUrl: '/views/modern/layout.jade',
    // controller: 'ErrorController',
  });

  $stateProvider.state('error.signin', {
    url: '/error/:error'
    , views: {
      'content' : {
        templateUrl: '/views/modern/error/error.jade',
        controller: 'ErrorController'
      },
      'toolbar' : {
        resolve: {
          routes: function(RoutesService) {
            return RoutesService.find({});
          },
        },
        template: '<jl-toolbar routes="routes", title="title", shorttitle="shorttitle", position="position", fluid="fluid", name="name"></jl-toolbar>',
        controller: 'ToolbarController'
      },
      'footer' : {
        templateUrl: '/views/modern/footer.jade',
        controller: 'FooterController'
      }
    }
  });

  /**
   * Load optional addional states.
   * WARNING: Very experimental and dangerous.
   */
  for (var i = 0; i < routes.length; i++) {
    
    // console.log("[Routes] route", i, routes[i]);

    if(routes[i].customstate === true) {

      var options = {};
    
      if(typeof(routes[i].state.url) === 'string' && routes[i].state.url.length > 0) options.url = routes[i].state.url;
      // if(angular.isDefined(routes[i].state.resolve)) options.resolve = eval(routes[i].state.resolve);
      
      // TODO Dirty hack!
      if(angular.isDefined(routes[i].state.resolve) && typeof(routes[i].state.resolve) === 'string' && routes[i].state.resolve.length > 0) {
        eval(routes[i].state.resolve);
        options.resolve = resolve;
      }

      // TODO Dirty hack!
      if(angular.isDefined(routes[i].state.views) && typeof(routes[i].state.views) === 'string' && routes[i].state.views.length > 0) {
        eval(routes[i].state.views);
        options.views = view;
      }

      // console.log("[Routes] state options", options);
      if(typeof(routes[i].state.name) === 'string' && routes[i].state.name.length > 0) {
        $stateProvider.state(routes[i].state.name, options);
      }
      
    }
  };
});

jumplink.cms.run(function ($rootScope, $state, $window, $log) {
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    $state.go('error.signin', {error: error});
  });
});
