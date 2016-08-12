(function(){
  function error(err){
    var msg = 'Ocorreu um erro desconhecido. Por favor, tente denovo...';
    console.error( angular.toJson(err) ); //angular.toJson
    alert(angular.toJson(err));
  }

  angular.module('busApp.controllers', [])

  .controller('TabsCtrl', function($scope, $q, $rootScope, $ionicLoading,
      $cordovaNetwork, Model) {
    $scope.lines = [];
    $scope.exits = [];

    // TODO
      // REVER ATUALIZAÇÃO DO BANCO DE DADOS!! APP N ATUALIZA DADOS ATE SER FECHADO APÓS UM UPDATE DO BANCO DE DADOS
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
          console.log(resp);
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

    ionic.Platform.ready(function(){
      getData();
    });

    $scope.$on('update-lines', function(event, data){
      getData();
    });
  })

  .controller('HomeCtrl', function($scope, $ionicLoading, $interval,
      $timeout, $state, Model) {
    var vm = this;
    vm.nextSchedules = [];
    vm.intervalId = null;
    vm.exitModel = 'TICEN - PLATAFORMA E';

    $scope.$on('$ionicView.enter', function(e) {
      vm.intervalId = $interval(function(){
        vm.updateNextSchedules();
      }, 2000);
    });

    $scope.$on('$ionicView.leave', function(e) {
      $interval.cancel(vm.intervalId);
    });

    vm.onSelect = function(newValue, oldValue){
      vm.updateNextSchedules();
    }

    vm.gotoLine = function(cod){
      $state.go('tab.search');
      // Gambiarra para que seja criado o botão de volta
      // para a aba de Search...
      $timeout(function(){
        $state.go('tab.search.line-detail', {lineCode: cod});
      }, 0);
    }

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
            var count = 0;
            for(var d = 0; d < weekdays.schedule.length; d++){
              var hora = weekdays.schedule[d];
              if(cHour < hora){
                vm.nextSchedules.push({cod: line.cod, nome: nome, obs: line.obs, hora: hora});
                count++;
              }
              if(count >= 3) break;
            }
          }
        }
      }
    };

    Date.prototype.timeNow = function () {
      var d = {h: this.getHours(), m: this.getMinutes()};
      return (d.h<10?'0':'')+d.h +':'+ (d.m<10?'0':'')+d.m;
    };

    vm.isToday = function(cDay, day){
      if(cDay == 0 && day == 'Domingo')
        return true;
      else if(cDay == 6 && (day == 'Sabados' || day == 'Sábados' || day == 'Sabado' || day == 'Sábado'))
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

    vm.arrowClick = function(){
      ++vm.currentExit;
      if(vm.currentExit >= vm.line.schedules.length){
        vm.currentExit = 0;
        vm.arrowRight = true;
      }else if(vm.currentExit+1 >= vm.line.schedules.length){
        vm.arrowRight = false;
      }
      vm.updateData();
    }

    vm.tabClick = function(sch_idx, tab_name){
      vm.currentTab[sch_idx] = tab_name;
    }

    vm.updateData = function(){
      vm.line = filterFilter($scope.lines, {cod: parseInt($stateParams.lineCode)})[0];
      if(vm.line && vm.line.schedules){
        vm.sch = vm.line.schedules[vm.currentExit];
        if(!vm.currentTab[vm.currentExit])
          vm.currentTab[vm.currentExit] = vm.sch.weekdays[0].day;
      }
    }

    $scope.$watch('lines', function(newValue, oldValue){
      vm.updateData();
    });

    vm.updateData();
  })

  .controller('UpdateCtrl', function($scope, $ionicLoading, $ionicActionSheet,
      ConnectivityMonitor, Model, Extractor) {
    var vm = this;

    function _update(){
      $ionicLoading.show({template: '<p>Atualizando...</p><ion-spinner></ion-spinner>'});
      Extractor.getData($scope.lines)
        .then(function(data){
          //console.log('Controller: Extraction completed!');
          //console.log( angular.toJson(data) );
          console.log(data);
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
