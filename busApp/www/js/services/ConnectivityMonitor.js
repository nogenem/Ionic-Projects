(function(){
  'use strict';

  angular.module('busApp')
  .factory('ConnectivityMonitor', function($rootScope, $cordovaNetwork){
    return {
      isOnline: isOnline,
      isOffline: isOffline,
      getNetwork: getNetwork
    }

    function isOnline(){
      if(ionic.Platform.isWebView()){
        return $cordovaNetwork.isOnline();
      } else {
        return navigator.onLine;
      }
    }

    function isOffline(){
      if(ionic.Platform.isWebView()){
        return !$cordovaNetwork.isOnline();
      } else {
        return !navigator.onLine;
      }
    }

    function getNetwork(){
      if(ionic.Platform.isWebView()){
        return $cordovaNetwork.getNetwork();
      } else {
        return 'unknown';
      }
    }

  });
})();
