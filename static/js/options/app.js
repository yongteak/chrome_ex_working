var app = angular.module('app', [
	"ngRoute","angular-echarts3","g1b.calendar-heatmap","angularMoment",
	'app.controllers', 'app.services'
]);

app.constant('CONFIG', {
	'STORAGE_TABS' : 'tabs',
	'STORAGE_BLACK_LIST' : 'black_list',
	'STORAGE_RESTRICTION_LIST' : 'restriction_list',
	'STORAGE_NOTIFICATION_LIST' : 'notification_list',
	'STORAGE_NOTIFICATION_MESSAGE' : 'notification_message',
	'STORAGE_TIMEINTERVAL_LIST' : 'time_interval'
})

app.config(["$routeProvider", "$locationProvider", /*"$compileProvider", */
($routeProvider, /*$compileProvider,*/ $locationProvider) => {
	// aHrefSanitizationTrustedUrlList
	// $compileProvider.aHrefSanitizationTrustedUrlList(/^\s*(https?|local|data|chrome-extension):/);
	// $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);

	$routeProvider.
		when("/v1/setting", {
			templateUrl: "tmpl/options/setting.html",
			controller: 'settingController'
		}).
		when("/v1/limit", {
			templateUrl: "tmpl/options/limit.html",
			controller: 'limitController'
		}).
		when("/v1/alarm", {
			templateUrl: "tmpl/options/alarm.html",
			controller: 'alarmController'
		}).
		when("/v1/data", {
			templateUrl: "tmpl/options/data.html",
			controller: 'dataController'
		}).
		when("/v1/sync", {
			templateUrl: "tmpl/options/sync.html",
			controller: 'syncController'
		}).
		when("/v1/status", {
			templateUrl: "tmpl/options/status.html",
			controller: 'statusController'
		}).
		when("/v1/profile", {
			templateUrl: "tmpl/options/profile.html",
			controller: 'profileController'
		}).
		when("/v1/about", {
			templateUrl: "tmpl/options/about.html",
			controller: 'aboutController'
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