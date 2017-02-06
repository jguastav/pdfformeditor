'use strict';
var pdfFormLibModule;
// Declare app level module which depends on views, and components
angular.module('pdfFormFillerApp', [
  'ngRoute',
  'pdfFormLibModule'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/formFillerView'});
}]);
