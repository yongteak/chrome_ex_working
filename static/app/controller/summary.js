angular.module('app.controller.summary', [])
    .controller('summaryController', function ($scope, $filter, pounch, indexer, CONFIG) {
        /*
        //
        var sday = 20201101;
        var eday = 20210118;
        // 주차
        var weeks = Math.round(moment(''+eday).diff(moment(''+sday),'days')/7);

        var weekOfMonthfun = (day) => {
            var m = moment(''+day).utc(true);
            return m.week() - moment(m).startOf('month').week() + 1;
        }
        // 마지막주의 마지막 날짜가 다음달의 첫번째 주와 겹치는경우 다음달의 첫번째 주에 포함시켜야함
        // "202011w_5_1129_1205" => 12월 1주
        var res = [];
        var next = false;
        for (var i = 0; i < weeks; i++) {
            var start_day_of_week = next ? next : moment(''+sday).startOf('week').format("YYYYMMDD");
            var end_day_of_week = moment(start_day_of_week).endOf('week').format("YYYYMMDD");
            var week_of_month = weekOfMonthfun(end_day_of_week);
            next = moment(end_day_of_week).add(1, 'day').format("YYYYMMDD");

            var key = moment(start_day_of_week).format('YYYYMM');
            if (moment(start_day_of_week).format('YYYYMM') < moment(end_day_of_week).format('YYYYMM')) {
                key = moment(end_day_of_week).format('YYYYMM');
            }
            console.log(start_day_of_week,end_day_of_week);
            if (next < ''+eday) {
                key += 'w_' + week_of_month+'_' + start_day_of_week.slice(4,8) + '_' + end_day_of_week.slice(4,8);
                res.push(key)
            }
        }
        */
        $scope.model = {
            rows: []
        };
        $scope.run = {
            init: () => {
                indexer.domain_by_day(build => {
                    var args = build.sort((a, b) => { return b.day - a.day })
                    $scope.run.start(args)
                });
            },
            start: args => {
                console.log(args);
                var eday = args[0].day;
                var sday = args[args.length - 1].day;
                var pre_month = moment('' + eday).add(-1, 'month').format("YYYYMMDD");
                var diff_months = Math.round(moment('' + eday).diff(moment('' + sday), 'months', true));
                // console.log(sday,eday,pre_month,diff_months);
                // 월간 데이터
                var months = Array(diff_months).fill(0).map((_e, idx) => idx).reduce((a, b) => {
                    var cur_month = moment('' +pre_month).add(-b, 'month');
                    var key = cur_month.format('YYYYMM');
                    var reduce = args
                            .filter(x => x.day >= Number(cur_month.clone().startOf('month').format('YYYYMMDD'))
                                      && x.day <= Number(cur_month.clone().endOf('month').format('YYYYMMDD')))
                            .map(x => x.url)
                            .reduce((arr,cur) => arr.concat(cur), []);
                    if (a[key]) {
                        a[key].concat(reduce)
                    } else {
                        a[[key]] = reduce;
                    }
                    return a;
                }, {});
                console.log(months);

                // 20210118 20201229
                // 마지막월은 항상 이전 달 사용
                // 주의 시작
            }
        };

        $scope.run.init();
    })