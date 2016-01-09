(function(){
  'use strict';

  angular.module('busApp')
    .factory('Routes', function($q, $rootScope, SqliteService){
      var _routes = [];

      return ({
        getAll: getAll,
        getByCod: getByCod
      });

      function getAll(){
        return $q.resolve([]);
      }

      function getByCod(cod){
        if(_routes.length == 0)
          return {};

        var result = {};
        cod = parseInt(cod);
        angular.forEach(_routes, function(val, i){
          if(val.cod == cod)
            result = val;
        });
        return result;
      }
    });
})();
