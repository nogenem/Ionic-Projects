(function(){
  'use strict';

  angular.module('busApp')
    .service('SqliteService', function($q, $cordovaSQLite){
      var self = this;
      var _db;

      self.db = function () {
        if (!_db) {
          if (window.sqlitePlugin !== undefined) {
            _db = window.sqlitePlugin.openDatabase({ name: "database.db", location: 2, createFromLocation: 1 });
          } else {
            // For debugging in the browser
            _db = window.openDatabase("database.db", "1.0", "Database", 200000);
          }
        }
        return _db;
      };

      self.executeSql = function (query, parameters) {
        console.log('Executando sql: '+query);
        parameters = parameters == undefined ? [] : parameters;
        return $cordovaSQLite.execute(self.db(), query, parameters);
      };

      self.getItems = function(query, parameters) {
        return self.executeSql(query, parameters).then(function(resp){
            var _items = [];
            for (var i = 0; i < resp.rows.length; i++) {
              _items.push(resp.rows.item(i));
            }
            return _items;
          });
      }
    });
})();
