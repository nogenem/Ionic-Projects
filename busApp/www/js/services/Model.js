(function(){
  'use strict';

  angular.module('busApp')
    .factory('Model', function(Routes){
      return {
        Routes: Routes
      }
    });
})();
