(function(){
  'use strict';

  angular.module('busApp')
  .factory('Lines', function($q, $rootScope, filterFilter, SqliteService){

    return ({
      getAll: getAll,
      getExits: getExits
    });

    function parseData(resp){
      var _resp = [];
      var lastExit = '', lastDay = '';

      for (var i = 0; i < resp.rows.length; i++) {
        var val = resp.rows.item(i);

        if(lastExit == '' || lastExit != val.saida){
          lastExit = val.saida;
          lastDay = '';
          _resp.push({exit: lastExit, weekdays: []});
        }
        if(lastDay == '' || lastDay != val.dia){
          lastDay = val.dia;
          _resp[_resp.length-1].weekdays.push({day: lastDay, schedule: []});
        }
        var lastSchedule = _resp[_resp.length-1].weekdays[(_resp[_resp.length-1].weekdays.length)-1];
        lastSchedule.schedule.push(val.hora);
      }
      return _resp;
    }

    function getAll(){
      var _routes = [];

      var query1 = 'SELECT * FROM linha ORDER BY nome DESC';
      var query2 = 'SELECT * FROM horario WHERE linha_cod = ? ORDER BY saida,dia DESC';

      var p = SqliteService.executeSql(query1).then(function(resp){
        var promises = [];
        for (var i = 0; i < resp.rows.length; i++) {
          _routes.push(resp.rows.item(i));
          _routes[i].schedules = [];

          promises.push(SqliteService.executeSql(query2, [parseInt(_routes[i].cod)]).then(function(resp2){
            return parseData(resp2);
          }));
        }
        return $q.all(promises).then(function(resp3){
          angular.forEach(_routes, function(val, a){
            _routes[a].schedules = resp3[a];
          });
          return _routes;
        });
      });
      return p;
    }

    function getExits(){
      var query = 'SELECT saida FROM horario GROUP BY saida';
      return SqliteService.getItems(query).then(function(resp){
        var _resp = [];
        for(var i = 0; i < resp.length; i++){
          _resp.push(resp[i].saida);
        }
        return _resp;
      });
    }
  });
})();