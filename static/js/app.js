var app = angular.module('app', [
	'angularMoment', 'app.controllers', 'app.services',
	"angular-echarts3", "angularMoment", 'app.filter'
]);

app.constant('CONFIG', {
	'IDENTITY': 'dentity',
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
	'STORAGE_NOTIFICATION_LIST': 'notification_list'
	// 'STORAGE_NOTIFICATION_MESSAGE': 'notification_message',
	// 'STORAGE_TIMEINTERVAL_LIST': 'time_interval'
})