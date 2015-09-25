var fallback = function (req, res, next, forceParam, route) {
  var url = req.path;
  var page = null;
  if(UtilityService.isDefined(route) && UtilityService.isDefined(route.state) && UtilityService.isDefined(route.state.name)) page = route.state.name;
  switch(req.path) {
    case "/signin":
      return signin(req, res, next, forceParam, showLegacyToast = true, page, route);
    default:
      return updateBrowser(req, res, next, forceParam, showLegacyToast = true, page, route);
  }
};

/*
 * fallback html page to allow browser to auto-fill e-mail and password
 */
var signin = function(req, res, next, force, showLegacyToast, page, route) {
  var host = req.session.uri.host;
  var flash = req.session.flash;
  return ThemeService.view(host, 'views/fallback/signin.jade', res,  { showLegacyToast: false, flash: flash });
}

var updateBrowser = function (req, res, next, force, showLegacyToast, page, route) {
  var routes = null;

  var host = req.session.uri.host;
  var site = null;
  var url = req.path;
  var title = "";
  if(UtilityService.isDefined(route) && UtilityService.isDefined(route.sitetitle)) title = route.sitetitle;

  MultisiteService.getCurrentSiteConfig(host, function (err, config) {
    if(err) return res.serverError(err);
    site = config.name;
    async.parallel([
      function(callback) {
        RoutesService.find(host, {}, function(err, routes) {
          callback(err, routes);
        });
      }
    ], function (err, results) {
      if(err) return res.serverError(err);

      routes = results[0];

      return ThemeService.view(req.session.uri.host, 'views/fallback/browser.jade', res, {
        showLegacyToast: showLegacyToast,
        force: force,
        host: host,
        url: url,
        routes: routes,
        useragent: req.useragent,
        title: title,
        config: {paths: sails.config.paths},
        isFallback: true,
        isModern: false,
        authenticated: false
      });
    });
  });
};

module.exports = {
  updateBrowser: updateBrowser
  , fallback: fallback
  , signin: signin
};

