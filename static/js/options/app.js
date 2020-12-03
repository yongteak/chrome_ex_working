var app = angular.module('app', ["ngRoute",
	'app.controllers', 'app.services'
]);

app.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
	$routeProvider.
		when("/v1/setting", {
			templateUrl: "tmpl/options/main.html"
		}).
		when("/v1/limit", {
			templateUrl: "tmpl/options/limit.html"
		}).
		when("/v1/alarm", {
			templateUrl: "tmpl/options/alarm.html"
		}).
		when("/v1/data", {
			templateUrl: "tmpl/options/data.html"
		}).
		when("/v1/sync", {
			templateUrl: "tmpl/options/sync.html"
		}).
		when("/v1/status", {
			templateUrl: "tmpl/options/status.html"
		}).
		when("/v1/profile", {
			templateUrl: "tmpl/options/profile.html"
		}).
		when("/v1/about", {
			templateUrl: "tmpl/options/about.html"
		}).
		otherwise({
			redirectTo: '/v1/setting'
		});
	$locationProvider.hashPrefix('');
}])

app.filter('isEmpty', function () {
	return function (val) {
		return (val == undefined || val.length === 0 || !val.trim());
	};
});