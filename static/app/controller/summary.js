angular.module('app.controller.summary', [])
    .controller('summaryController', function ($scope,$location, $filter, pounch, indexer, CONFIG) {
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
                key += '_'+week_of_month+'w_' + start_day_of_week.slice(0,8) + '_' + end_day_of_week.slice(0,8);
                res.push(key)
            }
        }
        */
    //    console.log($location.path());
        // $location.path('/test/item/' + $scope.itemId);
        // $location.url($location.path()+'?text=tyyy');

        $scope.model = {
            rows: []
        };
        $scope.run = {
            view: target => {
                console.log(target);
                $location.url($location.path()+'?target='+target);
                console.log($location);
            },
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
                // var pre_month = moment('' + eday).add(-1, 'month').format("YYYYMMDD");
                // var diff_months = Math.round(moment('' + eday).diff(moment('' + sday), 'months', true));
                // // console.log(sday,eday,pre_month,diff_months);
                // // 월간 데이터
                // var months = Array(diff_months).fill(0).map((_e, idx) => idx).reduce((a, b) => {
                //     var cur_month = moment('' +pre_month).add(-b, 'month');
                //     var key = cur_month.format('YYYYMM');
                //     var reduce = args
                //             .filter(x => x.day >= Number(cur_month.clone().startOf('month').format('YYYYMMDD'))
                //                       && x.day <= Number(cur_month.clone().endOf('month').format('YYYYMMDD')))
                //             .map(x => x.url)
                //             .reduce((arr,cur) => arr.concat(cur), []);
                //     if (a[key]) {
                //         a[key].concat(reduce)
                //     } else {
                //         a[[key]] = reduce;
                //     }
                //     return a;
                // }, {});
                // console.log(months);

                // 주차
                var weeks = Math.round(moment('' + eday).diff(moment('' + sday), 'days') / 7);

                var weekOfMonthfun = (day) => {
                    var m = moment('' + day).utc(true);
                    return m.week() - moment(m).startOf('month').week() + 1;
                }
                // 마지막주의 마지막 날짜가 다음달의 첫번째 주와 겹치는경우 다음달의 첫번째 주에 포함시켜야함
                // "202011w_5_1129_1205" => 12월 1주
                // var res = [];
                // 2021년 1월 1주
                // 집계기간 : 1월3일 ~ 1월09일
                var next = false;
                for (var i = 0; i < weeks; i++) {
                    var start_day_of_week = next ? next : moment('' + sday).startOf('week').format("YYYYMMDD");
                    var end_day_of_week = moment(start_day_of_week).endOf('week').format("YYYYMMDD");
                    var week_of_month = weekOfMonthfun(end_day_of_week);
                    next = moment(end_day_of_week).add(1, 'day').format("YYYYMMDD");

                    var key = moment(start_day_of_week).format('YYYYMM');
                    if (moment(start_day_of_week).format('YYYYMM') < moment(end_day_of_week).format('YYYYMM')) {
                        key = moment(end_day_of_week).format('YYYYMM');
                    }
                    console.log(start_day_of_week, end_day_of_week);
                    if (next < '' + eday) {
                        key += '_' + week_of_month + 'w_' + start_day_of_week.slice(0, 8) + '_' + end_day_of_week.slice(0, 8);
                        // res.push(key)
                        $scope.model.rows.push(key);
                        $scope.model.rows.reverse();
                        console.log(key);
                    }
                }
            },
            format: day_text => {
                // var day_text =  '202101_2w_20210103_20210109';
                return '`'+day_text.slice(2,4)+'년 ' + day_text.slice(4,6)+'월 '+day_text.slice(7,8)+'주';
                // day_text.slice(0,4)+'년 ' + day_text.slice(4,6)+'주 '
            }
        };

        $scope.run.init();
    })