(function(){
  'use strict';

  function getRoutes($http){

  }

  function getRoute($http, cod){

  }

  angular.module('busApp')
    .service('DataMining', function($http, $q){
      return({
        getData: getData
      });

      function getData(){
        var _data = [];
      }
    });
})();
