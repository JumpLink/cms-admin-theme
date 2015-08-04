var validator = require('validator');
var moment = require('moment');
moment.locale('de');

var updateBrowser = function (req, res, next, force) {
  return ThemeService.view(req.session.uri.host, 'views/fallback/browser.jade', res, {force: force, host: req.host, url: req.path, useragent: req.useragent, title: 'Ihr Browser wird nicht unterstützt' });
}

var fallbackHome = function (req, res, next, force, showLegacyToast) {
  sails.log.debug("fallbackHome");
  var about = null, goals = null, page = 'layout.home', events;
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    Navigation.find({where:{page:page, site:config.name}, sort: 'position'}).exec(function found(err, navs) {
      if(err) { return res.serverError(err); }
      Content.findOne({where:{page:page, name: 'news', site:config.name, type: 'fix'}}).exec(function found(err, news) {
        if(err) { return res.serverError(err); }
        Content.find({where:{page:page, site:config.name, type: 'dynamic'}, sort: 'position'}).exec(function found(err, contents) {
          if(err) { return res.serverError(err); }
          Timeline.find({site:config.name}).exec(function found(err, results) {
            if(err) { return res.serverError(err); }
            // sails.log.debug(results);
            events = EventService.transform(results);
            return ThemeService.view(req.session.uri.host, 'views/fallback/home/content.jade', res, {showLegacyToast: showLegacyToast, force: force, host: req.host, url: req.path, contents: contents, news:news, events:events, useragent: req.useragent, title: 'Nautischer Verein Cuxhaven e.V. - Startseite', config: {paths: sails.config.paths}, navs: navs});
          });
        });
      });
    });
  });
}

var fallbackMembers = function (req, res, next, force, showLegacyToast) {
  var members;
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    Member.find({site:config.name}).exec(function found(err, results) {
      members = MemberService.sort(results);
      return ThemeService.view(req.session.uri.host, 'views/fallback/members/content.jade', res, {showLegacyToast: showLegacyToast, force: force, host: req.host, url: req.path, members: members, useragent: req.useragent, title: 'Nautischer Verein Cuxhaven e.V. - Vorstand / Beirat', config: {paths: sails.config.paths} });
    });
  }); 
}

var fallbackEvents = function (req, res, next, force, showLegacyToast) {
  var events;
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    Timeline.find({site:config.name}).exec(function found(err, results) {
      // sails.log.debug(results);
      events = EventService.transform(results);
      return ThemeService.view(req.session.uri.host, 'views/fallback/events/timeline.jade', res,  {showLegacyToast: showLegacyToast, force: force, host: req.host, url: req.path, events: events, useragent: req.useragent, title: 'Nautischer Verein Cuxhaven e.V. - Veranstaltungen', config: {paths: sails.config.paths} });
    });
  }); 
}

var fallbackGallery = function (req, res, next, force, showLegacyToast) {
  var page = 'layout.gallery';
  var type = 'dynamic';

  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    var site = config.name;
    ContentService.resolveAllWithImage(page, site, type, function (err, contents_images) {
      if(err) { return res.serverError(err); }
      // sails.log.debug(contents_images);
      Navigation.find({where:{page:page, site:config.name}, sort: 'position'}).exec(function found(err, navs) {
        if(err) { return res.serverError(err); }
        return ThemeService.view(req.session.uri.host, 'views/fallback/gallery/content.jade', res, {showLegacyToast: showLegacyToast, force: force, host: req.host, url: req.path, contents: contents_images.contents, images: contents_images.images, useragent: req.useragent, title: 'Nautischer Verein Cuxhaven e.V. - Galerie', config: {paths: sails.config.paths}, navs: navs});
      });
    });

    // var query = {
    //   where: {
    //     site: config.name
    //   },
    //   sort: 'position'
    // };

    // Gallery.find(query).exec(function found(err, images) {
    //   if(err) { return res.serverError(err); }
    //   Navigation.find({where:{page:page, site:config.name}, sort: 'position'}).exec(function found(err, navs) {
    //     if(err) { return res.serverError(err); }
    //     return ThemeService.view(req.session.uri.host, 'views/fallback/gallery/content.jade', res, {showLegacyToast: showLegacyToast, force: force, host: req.host, url: req.path, images: images, useragent: req.useragent, title: 'Nautischer Verein Cuxhaven e.V. - Galerie', config: {paths: sails.config.paths}, navs: navs});
    //   });
    // });
  });
}

