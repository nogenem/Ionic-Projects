(function(){
  function error(err){
    var msg = 'Ocorreu um erro desconhecido. Por favor, tente denovo...';
    console.error( angular.toJson(err) );
    alert(msg);
  }

  angular.module('busApp.controllers', [])

  .controller('TabsCtrl', function($scope, $q, $rootScope, $ionicLoading,
      $cordovaNetwork, Model) {
    $scope.lines = [];
    $scope.exits = [];

    // TODO
      // ver os dados no ASSERT
  	  // tentar usar 'bind-once' no ng-class dos elementos do route-detail???

    function getData(create){
      var promises = [];

      $ionicLoading.show({template: '<p>Carregando...</p><ion-spinner></ion-spinner>'});

      if(create){
        promises.push(Model.Lines.createTables());
      }

      promises.push(Model.Lines.getAll()
        .then(function(resp){
          $scope.lines = resp;
        }));
      promises.push(Model.Lines.getExits()
        .then(function(resp){
          $scope.exits = resp;
        }));

      $q.all(promises)
        .then(function(resp){
          $ionicLoading.hide();
        }, function(err){
          error(err);
          $ionicLoading.hide();
        });
    }

    $rootScope.$on('device-ready', function(event, data){
      console.log('>> Pegando dados no celular...');
      getData();
    });
    // No browser, o 'device-ready' é emitido antes dos
    //  constrollers serem criados...
    if(!window.cordova){
      console.log('>> Pegando dados no browser...');
      getData();
    }

    $scope.$on('update-lines', function(event, data){
      getData();
    });
  })

  .controller('HomeCtrl', function($scope, $ionicLoading, $interval, Model) {
    var vm = this;
    vm.nextSchedules = [];
    vm.intervalId = null;
    vm.exitModel = 'TICEN - PLATAFORMA E';

    $scope.$on('$ionicView.enter', function(e) {
      vm.intervalId = $interval(function(){
        vm.updateNextSchedules();
      }, 1000);
    });

    $scope.$on('$ionicView.leave', function(e) {
      $interval.cancel(vm.intervalId);
    });

    vm.updateNextSchedules = function(){
      var cDate = new Date();
      var cHour = cDate.timeNow();
      var cDay = cDate.getDay();

      vm.nextSchedules = [];
      for(var a = 0; a < $scope.lines.length; a++){
        var line = $scope.lines[a];
        var nome = line.nome;
        for(var b = 0; b < line.schedules.length; b++){
          var schedules = line.schedules[b];
          var exit = schedules.exit;
          if(exit != vm.exitModel)
            continue;
          for(var c = 0; c < schedules.weekdays.length; c++){
            var weekdays = schedules.weekdays[c];
            var day = weekdays.day;
            if(!vm.isToday(cDay, day))
              continue;
            for(var d = 0; d < weekdays.schedule.length; d++){
              var hora = weekdays.schedule[d];
              if(cHour < hora){
                vm.nextSchedules.push({cod: line.cod, nome: nome, obs: line.obs, hora: hora});
                break;
              }
            }
          }
        }
      }
    };

    Date.prototype.timeNow = function () {
      var d = {h: this.getHours(), m: this.getMinutes()};
      return (d.h<10?'0':'')+d.h +':'+ (d.m<10?'0':'')+d.m;
    };

    $scope.$watch('vm.exitModel', function(newValue, oldValue){
      vm.updateNextSchedules();
    });

    vm.isToday = function(cDay, day){
      if(cDay == 0 && day == 'Domingo')
        return true;
      else if(cDay == 6 && (day == 'Sabado' || day == 'Sábado'))
        return true;
      else
        return (day == 'Semana' && (cDay > 0 && cDay < 6));
    };
  })

  .controller('SearchCtrl', function($scope) {
    var vm = this;
    vm.filter = '';
  })

  .controller('LineDetailCtrl', function($scope, $stateParams, filterFilter, Model) {
    var vm = this;
    vm.line = {};
    vm.currentExit = 0;
    vm.arrowRight = true;
    vm.currentTab = [];

    vm.arrowClick = function(index){
      ++index;
      if(index >= vm.line.schedules.length){
        index = 0;
        vm.arrowRight = true;
      }else if(index+1 >= vm.line.schedules.length){
        vm.arrowRight = false;
      }
      vm.currentExit = index;
    }

    vm.tabClick = function(sch_idx, tab_name){
      vm.currentTab[sch_idx] = tab_name;
    }

    $scope.$watch('lines', function(newValue, oldValue){
      vm.line = filterFilter(newValue, {cod: parseInt($stateParams.lineCode)})[0];
      //console.log(vm.line);
    });

    vm.line = filterFilter($scope.lines, {cod: parseInt($stateParams.lineCode)})[0];
    //console.log(vm.line);
  })

  .controller('UpdateCtrl', function($scope, $ionicLoading, $ionicActionSheet,
      ConnectivityMonitor, Model, DataMining) {
    var vm = this;

    function _update(){
      $ionicLoading.show({template: '<p>Atualizando...</p><ion-spinner></ion-spinner>'});
      DataMining.getData($scope.lines)
        .then(function(data){
          console.log('Controller: DataMining complete!');
          $ionicLoading.hide();
          $scope.$emit('update-lines', 'done!');
        }, function(err){
          error(err);
          $ionicLoading.hide();
        });
    }

    vm.update = function(){
      if(ConnectivityMonitor.isOffline()){
        alert("Você está offline.");
        return;
      }
      var connType = ConnectivityMonitor.getNetwork();
      console.log('Connection: ' +connType);
      if(connType != 'wifi' && connType != 'ethernet'){//3g e afins
        var hideSheet = $ionicActionSheet.show({
          titleText: '<strong>Recomendamos a utilização de wi-fi para esta operação.<br\>Deseja continuar mesmo assim?</strong>',
          cancelText: 'Cancelar',
          destructiveText: '<i class="icon ion-checkmark-round balanced"></i> Continuar',
          cancel: function(){},
          destructiveButtonClicked: function(){
            _update();
            hideSheet();
          }
        });
      }else{
        _update();
      }
    }
  });
})();
