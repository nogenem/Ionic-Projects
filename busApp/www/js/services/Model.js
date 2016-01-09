(function(){
  'use strict';

  angular.module('busApp')
    .factory('Model', function(Lines){
      return {
        Lines: Lines
      }
    });
})();
