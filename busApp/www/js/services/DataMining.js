(function(){
  'use strict';

  function getRoutes($http, SqliteService){
    var url = 'https://cors-anywhere.herokuapp.com/http://www.biguacutransportes.com.br/ajax/lineBus/searchGetLine';
    var data = 'company=1&order=DESC';

    function parseData(resp){
      var _resp = [];

      angular.element(resp).find('tr').each(function(i,val) {
        var tr = $(val);
        var tds = tr.find('td');

        if($(tds[1]).text() != ''){
          var cod = parseInt($(tds[0]).text());
          var nome = $(tds[1]).text().trim();
          var obs = $(tds[3]).text().trim();
          _resp.push({
            cod: cod,
            nome: nome,
            //origem: $(tds[2]).text().split('/')[0],
            //dest: $(tds[2]).text().split('/')[1],
            obs: obs
          });
        }
      });
      return _resp;
    }

    $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
    return $http({
      method: 'POST',
      url: url,
      data: data
    }).then(function(response){
      return parseData(response.data);
    });
  }

  function getRoute($http, SqliteService, cod){
    var url = 'https://cors-anywhere.herokuapp.com/http://www.biguacutransportes.com.br/ajax/lineBus/preview/?line='+
      cod+'&company=0&detail%5B%5D=1&detail%5B%5D=2&detail%5B%5D=3';

    function parseData(resp){
      var _result = [];

      //retirar todas as imgs para não dar erro no console
      resp = resp.replace(/src=.+?>/g, '>');

      _result.lastUpdate = $(resp).find('#contentInfo > div:nth-child(2)').text().slice(19).trim();
      var tmp = _result.lastUpdate.split('/');
      _result.lastUpdate = new Date(parseInt(tmp[2]), parseInt(tmp[1])-1, parseInt(tmp[0]));
      _result.lastUpdate = _result.lastUpdate.toDateString();

      _result.data = [];

      $(resp).find('#tabContent1 > div').each(function(a, val){
        val = $(val);
        var obj = {};

        obj.exit = $(val.children('div:first')).find('> div > strong').text().trim();
        obj.weekdays = [];

        $(val.children('div:last')).find('> ul > li').each(function(b, val2){
          val2 = $(val2);
          var day = val2.find('> div:first > strong').text().trim();

          if(day.indexOf('Segunda') > -1)
            day = 'Semana';
          else if(day.indexOf('feriados') > -1)
            day = 'Domingo';

          obj.weekdays[b] = {'day': day};
          obj.weekdays[b].schedule = [];

          val2.find('> div:eq(1) > ul > li').each(function(c, val3){
            val3 = $(val3);
            var horario = val3.find('> div:first > a').text().trim();

            if(horario != ''){
              obj.weekdays[b].schedule.push(horario);
            }
          });
        });
        _result.data.push(obj);
      });

      return _result;
    }

    //origin,x-requested-with
    return $http.get(url,{headers:{'Access-Control-Allow-Headers': 'origin,x-requested-with'}})
      .then(function(response){
        return parseData(response.data);
      });
  }

  angular.module('busApp')
  .service('DataMining', function($http, $q, SqliteService, filterFilter){
    return({
      getData: getData
    });

    function getData(lastLines){
      var query1 = "DELETE FROM horario WHERE linha_cod = ?";
      var query2 = "DELETE FROM linha WHERE cod = ?";
      var query3 = "INSERT INTO linha (cod, nome, obs, last_update) VALUES (?,?,?,?);";
      var query4 = "INSERT INTO horario (hora,saida,dia,linha_cod) VALUES (?,?,?,?);";

      var r = getRoutes($http, SqliteService)
        .then(function(resp){
          var promises = [];
          resp.map(function(value){
            promises.push(getRoute($http, SqliteService, value.cod)
              .then(function(resp2){
                value.lastUpdate = resp2.lastUpdate;
                value.schedules = resp2.data;
                if(lastLines && lastLines.length > 0){
                  var cValue = filterFilter(lastLines, {cod: parseInt(value.cod)})[0];
                  if(cValue && (value.lastUpdate == cValue.last_update)){
                    return null;
                  }
                }
                SqliteService.addQuery(query1, [value.cod]);
                SqliteService.addQuery(query2, [value.cod]);
                SqliteService.addQuery(query3, [value.cod, value.nome, value.obs, value.lastUpdate]);
                for(var a = 0; a < resp2.data.length; a++){
                  var schedules = resp2.data[a];
                  var exit = schedules.exit;
                  for(var b = 0; b < schedules.weekdays.length; b++){
                    var weekdays = schedules.weekdays[b];
                    var day = weekdays.day;
                    for(var c = 0; c < weekdays.schedule.length; c++){
                      var hora = weekdays.schedule[c];
                      SqliteService.addQuery(query4, [hora,exit,day,value.cod]);
                    }
                  }
                }
                return value;
              }));
          });
          return $q.all(promises)
            .then(function(resp3){
              console.log('DataMining: DataMining complete!');
              return SqliteService.executePendingQueries()
                .then(function(resp){
                  console.log('DataMining: Update BD complete!');
                  return resp3;
                });
            });
        });

      return r;
    }
  });
})();
