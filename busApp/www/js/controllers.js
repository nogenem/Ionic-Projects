angular.module('busApp.controllers', [])

.controller('TabsCtrl', function($scope, $rootScope, $ionicLoading, Model) {
  $scope.lines = [];

  $ionicLoading.show({template: '<p>Loading...</p><ion-spinner></ion-spinner>'});

  //deixar os dados soh no $scope?
  //ver a borda superior do android

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

.controller('HomeCtrl', function($scope, $ionicLoading, Model) {
  var vm = this;
  vm.exits = [];

  $ionicLoading.show({template: '<p>Loading...</p><ion-spinner></ion-spinner>'});
  Model.Lines.getExits().then(function(data){
    vm.exits = data;
    $scope.exitModel = data[0];//mudar pra Ticen?
    $ionicLoading.hide();
  }, function(err){
    console.error(err);
    $ionicLoading.hide();
  })
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
  console.log(vm.line);
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
