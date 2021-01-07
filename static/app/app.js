var app = angular.module('app', [
	"ngRoute", "angular-echarts3", "angularMoment", "pouchdb",
	'app.controllers', 'app.controller.sync', 'app.controller.setting',
	'app.controller.status', 'app.controller.limit', 'app.controller.alarm',
	'app.controller.data', 'app.controller.dashboard','app.controller.category',
	'app.services', 'app.pounch', 'app.filter'
]);

app.run(function ($rootScope, identity, storage, CONFIG) {

	// $rootScope['countries'] = {};

	fetch(chrome.extension.getURL('static/assets/resource/iso-3166-countries-with-regional-codes.json'))
		.then(resp => resp.json())
		.then(jsonData => $rootScope['countries'] = jsonData);
	fetch(chrome.extension.getURL('static/assets/resource/category.json'))
		.then(resp => resp.json())
		.then(jsonData => {
			console.log(jsonData)
			$rootScope['category'] = jsonData
		});
	fetch(chrome.extension.getURL('static/assets/resource/timezone.json'))
		.then(resp => resp.json())
		.then(jsonData => $rootScope['timezone'] = jsonData);
	$rootScope['local_timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;

	identity.getUserID(userInfo => {
		console.log('user info =>', userInfo);
		if (userInfo == undefined) {
			// 로그인 상태 없음
		} else {
			storage.saveValue(CONFIG.IDENTITY, userInfo);
		}
	});
	// Opera 8.0+ (tested on Opera 42.0)
	var isOpera = (!!window.opr && !!opr.addons) || !!window.opera
		|| navigator.userAgent.indexOf(' OPR/') >= 0;

	// Firefox 1.0+ (tested on Firefox 45 - 53)
	var isFirefox = typeof InstallTrigger !== 'undefined';

	// Internet Explorer 6-11
	//   Untested on IE (of course). Here because it shows some logic for isEdge.
	var isIE = /*@cc_on!@*/false || !!document.documentMode;

	// Edge 20+ (tested on Edge 38.14393.0.0)
	var isEdge = !isIE && !!window.StyleMedia;

	// Chrome 1+ (tested on Chrome 55.0.2883.87)
	// This does not work in an extension:
	//var isChrome = !!window.chrome && !!window.chrome.webstore;
	// The other browsers are trying to be more like Chrome, so picking
	// capabilities which are in Chrome, but not in others is a moving
	// target.  Just default to Chrome if none of the others is detected.
	var isChrome = !isOpera && !isFirefox && !isIE && !isEdge;

	// Blink engine detection (tested on Chrome 55.0.2883.87 and Opera 42.0)
	var isBlink = (isChrome || isOpera) && !!window.CSS;

	/* The above code is based on code from: https://stackoverflow.com/a/9851769/3773011 */
	//Verification:
	var log = console.log;
	if (isEdge) log = alert; //Edge console.log() does not work, but alert() does.
	log('isChrome: ' + isChrome);
	log('isEdge: ' + isEdge);
	log('isFirefox: ' + isFirefox);
	log('isIE: ' + isIE);
	log('isOpera: ' + isOpera);
	log('isBlink: ' + isBlink);
});

app.directive('elastic', [
	'$timeout',
	function ($timeout) {
		return {
			restrict: 'A',
			link: function ($scope, element) {
				$scope.initialHeight = $scope.initialHeight || element[0].style.height;
				var resize = function () {
					element[0].style.height = $scope.initialHeight;
					element[0].style.height = "" + element[0].scrollHeight + "px";
				};
				element.on("blur keyup change", resize); $timeout(resize, 0);
			}
		};
	}
]);

app.constant('CONFIG', {
	'URI': 'http://34.83.116.28:8080/api/v1',
	'IDENTITY': 'dentity',
	// 'URI':'http://127.0.0.1:8080/api/v1',
	'BUCKET': 'bucket',
	'STORAGE_TABS': 'tabs',
	'STORAGE_SETTINGS_VIEW_TIME_IN_BADGE': 'setting_view_time_in_badge',
	// 추적 금지
	'STORAGE_BLACK_LIST': 'black_list',
	// 제한 사이트
	'STORAGE_RESTRICTION_LIST': 'restriction_list',
	// 제한 사이트 접속 기록
	'STORAGE_RESTRICTION_ACCESS_LIST': 'restriction_access_list',
	// 알람 목록
	'STORAGE_ALARM_LIST': 'alarm_list',
	'STORAGE_HISTORY_OF_SYNC': 'sync_history',
	'STORAGE_NOTIFICATION_LIST': 'notification_list',
	'STORAGE_CATEGORY':'category'
	// 'STORAGE_NOTIFICATION_MESSAGE': 'notification_message',
	// 'STORAGE_TIMEINTERVAL_LIST': 'time_interval'
})

// [{
// 	'bucket': ['setting_view_time_in_badge', 'black_list', 'restriction_list',
// 		'restriction_access_list', 'alarm_list', 'sync_history','last'];
// }, 'tabs',

app.constant('COLLECTIONS', {
	last: { name: 'last', desc: 'last', hidden: true },
	similarweb: { name: 'similarweb', desc: 'similarweb', hidden: true },
	setting_view_time_in_badge: { name: '설정', desc: '설정' },
	sync_history: { name: '동기화 기록', desc: '동기화 기록' },
	tabs: { name: '도메인별 사용기록', desc: '도메인별 사용기록', top: true },
	black_list: { name: '추적금지 도메인', desc: '추적금지 도메인' },
	restriction_list: { name: '접근제한 도메인', desc: '접근제한 도메인' },
	restriction_access_list: { name: '접근제한 도메인 접속 정보', desc: '접근제한 도메인 접속 정보' },
	alarm_list: { name: '알람목록', desc: '알람목록' }
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
			when("/v1/category", {
				templateUrl: "app/partial/category.html",
				controller: 'categoryController'
			}).
			when("/v1/dashboard", {
				templateUrl: "app/partial/dashboard.html",
				controller: 'dashboardController'
			}).
			when("/v1/setting", {
				templateUrl: "app/partial/setting.html",
				controller: 'settingController'
			}).
			when("/v1/limit", {
				templateUrl: "app/partial/limit.html",
				controller: 'limitController'
			}).
			when("/v1/alarm", {
				templateUrl: "app/partial/alarm.html",
				controller: 'alarmController'
			}).
			when("/v1/data", {
				templateUrl: "app/partial/data.html",
				controller: 'dataController'
			}).
			when("/v1/sync", {
				templateUrl: "app/partial/sync.html",
				controller: 'syncController'
			}).
			when("/v1/status", {
				templateUrl: "app/partial/status.html",
				controller: 'statusController'
			}).
			when("/v1/profile", {
				templateUrl: "app/partial/profile.html",
				controller: 'profileController'
			}).
			when("/v1/about", {
				templateUrl: "app/partial/about.html",
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