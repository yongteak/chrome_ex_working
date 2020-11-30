var app = angular.module('app', [
	'angularMoment','ngAnimate','ngSanitize','ui.bootstrap',
	'app.controllers','app.services'
]);

app.filter('isEmpty', function () {
	return function (val) {
	  return (val == undefined || val.length === 0 || !val.trim());
	};
  });