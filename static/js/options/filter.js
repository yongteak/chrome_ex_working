angular.module('app.filter', [])

    .filter('isEmpty', function () {
        return function (val) {
            return (val == undefined || val.length === 0 || !val.trim());
        };
    })

    .filter('formatDate', function () {
        return function () {
            var date = new Date();
            var year = date.getFullYear();
            var month = (1 + date.getMonth());
            month = month >= 10 ? month : '0' + month;
            var day = date.getDate();
            day = day >= 10 ? day : '0' + day;
            return parseInt(year + '' + month + '' + day);
        };
    })

    .filter('epochTimeToFormat', function () {
        return function (epochTime) {
            return moment(epochTime).format('YYYY-MM-DD HH:mm:ss');
        }
    })

    .filter('convertSummaryTimeToString', function () {
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

    .filter('dataSizeToUnit', function () {
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
    })

    // anguarjs hashkey 데이터 제거
    .filter('clean', function () {
        return function (item) {
            return JSON.parse(angular.toJson(item));
        }
    })

    .filter('hhmmStrToNumber', function () {
        return function (str) {
            return parseInt(str.split(":").join(''));
        }
    })



    // https://stackoverflow.com/questions/26580509/calculate-time-difference-between-two-date-in-hhmmss-javascript
    // "13:47:46-13:48:45"
    // "13:56:37-20:57:2"
    // 13:56:37-14:57:2"
    .filter('hmsToSeconds', function () {
        return function (s) {
            // console.log(s);
            var format = "HH:mm:ss";
            var str = s.split("-");
            var ah = parseInt(str[0].split(':')[0]);
            var bh = parseInt(str[1].split(':')[0]);
            var diff = bh - ah;
            var acc = [];
            if (diff == 0) {
                acc.push({
                    'hour': ah, 'value':
                        moment.duration(moment(str[1], format).diff(moment(str[0], format))).asSeconds()
                });
            } else if (diff == 1) {
                acc.push({
                    'hour': ah, 'value':
                        moment.duration(moment(ah + ":59:59", format).diff(moment(str[0], format))).asSeconds()
                });
                acc.push({
                    'hour': bh, 'value':
                        moment.duration(moment(str[1], format).diff(moment(bh + "00:00", format))).asSeconds()
                });
            } else if (diff >= 2) {
                var range = Array(diff - 1).fill(0).map((e, i) => i + (ah + 1));
                acc.push({
                    'hour': ah, 'value':
                        moment.duration(moment(ah + ":59:59", format).diff(moment(str[0], format))).asSeconds()
                });
                range.forEach(h => {
                    acc.push({ 'hour': h, 'value': 3600 });
                });
                acc.push({
                    'hour': bh, 'value':
                        moment.duration(moment(str[1], format).diff(moment(bh + "00:00", format))).asSeconds()
                });
            }
            return acc;
        }
    })


    .filter('num_comma', function () {
        return function (num) {
            if (num) {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            } else {
                return num;
            }
        };
    })

    .filter('percentage', function () {
        return function (val, total) {
            return ((val / total) * 100).toFixed(1);// + ' %';
        }
    })


    .filter('yyyymmdd_to_format_kr', function () {
        return function (yyyymmdd) {
            if (!yyyymmdd) return '';
            var match;
            if (yyyymmdd.toString().length == 12) {
                match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
                return match[1] + '년 ' + match[2] + '월 ' + match[3] + '일 ' + match[4] + '시' + match[5] + '분'
            } else if (yyyymmdd.toString().length == 10) {
                match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})(\d{2})/);
                return match[1] + '년 ' + match[2] + '월 ' + match[3] + '일 ' + match[4] + '시'
            } else if (yyyymmdd.toString().length == 8) {
                match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})/);
                return match[1] + '년 ' + match[2] + '월 ' + match[3] + '일'
            } else if (yyyymmdd.toString().length == 6) {
                match = yyyymmdd.toString().match(/(\d{4})(\d{2})/);
                return match[1] + '년 ' + match[2] + '월'
            } else if (yyyymmdd.toString().length == 4) {
                match = yyyymmdd.toString().match(/(\d{4})/);
                return match[1] + '년';
            }
        };
    });

function zeroAppend(time) {
    if (time < 10)
        return '0' + time;
    else return time;
}