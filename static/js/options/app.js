var app = angular.module('app', [
	"ngRoute", "angular-echarts3", "g1b.calendar-heatmap", "angularMoment",
	//// "ui.bootstrap",
	'app.controllers', 'app.services'
]);

app.constant('CONFIG', {
	'STORAGE_SETTING': 'setting',
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

app.filter('isEmpty', function () {
	return function (val) {
		return (val == undefined || val.length === 0 || !val.trim());
	};
});

app.filter('formatDate', function () {
	return function () {
		var date = new Date();
		var year = date.getFullYear();
		var month = (1 + date.getMonth());
		month = month >= 10 ? month : '0' + month;
		var day = date.getDate();
		day = day >= 10 ? day : '0' + day;
		return parseInt(year + '' + month + '' + day);
	};
});
app.filter('convertSummaryTimeToString', function () {
	return function (summaryTime) {
		var days = Math.floor(summaryTime / 3600 / 24);
		var totalHours = summaryTime % (3600 * 24);
		var hours = Math.floor(totalHours / 3600);
		var totalSeconds = summaryTime % 3600;
		var mins = Math.floor(totalSeconds / 60);
		var seconds = totalSeconds % 60;

		hours = zeroAppend(hours);
		mins = zeroAppend(mins);
		seconds = zeroAppend(seconds);

		if (days > 0)
			return days + '일 ' + hours + '시간 ' + mins + '분' + seconds + '초';
		else return hours + '시간 ' + mins + '분 ' + seconds + '초';
	}
})

app.filter('dataSizeToUnit', function () {
	return function (num) {
		if (num >= 1000000000) {
			return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
		}
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
		}
		return num + 'Byte';
	};
});

// anguarjs hashkey 데이터 제거
app.filter('clean', function () {
	return function (item) {
		return JSON.parse(angular.toJson(item));
	}
});

app.filter('hhmmStrToNumber', function () {
	return function (str) {
		return parseInt(str.split(":").join(''));
	}
});

function zeroAppend(time) {
	if (time < 10)
		return '0' + time;
	else return time;
}

app.filter('num_comma', function () {
	return function (num) {
		if (num) {
			return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		} else {
			return num;
		}
	};
});

app.filter('percentage', function () {
	return function (val, total) {
		return ((val / total) * 100).toFixed(1);// + ' %';
	}
});

// https://codepen.io/39ee8d/pen/rjwBez
app.directive('clockPicker', function() {
	return {
	  restrict: 'A',
	  link: function(scope, element, attrs) {
		element.clockpicker();
	  }
	}
  })

// https://gist.github.com/dprea/1cd27241db661818e509
app.directive('onErrorSrc', function() {
    return {
        link: function(scope, element, attrs) {
          element.bind('error', function() {
            if (attrs.src != attrs.onErrorSrc) {
              attrs.$set('src', attrs.onErrorSrc);
            }
          });
        }
    }
});

app.directive('customOnChange', function() {
	return {
	  restrict: 'A',
	  link: function (scope, element, attrs) {
		var onChangeHandler = scope.$eval(attrs.customOnChange);
		element.on('change', onChangeHandler);
		element.on('$destroy', function() {
		  element.off();
		});
  
	  }
	};
  });

app.filter('yyyymmdd_to_format_kr', function () {
    return function (yyyymmdd) {
      if (!yyyymmdd) return '';
      var match;
      if (yyyymmdd.toString().length == 12) {
        match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
        return match[1] + '년 ' + match[2] + '월 ' + match[3] +'일 ' + match[4] +'시' + match[5] +'분'
      } else if (yyyymmdd.toString().length == 10) {
        match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})(\d{2})/);
        return match[1] + '년 ' + match[2] + '월 ' + match[3] +'일 ' + match[4] +'시'
      } else if (yyyymmdd.toString().length == 8) {
        match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})/);
        return match[1] + '년 ' + match[2] + '월 ' + match[3] +'일'
      } else if (yyyymmdd.toString().length == 6) {
        match = yyyymmdd.toString().match(/(\d{4})(\d{2})/);
        return match[1] + '년 ' + match[2] + '월'
      } else if (yyyymmdd.toString().length == 4) {
        match = yyyymmdd.toString().match(/(\d{4})/);
        return match[1] + '년';
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