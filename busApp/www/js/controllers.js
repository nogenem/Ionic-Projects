angular.module('busApp.controllers', [])

.controller('TabsCtrl', function($scope, $rootScope, $ionicLoading, Model) {
  $scope.lines = [];

  $ionicLoading.show({template: '<p>Loading...</p><ion-spinner></ion-spinner>'});

  //deixar os dados soh no $scope?
  //ver a borda superior do android
  //melhorar HOME [ver evento de saida da view/entrada da view pra iniciar/parar o interval]

  function getData(){
    Model.Lines.getAll()
      .then(function(resp){
        $scope.lines = resp;
        $ionicLoading.hide();
      }, function(err){
        console.error(err);
        $scope.lines = [];
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
    Model.Lines.setData(data);
    $scope.lines = data;
  });
})

.controller('HomeCtrl', function($scope, $ionicLoading, $interval, Model) {
  var vm = this;
  vm.exits = [];
  vm.nextSchedules = [];
  vm.intervalId = null;

  $ionicLoading.show({template: '<p>Loading...</p><ion-spinner></ion-spinner>'});
  Model.Lines.getExits().then(function(data){
    vm.exits = data;
    vm.exitModel = data[0];//mudar pra Ticen?
    $ionicLoading.hide();
  }, function(err){
    console.error(err);
    $ionicLoading.hide();
  });

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
              vm.nextSchedules.push({nome: nome, hora: hora});
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

.controller('LineDetailCtrl', function($scope, $stateParams, Model) {
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

  vm.line = Model.Lines.getByCod($stateParams.lineCode);
})

.controller('UpdateCtrl', function($scope, $ionicLoading, DataMining) {
  var vm = this;

  vm.update = function(){
    $ionicLoading.show({template: '<p>Updating...</p><ion-spinner></ion-spinner>'});
    DataMining.getData()
      .then(function(data){
        $ionicLoading.hide();
        $scope.$emit('update-lines', data);
      }, function(err){
        $ionicLoading.hide();
        console.error(err);
      });
  }
});
