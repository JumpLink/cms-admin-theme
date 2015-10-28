jumplink.cms.controller('LayoutController', function($rootScope, sites, hosts) {

  $rootScope.sites = sites;
  $rootScope.selectedSite = sites[0];

  $rootScope.hosts = hosts;
  $rootScope.selectedHost = hosts[0];
});