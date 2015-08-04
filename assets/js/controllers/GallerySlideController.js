jumplink.cms.controller('GallerySlideController', function($scope, $sailsSocket, $stateParams, $timeout, images, $log) {
  $scope.images = images;
  var setSlide = function () {
    if(typeof $stateParams.slideIndex !== 'undefined') {
      if($scope.slideIndex != $stateParams.slideIndex)
        $scope.slideIndex = $stateParams.slideIndex
    } else {
      if($scope.slideIndex != 0)
        $scope.slideIndex = 0;
    }
  }
  // workaround
  $timeout(function() {
    setSlide();
  }, 1000);
});