var fallbackApplication = function (req, res, next, force, showLegacyToast) {
  var application = null;

  var member = {
    datum: moment().format("dddd Do MMMM YYYY, HH:mm")
    , vorname: null
    , geburtstag: null
    , geburtsort: null
    , email: null
    , telefon: null
    , beruf: null
    , strasse: null
    , plz: null
    , ort: null
    , bank: {
      name: null
      , iban: null
      , bic: null
    }
  }
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    Content.find({name:'application', site:config.name}).exec(function found(err, results) {
      if(UtilityService.isDefined(results) && UtilityService.isDefined(results[0]) && UtilityService.isDefined(results[0].content)) {
        application = results[0].content;
      }
      return ThemeService.view(req.session.uri.host, 'views/fallback/application/content.jade', res, {showLegacyToast: showLegacyToast, force: force, host: req.host, url: req.path, application: application, member: member, useragent: req.useragent, title: 'Nautischer Verein Cuxhaven e.V. - Aufnahmeantrag', config: {paths: sails.config.paths} });
    });
  });
}

var fallbackLinks = function (req, res, next, force, showLegacyToast) {
  var links = null;
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    Content.find({name:'links', site:config.name}).exec(function found(err, results) {
      if(UtilityService.isDefined(results) && UtilityService.isDefined(results[0]) && UtilityService.isDefined(results[0].content)) links = results[0].content;
      return ThemeService.view(req.session.uri.host, 'views/fallback/links/content.jade', res, {showLegacyToast: showLegacyToast, force: force, host: req.host, url: req.path, links: links, useragent: req.useragent, title: 'Nautischer Verein Cuxhaven e.V. - Links', config: {paths: sails.config.paths} });
    });
  });
}

var fallbackCms = function (req, res, next, force, showLegacyToast) {
  var links = null;
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, config) {
    if(err) { return res.serverError(err); }
    CmsService.infoUser(function (error, cmsInfo) {
      return ThemeService.view(req.session.uri.host, 'views/fallback/cms/content.jade', res, {showLegacyToast: showLegacyToast, force: force, host: req.host, url: req.path, links: links, useragent: req.useragent, title: 'Nautischer Verein Cuxhaven e.V. - Links', config: {paths: sails.config.paths}, cmsInfo: cmsInfo});
    });
  });
}

var fallbackImprint = function (req, res, next, force, showLegacyToast) {
  MultisiteService.getCurrentSiteConfig(req.session.uri.host, function (err, siteConf) {
  if(err) { return res.serverError(err); }
    var imprint = null, emailIsSend = null;

    var view = function (req, host, url, form, useragent, emailIsSend) {
      Navigation.find({page:'layout.imprint', site:siteConf.name}).exec(function found(err, navs) {
        Content.find({name:'imprint', site:siteConf.name}).exec(function found(err, results) {
          if(UtilityService.isDefined(results) && UtilityService.isDefined(results[0]) && UtilityService.isDefined(results[0].content))  imprint = results[0].content;
          return ThemeService.view(req.session.uri.host, 'views/fallback/imprint/content.jade', res, {showLegacyToast: showLegacyToast, force: force, emailIsSend: emailIsSend, host: host, url: url, imprint: imprint, form: form, useragent: useragent, title: 'Nautischer Verein Cuxhaven e.V. - Impressum', config: {paths: sails.config.paths}, navs: navs });
        });
      });
    }

    var form = {
      name: {
        value: null,
        $invalid: null,
        $valid: null,
        $error: {
          required: false,
          email: false
        }
      },
      from:  {
        value: null,
        $invalid: null,
        $valid: null,
        $error: {
          required: false,
        }
      },
      subject: {
        value: null,
        $invalid: null,
        $valid: null,
        $error: {
          required: false,
          email: false
        }
      },
      content:  {
        value: null,
        $invalid: null,
        $valid: null,
        $error: {
          required: false,
          email: false
        }
      }
    };

    if(req.method == 'POST') {
      if(req.body) {
        if(req.params.name)
          form.name.value = req.params.name;
        if(req.params.from)
          form.from.value = req.params.from;
        if(req.params.subject)
          form.subject.value = req.params.subject;
        if(req.params.content)
          form.content.value = req.params.content;
      }

      if(req.body) {
        if(req.body.name)
          form.name.value = req.body.name;
        if(req.body.from)
          form.from.value = req.body.from;
        if(req.body.subject)
          form.subject.value = req.body.subject;
        if(req.body.content)
          form.content.value = req.body.content;
      }

      if(!form.name.value) {
        form.name.$error.required = true;
        form.name.$invalid = true;
        form.name.$valid = !form.name.$invalid;
      } else {
        form.name.$error.required = false;
        form.name.$invalid = false;
        form.name.$valid = !form.name.$invalid;
      }

      if(!form.from.value) {
        form.from.$error.required = true;
        form.from.$invalid = true;
        form.from.$valid = !form.from.$invalid;
      } else {
        form.from.$error.required = false;
        form.from.$invalid = false;
        form.from.$valid = !form.from.$invalid;
      }

      if(!validator.isEmail(form.from.value)) {
        form.from.$error.email = true;
        form.from.$invalid = true;
        form.from.$valid = !form.from.$invalid;
      } else {
        form.from.$error.email = false;
        form.from.$invalid = false;
        form.from.$valid = !form.from.$invalid;
      }

      if(!form.subject.value) {
        form.subject.$error.required = true;
        form.subject.$invalid = true;
        form.subject.$valid = !form.subject.$invalid;
      } else {
        form.subject.$error.required = false;
        form.subject.$invalid = false;
        form.subject.$valid = !form.subject.$invalid;
      }

      if(!form.content.value) {
        form.content.$error.required = true;
        form.content.$invalid = true;
        form.content.$valid = !form.content.$invalid;
      } else {
        form.content.$error.required = false;
        form.content.$invalid = false;
        form.content.$valid = !form.content.$invalid;
      }

      if(form.name.$valid && form.from.$valid && form.subject.$valid && form.content.$valid) {

        var from = form.from.value;
        var cc = form.from.value;
        var to = siteConf.email.address+","+cc;
        var subject = 'Kontaktanfrage von '+form.name.value+': '+form.subject.value;
        var attachments = null;
        var html = ''
        +'<dl>'
          +'<dt>Absender</dt>'
          +'<dd><a href="mailto:'+form.from.value+'">'+form.from.value+'</a></dd>'
          +'<dt>Betreff</dt>'
          +'<dd>'+form.subject.value+'</dd>'
        +'</dl>'
        +'<br>'
        +form.content.value;
        var text = String(html).replace(/<[^>]+>/gm, '');

        EmailService.send(req.session.uri.host, from, to, subject, text, html, attachments, function(error, info) {
          var emailResult = {from:from, subject:subject, text:text, html:html, attachments:attachments, error:error, info:info};
          if(emailResult.error) {
            emailIsSend = false;
          } else {
            emailIsSend = true;
          }
          view(req, req.host, req.path, form, req.useragent, emailIsSend);
        });
      } else {
        emailIsSend = false;
        view(req, req.host, req.path, form, req.useragent, emailIsSend);
      }

    } else {
      view(req, req.host, req.path, form, req.useragent, null);
    }
  });

}

