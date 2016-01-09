angular.module('busApp.controllers', [])

.controller('TabsCtrl', function($scope, $rootScope, $ionicLoading, Model) {
  $scope.routes = [];

  $ionicLoading.show({template: '<p>Loading...</p><ion-spinner></ion-spinner>'});

  function getData(){
    Model.Routes.getAll()
      .then(function(resp){
        $scope.routes = resp;
        $ionicLoading.hide();
      }, function(err){
        console.error(err);
        $scope.routes = [];
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

  $scope.$on('update-routes', function(event, data){
    $scope.routes = data;
  });
})

.controller('HomeCtrl', function($scope) {

})

.controller('SearchCtrl', function($scope) {

})

.controller('LineDetailCtrl', function($scope) {

})

.controller('UpdateCtrl', function($scope, $ionicLoading) {
  var vm = this;

  vm.update = function(){
    $ionicLoading.show({template: '<p>Updating...</p><ion-spinner></ion-spinner>'});
    DataMining.getData()
      .then(function(data){
        $ionicLoading.hide();
        $scope.$emit('update-rotues', data);
      }, function(err){
        $ionicLoading.hide();
        console.error(err);
      });
  }
});
