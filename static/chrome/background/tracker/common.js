var RangeForDays = {
    days2: 'days2',
    days3: 'days3',
    days4: 'days4',
    days5: 'days5',
    days6: 'days6',
    days7: 'days7',
    month1: 'month1',
    month2: 'month2',
    month3: 'month3'
};

var InactivityInterval = {
    second30: 30,
    second45: 45,
    min1: 60,
    min2: 120,
    min5: 300,
    min10: 600,
    min20: 1200,
    min30: 1800
};

var TypeListEnum = {
    ToDay: 1,
    All: 2,
    ByDays: 3,
};

var STORAGE_SETTING = 'setting';
var STORAGE_TABS = 'tabs';
var STORAGE_BLACK_LIST = 'black_list';
// 추적 금지 도메인
var STORAGE_RESTRICTION_LIST = 'restriction_list';
// domain, day, count
var STORAGE_RESTRICTION_ACCESS_LIST = 'restriction_access_list';
var STORAGE_NOTIFICATION_LIST = 'notification_list';
var STORAGE_NOTIFICATION_MESSAGE = 'notification_message';
var STORAGE_TIMEINTERVAL_LIST = 'time_interval';
// 도메인 사용 유지 시간
var STORAGE_TIMERANGE_LIST = 'time_range';
// 시간당 소비 페이지 정보 5초이상 머물렀던 URL 페이지 목록 관리, daily관리
/*
    day: {
        fav:icon,
        title:string,
        url:string,
        second:int,
        count:int
    }
*/
var STORAGE_TIME_TO_URL = 'time_to_url';
var SETTINGS_INTERVAL_INACTIVITY_DEFAULT = InactivityInterval.second30;
var SETTINGS_INTERVAL_CHECK_DEFAULT = 1000;
var SETTINGS_INTERVAL_SAVE_STORAGE_DEFAULT = 2000;
var SETTINGS_INTERVAL_CHECK_STORAGE_DEFAULT = 3000;
var SETTINGS_INTERVAL_RANGE_DEFAULT = RangeForDays.days7;
var SETTINGS_VIEW_TIME_IN_BADGE_DEFAULT = true;
var SETTINGS_SHOW_HINT_DEFAULT = true;
var STORAGE_NOTIFICATION_MESSAGE_DEFAULT = 'You have spent a lot of time on this site';

var SETTINGS_INTERVAL_INACTIVITY = 'inactivity_interval';
var SETTINGS_INTERVAL_SAVE_STORAGE = 'interval_save_in_storage';
var SETTINGS_INTERVAL_RANGE = 'range_days';
var SETTINGS_VIEW_TIME_IN_BADGE = 'view_time_in_badge';
var SETTINGS_SHOW_HINT = 'show_hint';

// 추적 금지 도메인
var IGNORED_DOMAINS_LIST = 'ignored_domains_list';
var EVENT_GENERATE_REPORT = 'performance_report';

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
}

function isEmpty2(val) {
    return (val == undefined || val == null || val.length === 0);// || !val.trim());
}

function convertTimeToSummaryTime(time) {
    var timeValue = time.split(':');
    var hour = timeValue[0];
    var min = timeValue[1];
    var resultTimeValue = 0;
    if (hour > 0)
        resultTimeValue = hour * 3600;
    resultTimeValue += min * 60;

    return resultTimeValue;
}

function convertSummaryTimeToBadgeString(summaryTime) {
    var sec = (summaryTime);
    var min = (summaryTime / 60).toFixed(0);
    var hours = (summaryTime / (60 * 60)).toFixed(0);
    var days = (summaryTime / (60 * 60 * 24)).toFixed(0);

    if (sec < 60) {
        return sec + "s";
    } else if (min < 60) {
        return min + "m";
    } else if (hours < 24) {
        return hours + "h";
    } else {
        return days + "d"
    }
}

function convertShortSummaryTimeToString(summaryTime) {
    var hours = Math.floor(summaryTime / 3600);
    var totalSeconds = summaryTime % 3600;
    var mins = Math.floor(totalSeconds / 60);

    hours = zeroAppend(hours);
    mins = zeroAppend(mins);

    return hours + 'h : ' + mins + 'm';
}

function hhmmStrToNumber(str) {
    return parseInt(str.split(":").join(''));
}

function convertShortSummaryTimeToLongString(summaryTime) {
    var hours = Math.floor(summaryTime / 3600);
    var totalSeconds = summaryTime % 3600;
    var mins = Math.floor(totalSeconds / 60);

    hours = zeroAppend(hours);
    mins = zeroAppend(mins);

    return hours + ' hour ' + mins + ' minutes';
}

function getArrayTime(summaryTime) {
    var days = Math.floor(summaryTime / 3600 / 24);
    var totalHours = summaryTime % (3600 * 24);
    var hours = Math.floor(totalHours / 3600);
    var totalSeconds = summaryTime % 3600;
    var mins = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;

    days = zeroAppend(days);
    hours = zeroAppend(hours);
    mins = zeroAppend(mins);
    seconds = zeroAppend(seconds);

    return {
        'days': days,
        'hours': hours,
        'mins': mins,
        'seconds': seconds
    };
}

function convertSummaryTimeToString(summaryTime) {
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
        return days + 'd ' + hours + 'h ' + mins + 'm ' + seconds + 's';
    else return hours + 'h ' + mins + 'm ' + seconds + 's';
}

function zeroAppend(time) {
    if (time < 10)
        return '0' + time;
    else return time;
}

function isDateInRange(dateStr, range) {
    return new Date(dateStr) >= range.from && new Date(dateStr) <= range.to;
}

function isCorrectDate(range) {
    return range.from.getFullYear() >= 2019 && range.to.getFullYear() >= 2019;
}

function getDateFromRange(range) {
    switch (range) {
        case 'days2':
            return 2;
        case 'days3':
            return 3;
        case 'days4':
            return 4;
        case 'days5':
            return 5;
        case 'days6':
            return 6;
        case 'days7':
            return 7;
        case 'month1':
            return 30;
        case 'month2':
            return 60;
        case 'month3':
            return 90;
    }
}

function isDomainEquals(first, second) {
    if (first === second)
        return true;
    else {
        var resultUrl = function (url) {
            if (url.indexOf('www.') > -1)
                return url.split('www.')[1];
            return url;
        };
        return resultUrl(first) === resultUrl(second);
    }
}

function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return ((treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay) + 1;
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return { size: 0, unit: sizes[0] };
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return { size: Math.round(bytes / Math.pow(1024, i), 2), unit: sizes[i] };
}

// YYYYMMDD
function formatDate() {
    var date = new Date();
    var year = date.getFullYear();
    var month = (1 + date.getMonth());
    month = month >= 10 ? month : '0' + month;
    var day = date.getDate();
    day = day >= 10 ? day : '0' + day;
    return parseInt(year + '' + month + '' + day);
}