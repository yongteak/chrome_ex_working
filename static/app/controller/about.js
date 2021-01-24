angular.module('app.controller.about', [])
    .controller('aboutController', function ($scope, $filter, indexer, pounch, CONFIG) {
        $scope.model = {
            rows: [],
            sums: {
                times: 0,
                traffic: 0,
                count: 0
            },
            top_rank: {
                category:[],
                url:[]
            },
            daytime_of_usaged:[]
        };
        $scope.run = {
            view: target => {
                console.log(target);
                // $location.url($location.path() + '?target=' + target);
                // console.log($location);
            },
            init: () => {
                indexer.domain_by_day(build => {
                    var args = build.sort((a, b) => { return b.day - a.day })
                    $scope.run.start1(args)
                });
            },
            start: args => {
                console.log(args);
                var eday = args[0].day;
                var sday = args[args.length - 1].day;
                // 주차
                var weeks = Math.round(moment('' + eday).diff(moment('' + sday), 'days') / 7);

                var weekOfMonthfun = (day) => {
                    var m = moment('' + day).utc(true);
                    return m.week() - moment(m).startOf('month').week() + 1;
                }
                // 마지막주의 마지막 날짜가 다음달의 첫번째 주와 겹치는경우 다음달의 첫번째 주에 포함시켜야함
                // "202011w_5_1129_1205" => 12월 1주
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
                    }
                }
                $scope.run.view($scope.model.rows[0]);
            },
            start1: args => {
                // 202101_3w_20210110_20210116
                // 지난주 데이터 비교를위해 기간을 더 추가한다,
                // 지난주 데이터가 indexer에 있는경우 기간을 추가할 필요는 없지만 그럴일은 거의 없을듯..
                var days = '202101_3w_20210103_20210116'.split('_');
                var sday = days[2];
                var eday = days[3];
                console.log('start!!');

                $scope.model.days =
                    Array(14).fill(0).map((_e, idx) => idx).reduce((a, b) => {
                        a.push(moment('' + sday).add(b, 'day').format("YYYYMMDD"));
                        return a;
                    }, []);
                console.log($scope.model.days);
                $scope.model.weeks = $scope.model.days.slice(0, 7).reverse();
                var weeks = $scope.model.weeks;
                var wsize = weeks.length;// - 1;
                // 날짜에 데이터 넣기
                var reduce =
                    args
                        .filter(x => x.day >= sday && x.day <= eday)
                        .reduce((a, b) => {
                            var idx = weeks.indexOf('' + b.day);
                            ['summary', 'dataUsage', 'counter']
                                .forEach((val, index) => {
                                    a[index].splice(idx, 1, b[val]);
                                    $scope.model.sums[val] += b[val];
                                });
                            a[3] = a[3].concat(b.url);
                            return a;
                        }, [new Array(wsize).fill(0), // times
                        new Array(wsize).fill(0), // traffic
                        new Array(wsize).fill(0), // count
                        []]); // urls

                $scope.model.reduce = reduce;
                var domains = Array.from(new Set(reduce[3]));
                var dotu = $scope.model.distribution_of_time_use;
                var daytime_of_usaged = $scope.model.daytime_of_usaged;
                console.log($filter('epoch')(),'getdocs');
                pounch.getdocs(domains).then(docs => {
                    // console.log(docs);
                    var reduce1 = docs.results.reduce(([acc, day_by_cat], doc) => {
                        var code = doc.docs[0]['ok'].value.category;
                        code = code || '000';
                        var sum = { url: doc.id, category: code, count: 0, summary: 0, dataUsage: 0, rate: [0, 0, 0] };
                        doc.docs[0]['ok'].value.days
                            .filter(x => x.date >= sday && x.date <= eday)
                            .forEach(e => {
                                // 도메인갯수 x 날짜
                                e.hours.forEach((h, index) => {
                                    var daytime = '' + e.date + $filter('zeroAppend')(index);
                                    var daytime_index = daytime_of_usaged.map(m => m.daytime).indexOf(daytime);
                                    if (daytime_index == -1) {
                                        daytime_of_usaged.push({
                                            daytime: daytime,
                                            second: h.second,
                                            counter: h.counter,
                                            dataUsage: h.dataUsage
                                        })
                                    } else {
                                        daytime_of_usaged[daytime_index].second += h.second;
                                        daytime_of_usaged[daytime_index].counter += h.counter;
                                        daytime_of_usaged[daytime_index].dataUsage += h.dataUsage;
                                    }
                                })
                                sum['dataUsage'] += e.dataUsage;
                                sum['summary'] += e.summary;
                                sum['count'] += e.counter;

                                // day_by_cat
                                if (day_by_cat[code]) {
                                    var idx = day_by_cat[code].map(m => m.date).indexOf(e.date);
                                    if (idx >= 0) {
                                        day_by_cat[code][idx].summary += e.summary;
                                    } else {
                                        day_by_cat[code].push({
                                            category: code,
                                            date: e.date,
                                            summary: e.summary
                                        })
                                    }
                                } else {
                                    day_by_cat[[code]] = [{
                                        category: code,
                                        date: e.date,
                                        summary: e.summary
                                    }];
                                }
                            });
                        // sum.rate = $filter('percent')(sum.count * 10, sum.summary, sum.dataUsage / 1000000);//.join(',');
                        acc.push(sum);
                        return [acc, day_by_cat];
                    }, [[], {}]);
                    // console.log('daytime_of_usaged', daytime_of_usaged);
                    const usability = reduce1[0];
                    // cache..
                    $scope.model.usabilitys = usability;
                    // console.log(usability);

                    // 카테고리 / 시간 / 데이터 <=> 과거 1주일전 데이터 비교
                    var cat_url_rank = usability.reduce(([acc1, acc2], cur) => {
                        var code = $filter('category_code_to_default')(cur.category);//cur.category || '000';
                        var index = {
                            cat: acc1.map(m => m.category).indexOf(code),
                            url: acc2.map(m => m.url).indexOf(cur.url),
                        };
                        if (index.cat >= 0) {
                            acc1[index.cat].count += cur.count;
                            acc1[index.cat].dataUsage += cur.dataUsage;
                            acc1[index.cat].summary += cur.summary;
                            acc1[index.cat].urls++;
                        } else {
                            acc1.push({ category: code, urls: 1, summary: cur.summary, count: cur.count, dataUsage: cur.dataUsage })
                        }

                        if (index.url >= 0) {
                            acc2[index.url].count += cur.count;
                                acc2[index.url].dataUsage += cur.dataUsage;
                            acc2[index.url].summary += cur.summary;
                        } else {
                            acc2.push({ url: cur.url, category: code, summary: cur.summary, count: cur.count, dataUsage: cur.dataUsage })
                        }
                        return [acc1, acc2];
                    }, [[], []]);
                    // 시간, 접속횟수
                    $scope.model.top_rank.category = cat_url_rank[0].sort((a, b) => { return b.summary - a.summary/* urls */ }).slice(0, 7);
                    // $scope.model.top_rank.url = cat_url_rank[1].sort((a, b) => { return b.summary - a.summary });//.slice(0, 5);
                    console.log(cat_url_rank);
                    return;
                    // console.log($scope.model.cumulative_usage,$scope.model.cumulative_sum);
                    // 시간대별 주간 누적 사용시간 분포
                    // $scope.model.distribution_of_time_use
                    // [ [시간,값] .. ]
                    // console.log(usability);
                    // console.log(dotu)
                    // distribution_of_time_use

                    // yAxisFormat = secondToFormat,dataSizeToUnit,num_comma
                    console.log('reduce', reduce);

                    // console.log(usability);
                    // 일자별 카테고리별 사용시간
                    // console.log(weeks,'reduce1', reduce1[1]);
                    // 주간 사용량


                    // ### RADAR
                    // max = 300, 3개의 값을 대조했으니 100% * 3
                    // 전체 카테고리 목록중 비율을 계산하여 사용시간 x 접속횟수 통계 잡기
                    // [2021-01-11 21:56:34] 기준값을 잡고 다시 계산하자

                    var radarReduce = cat_url_rank[0]
                        .sort((a, b) => { return b.dataUsage - a.dataUsage })
                        .slice(0, 5)
                        .reduce((acc, cur) => {
                            if (acc.length > 0) {
                                var t = acc[acc.length - 1].sum;
                                cur.sum = [t[0] + cur.urls, t[1] + cur.summary, t[2] + cur.count]
                            } else {
                                cur.sum = [cur.urls, cur.summary, cur.count];
                            }
                            acc.push(cur);
                            if (acc.length == 5) {
                                acc.map(x => x.sum = cur.sum);
                            }
                            return acc;
                        }, [])
                        .reduce((acc, cur) => {
                            var rate =
                                parseInt(((cur.urls / cur.sum[0]) * 100).toFixed(0))
                                + parseInt(((cur.summary / cur.sum[1]) * 100).toFixed(0))
                                + parseInt(((cur.count / cur.sum[2]) * 100).toFixed(0));
                            acc[0].push(rate);
                            acc[1].push({ name: cur.category, max: 0 });
                            if (acc[0].length == 5) {
                                var max = acc[0].reduce((a, b) => a + b, 0);
                                acc[1].map(x => x.max = max);
                            }
                            return acc;
                        }, [[], []]);
                    $scope.model.radarReduce = radarReduce[1];

                    // Series Data
                    $scope.model.series['catSeries'] = [];
                    // var catSeriesData = [];
                    for (var p in reduce1[1]) {
                        var fill = new Array(wsize).fill(0);
                        reduce1[1][p].filter(s => weeks.includes('' + s.date)).forEach(e => {
                            var idx = weeks.indexOf('' + e.date);
                            if (idx != -1) fill.splice(idx, 1, e.summary);
                        })
                        $scope.model.series['catSeries'].push({
                            name: p, type: 'bar', stack: 'total',
                            itemStyle: { color: $filter('category_code_to_color')(p) },
                            data: fill, hoverAnimation: false
                        });
                    };

                    // save model
                    console.log(JSON.parse(JSON.stringify($scope.model)));
                    indexer.dashboard(res => {
                        $scope.run.draw();
                    }, JSON.parse(JSON.stringify($scope.model)));
                });
            },
            format: day_text => {
                return '`' + day_text.slice(2, 4) + '년 ' + day_text.slice(4, 6) + '월 ' + day_text.slice(7, 8) + '주';
            }
        };

        $scope.run.init();
    })