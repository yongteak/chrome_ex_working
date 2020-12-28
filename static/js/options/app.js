var app = angular.module('app', [
	"ngRoute", "angular-echarts3", "g1b.calendar-heatmap", "angularMoment",
	//// "ui.bootstrap",
	'app.controllers', 'app.services', 'app.controller.setting','app.controller.status','app.filter'
]);

app.directive('elastic', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            link: function($scope, element) { 
				$scope.initialHeight = $scope.initialHeight || element[0].style.height; 
				var resize = function() { 
					element[0].style.height = $scope.initialHeight; 
					element[0].style.height = "" + element[0].scrollHeight + "px"; 
				}; 
				element.on("blur keyup change", resize); $timeout(resize, 0); } 
        };
	}
	
	
]);

app.constant('CONFIG', {
	'URI':'http://34.83.116.28:8080/api/v1',
	'IDENTITY':'dentity',
	'STORAGE_HISTORY_OF_SYNC': 'sync_history',
	'STORAGE_SETTINGS_VIEW_TIME_IN_BADGE': 'setting_view_time_in_badge',
	'STORAGE_TABS': 'tabs',
	// 추적 금지
	'STORAGE_BLACK_LIST': 'black_list',
	// 제한 사이트
	'STORAGE_RESTRICTION_LIST': 'restriction_list',
	// 제한 사이트 접속 기록
	'STORAGE_RESTRICTION_ACCESS_LIST': 'restriction_access_list',
	// 알람 목록
	'STORAGE_ALARM_LIST': 'alarm_list',
	'STORAGE_NOTIFICATION_LIST': 'notification_list',
	// 'STORAGE_NOTIFICATION_MESSAGE': 'notification_message',
	'STORAGE_TIMEINTERVAL_LIST': 'time_interval'
})

app.constant('COLLECTIONS', {
	similarweb: { name: 'similarweb', desc: 'similarweb', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
	sync_history: { name: '동기화 기록', desc: '동기화 기록', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
	setting: { name: '설정', desc: '기본설정', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
	tabs: { name: '도메인별 사용기록', desc: '도메인별 사용기록', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
	black_list: { name: '추적금지 도메인', desc: '추적금지 도메인', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
	restriction_list: { name: '접근제한 도메인', desc: '접근제한 도메인', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
	restriction_access_list: { name: '접근제한 도메인 접속 정보', desc: '접근제한 도메인 접속 정보', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
	alarm_list: { name: '알람목록', desc: '알람목록', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
	time_interval: { name: '시간대별 도메인 접속 정보', desc: '시간대별 도메인 접속 정보', rows: 0, size: 0, updated: null, cloud_synced: null, cloud_synced_count: 0 },
})

// app.run([
//     '$rootScope', '$modalStack',
//     function ($rootScope, $modalStack) {
//         $rootScope.$on('$locationChangeStart', function (event) {
//             var top = $modalStack.getTop();
//             if (top) {
//                 $modalStack.dismiss(top.key);
//                 event.preventDefault();
//             }
//         });
//     }
// ])

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

// https://codepen.io/39ee8d/pen/rjwBez
app.directive('clockPicker', function () {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			element.clockpicker();
		}
	}
})

// https://gist.github.com/dprea/1cd27241db661818e509
app.directive('onErrorSrc', function () {
	return {
		link: function (scope, element, attrs) {
			element.bind('error', function () {
				if (attrs.src != attrs.onErrorSrc) {
					attrs.$set('src', attrs.onErrorSrc);
				}
			});
		}
	}
});

app.directive('customOnChange', function () {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			var onChangeHandler = scope.$eval(attrs.customOnChange);
			element.on('change', onChangeHandler);
			element.on('$destroy', function () {
				element.off();
			});

		}
	};
});


// app.filter('getTotalTime', function () {
// 	return function (tabs, date) {
// 		var summaryTimeList;
// 		if (angular.isDefined(date)) {
// 			summaryTimeList = tabs.map(function (a) { return a.days.find(s => s.date === date).summary; });
// 		} else {
// 			summaryTimeList = tabs.map(function (a) { return a.summaryTime; });
// 		}
// 		return summaryTimeList.reduce(function (a, b) { return a + b; })
// 	}
// });