var fallback = function (req, res, next, force) {

  var ok = function (req, res, next, force) {
    switch(req.path) {
      case "/fallback/browser":
        return updateBrowser(req, res, next, force, showLegacyToast = false);
      case "/fallback/home":
        return fallbackHome(req, res, next, force, showLegacyToast = true);
      case "/fallback/members":
        return fallbackMembers(req, res, next, force, showLegacyToast = true);
      case "/fallback/events":
        return fallbackEvents(req, res, next, force, showLegacyToast = true);
      case "/fallback/gallery":
        return fallbackGallery(req, res, next, force, showLegacyToast = true);
      case "/fallback/application":
        return fallbackApplication(req, res, next, force, showLegacyToast = true);
      case "/fallback/links":
        return fallbackLinks(req, res, next, force, showLegacyToast = true);
      case "/fallback/imprint":
        return fallbackImprint(req, res, next, force, showLegacyToast = true);
      case "/fallback/cms":
        return fallbackCms(req, res, next, force, showLegacyToast = true);
      default:
        return fallbackHome(req, res, next, force, showLegacyToast = true);
    }
  }

  // var force = null; // modern | fallback
  if(req.param('force'))
    force = req.param('force');
  if(req.query.force)
    force = req.query.force;

  // sails.log.debug('force', force);

  if(UseragentService.isModern(req, force)) {
    if(force != null && typeof force != 'undefined')
      return res.redirect('/?force='+force);
    else
      return res.redirect('/');
  } else {
    return ok(req, res, next, force);
  }
}

  /*
   * fallback html page to allow browser to auto-fill e-mail and password
   */
var signin = function(req, res, next) {

  sails.log('signin(req, res, next)');

  var ok = function () {
    // TODO use toast for flash
    return ThemeService.view(req.session.uri.host, 'views/fallback/signin.jade', res,  { showLegacyToast: false, flash: req.session.flash });
  }

  var force = null; // modern | fallback

  if(req.param('force'))
    force = req.param('force');

  if(req.query.force)
    force = req.query.force;

  // sails.log.debug('force', force);

  if((UseragentService.supported(req) || force == 'modern') && (force != 'fallback' && force != 'noscript')) {
    return ok(req, res, next);
  } else {
    if(force != null)
      return res.redirect('/fallback/home?force='+force);
    else
      return res.redirect('/fallback/home');
  }

}

module.exports = {
  updateBrowser: updateBrowser
  , fallback: fallback
  , signin: signin
};

