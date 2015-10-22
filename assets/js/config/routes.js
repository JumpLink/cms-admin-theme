jumplink.cms.config( function(jlRoutesProvider) {

  var routeOptions = {};

  // use the HTML5 History API
  jlRoutesProvider.html5Mode(true);

  jlRoutesProvider.otherwise('/error/Request not found!');

  // LAYOUT
  jlRoutesProvider.state('layout', {
    abstract: true,
    templateUrl: '/views/modern/layout.jade',
    controller: 'LayoutController',
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
      sites: function(MultisiteService) {
        return MultisiteService.resolveNames({});
      },
      hosts: function(MultisiteService) {
        return MultisiteService.resolveHosts({});
      }
    },
  });

  routeOptions.layoutHome = {
    resolve: {},
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
  };

  routeOptions.layoutThemes = {
    resolve: {},
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
  };

  routeOptions.layoutRoutes = {
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
  };

  routeOptions.layoutUsers = {
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/user/users.jade',
        controller: 'UsersController'
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
  };

  jlRoutesProvider.state('layout.user', {
    url: '/user/:index',
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
      user: function($sailsSocket, $stateParams, $log) {
        return $sailsSocket.get('/user'+'/'+$stateParams.index).then (function (data) {
          delete data.data.password;
          return data.data;
        }, function error (resp){
          $log.error(resp);
        });
      }
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/user/user.jade',
        controller: 'UserController'
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

  jlRoutesProvider.state('layout.new-user', {
    url: '/new/user',
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
      user: function() {
        return {

        };
      }
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/user/user.jade',
        controller: 'UserController'
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

  routeOptions.layoutStatus = {
    resolve: {
      authenticated: function (SessionService) {
        return SessionService.needToBeAuthenticated();
      },
      status: function(CmsService, $log) {
        $log.debug("start get cms info");
        return CmsService.infoAdmin();
      },
    },
    views: {
      'content' : {
        templateUrl: '/views/modern/status/content.jade',
        controller: 'StatusController'
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
    },
  };

  // ERROR LAYOUT
  jlRoutesProvider.state('error', {
    abstract: true,
    templateUrl: '/views/modern/layout.jade',
    // controller: 'ErrorController',
  });

  jlRoutesProvider.state('error.signin', {
    url: '/error/:error',
    views: {
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
      },
    }
  });

  jlRoutesProvider.setRoutes(routes, routeOptions);
});

jumplink.cms.run(function ($rootScope, $state, $window, $log) {
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    $state.go('error.signin', {error: error});
  });
});
