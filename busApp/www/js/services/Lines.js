(function(){
  'use strict';

  angular.module('busApp')
    .factory('Lines', function($q, $rootScope, SqliteService){
      var _lines = [{ //fake data
        cod: 1,
        nome: 'Ceasa',
        obs: '',
        schedules: [
          {
            exit: 'Ticen - Plataforma E',
            weekdays: [
              {day: 'Semana', schedule: [
                '06:00', '06:25', '17:00'
              ]},
              {day: 'Sabado', schedule: [
                '08:00', '11:40', '17:20'
              ]}
            ]
          },
          {
            exit: 'Bairro',
            weekdays: [
              {day: 'Semana', schedule: [
                '08:00', '11:40', '18:00'
              ]},
              {day: 'Sabado', schedule: [
                '06:00', '07:25', '18:20'
              ]}
            ]
          }
        ]
      }, {
        cod: 2,
        nome: 'Shopping Itaguaçu',
        obs: '',
        schedules: [
          {
            exit: 'Ticen - Plataforma E',
            weekdays: [
              {day: 'Semana', schedule: [
                '06:00', '06:25', '19:00',
              ]},
              {day: 'Sabado', schedule: [
                '08:00', '11:40', '19:20',
              ]},
              {day: 'Domingo', schedule: [
                '08:00', '11:40', '19:40',
              ]}
            ]
          },
          {
            exit: 'Bairro',
            weekdays: [
              {day: 'Semana', schedule: [
                '08:00', '11:40', '13:07', '20:00'
              ]},
              {day: 'Sabado', schedule: [
                '06:00', '06:25', '20:20',
              ]},
              {day: 'Domingo', schedule: [
                '08:00', '11:40', '16:07', '20:40'
              ]}
            ]
          }
        ]
      }];

      var _exits = ['Bairro', 'Ticen - Plataforma E'];//fake data

      return ({
        setData: setData,
        getAll: getAll,
        getByCod: getByCod,
        getExits: getExits
      });

      function setData(data){
        _lines = data;
      }

      function getAll(){
        return $q.resolve(_lines);
      }

      function getByCod(cod){
        if(_lines.length == 0)
          return {};

        var result = {};
        cod = parseInt(cod);
        angular.forEach(_lines, function(val, i){
          if(val.cod == cod)
            result = val;
        });
        return result;
      }

      function getExits(){
        var query = 'SELECT saida FROM horario GROUP BY saida';
        /*return SqliteService.getItems(query).then(function(resp){
            return resp;
          });*/
        return $q.resolve(_exits);
      }
    });
})();
