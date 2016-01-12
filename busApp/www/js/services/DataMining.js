(function(){
  'use strict';

  function getRoutes($http, SqliteService){
    var url = 'https://cors-anywhere.herokuapp.com/http://www.biguacutransportes.com.br/ajax/lineBus/searchGetLine';
    var data = 'company=1&order=DESC';
    var query = "INSERT INTO linha (cod, nome, obs) VALUES (?,?,?);";

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
          SqliteService.addQuery(query, [cod,nome,obs]);
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
    var query = "INSERT INTO horario (hora,saida,dia,linha_cod) VALUES (?,?,?,?);";

    function parseData(resp){
      var _result = [];

      //retirar todas as imgs para não dar erro no console
      resp = resp.replace(/src=.+?>/g, '>');

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
              SqliteService.addQuery(query, [horario,obj.exit,day,cod]);
            }
          });
        });
        _result.push(obj);
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
  .service('DataMining', function($http, $q, SqliteService){
    return({
      getData: getData
    });

    function getData(){
      var query1 = 'DELETE FROM horario;';
      var query2 = 'DELETE FROM linha';

      SqliteService.addQuery(query1);
      SqliteService.addQuery(query2);
      var r = getRoutes($http, SqliteService).then(function(resp){
        var promises = [];
        resp.map(function(value){
          promises.push(getRoute($http, SqliteService, value.cod).then(function(resp2){
            value.schedules = resp2;
            return value;
          }));
        });
        return $q.all(promises).then(function(resp3){
          console.log('DataMining: DataMining complete!');
          return SqliteService.executePendingQueries().then(function(resp){
            console.log('DataMining: Update BD complete!');
            return resp3;
          });
        });
      });

      return r;
    }
  });
})();
