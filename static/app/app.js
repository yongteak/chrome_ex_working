var app = angular.module('app', [
	'ui.bootstrap',
	"ngRoute", "angular-echarts3", "angularMoment", "pouchdb",
	'app.controllers', 'app.controller.sync', 'app.controller.setting',
	'app.controller.summary',
	'app.controller.status', 'app.controller.limit', 'app.controller.alarm',
	'app.controller.data', 'app.controller.dashboard', 'app.controller.category',
	'app.services', 'app.pounch', 'app.indexer', 'app.filter'
]);

app.run(function ($rootScope, identity, pounch, storage, CONFIG) {
	// new PouchDB('tabs', { revs_limit: 1, auto_compaction: true }).allDocs({
	// }).then(e => {
	// 	console.log('alldocs > ', e);
	// });

	// fetch(chrome.extension.getURL('static/assets/resource/user.json'))
	// 	.then(resp => resp.json())
	// 	.then(docs => {
	// 		// console.log(docs);
	// 		pounch.setTabs(null, docs, true)
	// 			.then(e => {
	// 				console.log(e)
	// 			})
	// 			.catch(err => { console.log(err) });
	// 	}).catch(e => console.error(e))
	// 혹시 몰라
	// pounch.create_bucket()
	// 	.then(console.log)
	// 	.catch(console.error);
	// pounch.cleanbucket()
	// 	.then(console.log)
	// 	.catch(console.error);

	fetch(chrome.extension.getURL('static/assets/resource/iso-3166-countries-with-regional-codes.json'))
		.then(res => res.json())
		.then(res => $rootScope['countries'] = res);
	fetch(chrome.extension.getURL('static/assets/resource/category.json'))
		.then(res => res.json())
		.then(res => {
			$rootScope['category'] = res.data;
			$rootScope['category_kv'] = res.data.reduce((acc, cur) => {
				acc[cur.code] = { ko: cur.ko, en: cur.en, color: cur.color };
				return acc;
			}, {});
		});
	fetch(chrome.extension.getURL('static/assets/resource/category_preset.json'))
		.then(res => res.json())
		.then(res => $rootScope['category_preset'] = res);

	fetch(chrome.extension.getURL('static/assets/resource/timezone.json'))
		.then(res => res.json())
		.then(res => $rootScope['timezone'] = res);

	$rootScope['local_timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;

	identity.getUserID(userInfo => {
		console.log('user info =>', userInfo);
		if (userInfo == undefined) {
			// 로그인 상태 없음
		} else {
			storage.saveValue(CONFIG.IDENTITY, userInfo);
		}
	});
	// var isOpera = (!!window.opr && !!opr.addons) || !!window.opera
	// 	|| navigator.userAgent.indexOf(' OPR/') >= 0;
	// var isFirefox = typeof InstallTrigger !== 'undefined';
	// var isIE = /*@cc_on!@*/false || !!document.documentMode;
	// var isEdge = !isIE && !!window.StyleMedia;
	// var isChrome = !isOpera && !isFirefox && !isIE && !isEdge;
	// var isBlink = (isChrome || isOpera) && !!window.CSS;
	// var log = console.log;
	// if (isEdge) log = alert; //Edge console.log() does not work, but alert() does.
	// log('isChrome: ' + isChrome);
	// log('isEdge: ' + isEdge);
	// log('isFirefox: ' + isFirefox);
	// log('isIE: ' + isIE);
	// log('isOpera: ' + isOpera);
	// log('isBlink: ' + isBlink);
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
	// 'URI': 'http://34.83.116.28:8080/api/v1',
	'COUCHDB_REMOTE_URI': 'http://34.83.116.28:5984',
	// 'COUCHDB_REMOTE_URI':'http://172.24.69.139:5984',
	// 'COUCHDB_REMOTE_URI': 'http://172.23.156.129:5984/',
	'IDENTITY': 'dentity',
	// 'URI': 'http://172.24.69.139:8080/api/v1',
	'URI':'http://localhost:8080/api/v1',
	'BUCKET': 'bucket_$$$',
	'BUCKET_PREFIX':"bucket_",
	'SECOND_OF_DAY': 60 * 60 * 24,
	'STORAGE_TABS': 'tabs',
	'STORAGE_SETTINGS_VIEW_TIME_IN_BADGE': 'setting_view_time_in_badge',
	// 추적 금지
	'STORAGE_BLACK_LIST': 'black_list',
	// 제한 사이트
	'STORAGE_BLACK_ELEMENT': 'black_element',
	// 추적 금지 항목
	// var STORAGE_RESTRICTION_LIST = 'restriction_list';
	'STORAGE_RESTRICTION_LIST': 'restriction_list',
	// 제한 사이트 접속 기록
	'STORAGE_RESTRICTION_ACCESS_LIST': 'restriction_access_list',
	// 알람 목록
	'STORAGE_ALARM_LIST': 'alarm_list',
	'STORAGE_HISTORY_OF_SYNC': 'sync_history',
	'STORAGE_NOTIFICATION_LIST': 'notification_list',
	'STORAGE_CATEGORY': 'category'
	// 'STORAGE_NOTIFICATION_MESSAGE': 'notification_message',
	// 'STORAGE_TIMEINTERVAL_LIST': 'time_interval'
	// {
	// 		"_id": "bucket_$$$",
	// "setting_view_time_in_badge": {},
	// "black_list": [],
	// "restriction_list": [],
	// "restriction_access_list": [],
	// "alarm_list": [],
	// "sync_history": [],
	// "notification_list": []
	// 	}
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
			when("/v1/summary", {
				templateUrl: "app/partial/summary.html",
				controller: 'summaryController'
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