jumplink.cms = angular.module('jumplink.cms', [
  'ui.router',                 // AngularUI Router: https://github.com/angular-ui/ui-router
  'ngAnimate',               // ngAnimate: https://docs.angularjs.org/api/ngAnimate
  'ngSanitize',              // ngSanitize: https://docs.angularjs.org/api/ngSanitize
  'sails.io',                // angularSails: https://github.com/balderdashy/angularSails
  //, 'webodf',                  // custom module
  'FBAngular',               // angular-fullscreen: https://github.com/fabiobiondi/angular-fullscreen
  'mgcrea.ngStrap',          // AngularJS 1.2+ native directives for Bootstrap 3: http://mgcrea.github.io/angular-strap/
  'angularMoment',           // Angular.JS directive and filters for Moment.JS: https://github.com/urish/angular-moment
  // , 'wu.masonry',              // A directive to use masonry with AngularJS: http://passy.github.io/angular-masonry/
  'angular-carousel',        // An AngularJS carousel implementation optimised for mobile devices: https://github.com/revolunet/angular-carousel
  // , 'textAngular',             // A radically powerful Text-Editor/Wysiwyg editor for Angular.js: https://github.com/fraywing/textAngular
  'angular-medium-editor',   // AngularJS directive for Medium.com editor clone: https://github.com/thijsw/angular-medium-editor
  'ui.ace',                  // This directive allows you to add ACE editor elements: https://github.com/angular-ui/ui-ace
 // , 'leaflet-directive',       // AngularJS directive to embed an interact with maps managed by Leaflet library: https://github.com/tombatossals/angular-leaflet-directive
  'toaster',                 // AngularJS Toaster is a customized version of "toastr" non-blocking notification javascript library: https://github.com/jirikavi/AngularJS-Toaster
  //, 'angularFileUpload',       // Angular File Upload is a module for the AngularJS framework: https://github.com/nervgh/angular-file-upload
  'angular-filters',         // Useful filters for AngularJS: https://github.com/niemyjski/angular-filters
  'ngDraggable',             // Drag and drop module for Angular JS: https://github.com/fatlinesofcode/ngDraggable
  'toggle-switch',           // AngularJS Toggle Switch: https://github.com/JumpLink/angular-toggle-switch
  'ngAsync',
  'ngFocus',
  'jumplink.cms.history',
  'jumplink.cms.content',
  'jumplink.cms.content.medium',
  'jumplink.cms.bootstrap.content',
  'jumplink.cms.sortable',
  'jumplink.cms.utilities',
  'jumplink.cms.subnavigation',
  'jumplink.cms.info',
  'jumplink.cms.config',
  //, 'jumplink.cms.event',
  'jumplink.cms.user',
  'jumplink.cms.theme',
  //, 'jumplink.cms.gallery',
  'jumplink.cms.admin',
  'jumplink.cms.session',
  'jumplink.cms.multisite',
  'jumplink.cms.routes',
  'jumplink.cms.bootstrap.routes',
  'jumplink.cms.sidebar',
  'jumplink.cms.toolbar',
  'jumplink.cms.signin',
  'ngDownload',
]);