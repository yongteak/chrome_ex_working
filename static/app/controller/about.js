angular.module('app.controller.about', [])
    .controller('aboutController', function ($scope, $filter, indexer, pounch, CONFIG) {
        $scope.model = {
            isReady: false,
            rows: [],
            sums: {
                counter: 0,
                summary: 0,
                dataUsage: 0
            },
            top_rank: {
                category: [],
                url: []
            },
            daytime_of_usaged: {
                cur: [],
                pre: []
            },
            charts: {
                weeks: []
            },
            compare: {
                cur: [],
                pre: []
            },
            paginate: {
                currentPage: 1,
                numPerPage: 8,
                total: 0,
                pageSize: 10, // 페이징 버튼 갯수
                limit: 0,
                offset: 0,
                rows:[]
            }
        };

        $scope.pageChanged = function () {
            $scope.paginate($scope.model.usabilitys, $scope.model.paginate.currentPage)
        };

        $scope.paginate = (rows, page_number) => {
            console.log('paginate', $scope.model.paginate.total, page_number)
            $scope.model.paginate.rows = rows.slice((page_number - 1) * $scope.model.paginate.numPerPage,
                page_number * $scope.model.paginate.numPerPage);
            console.log($scope.model.paginate.rows);
        }
        // $scope.model.charts.weeks = { 'option': chart(), 'click': null }
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
                console.log(args);
                // 202101_3w_20210110_20210116
                // 지난주 데이터 비교를위해 기간을 더 추가한다,
                // 지난주 데이터가 indexer에 있는경우 기간을 추가할 필요는 없지만 그럴일은 거의 없을듯..
                var days = '202101_3w_20210103_20210120'.split('_');
                var sday = days[2];
                var eday = days[3];
                console.log('start!!');

                $scope.model.days =
                    Array(14).fill(0).map((_e, idx) => idx).reduce((a, b) => {
                        a.push(moment('' + eday).add(-b, 'day').format("YYYYMMDD"));
                        return a;
                    }, []).reverse();
                console.log('days', $scope.model.days);
                $scope.model.weeks = $scope.model.days.slice(0, 7);
                var weeks = $scope.model.weeks;
                var dsize = $scope.model.days.length;
                var wsize = weeks.length;// - 1;
                // 날짜에 데이터 넣기
                var reduce =
                    args
                        // .filter(x => x.day >= sday && x.day <= eday)
                        .filter(x => x.day >= $scope.model.days[0] && x.day <= $scope.model.days[$scope.model.days.length - 1])
                        .reduce((a, b) => {
                            var idx = $scope.model.days.indexOf('' + b.day);
                            // if (idx != -1) {
                            ['summary', 'dataUsage', 'counter']
                                .forEach((val, index) => {
                                    var fixNum = isNaN(b[val]) ? 0 : b[val];
                                    // console.log('fixNum',val,fixNum);
                                    if (idx != -1) {
                                        a[index].splice(idx, 1, fixNum);
                                    }
                                    // [2021-01-27 13:38:59] 잘못된 데이터 제거 필요
                                    if (val == 'summary')
                                        fixNum = fixNum > 10000 ? 0 : fixNum;
                                    $scope.model.sums[val] += fixNum;                      });
                            // }
                            a[3] = a[3].concat(b.url);
                            return a;
                        }, [new Array(dsize).fill(0), // times
                        new Array(dsize).fill(0), // traffic
                        new Array(dsize).fill(0), // count
                        []]); // urls
                // console.log($scope.model.sums);
                $scope.model.charts.weeks = { 'option': chart(weeks, $scope.run.series(reduce[0])), 'click': null };
                // console.log(weeks, $scope.run.series(reduce[0]));
                $scope.model.reduce = reduce;
                var domains = Array.from(new Set(reduce[3]));
                var daytime_of_usaged = $scope.model.daytime_of_usaged;
                var len = $scope.model.days.length;
                // console.log($filter('epoch')(), 'getdocs');
                pounch.getdocs(domains).then(docs => {
                    // console.log(docs);
                    var reduce1 = docs.results.reduce(([acc_cur, acc_pre, cur, pre, pre_pivot], doc) => {
                        var code = doc.docs[0]['ok'].value.category;
                        code = code || '000';

                        var cur_days = doc.docs[0]['ok'].value.days
                            .filter(x => x.date >= $scope.model.days[0] && x.date <= $scope.model.days[len / 2]);
                        var pre_days = doc.docs[0]['ok'].value.days
                            .filter(x => x.date >= $scope.model.days[(len / 2) + 1] && x.date <= $scope.model.days[len - 1]);
                        [pre_days, cur_days].forEach((x_days, i) => {
                            var day_by_cat;
                            var sum = { url: doc.id, category: code, count: 0, summary: 0, dataUsage: 0, rate: [0, 0, 0] };
                            x_days.forEach(e => {
                                var isCur = e.date > $scope.model.days[len / 2];
                                // console.log(e.date, $scope.model.days[len / 2],e.date > $scope.model.days[len / 2])
                                day_by_cat = isCur ? cur : pre;
                                var dou = daytime_of_usaged[isCur ? 'cur' : 'pre'];
                                // acc = e.date >= $scope.model.days[$scope.model.days.length / 2] ? acc_cur : acc_pre;
                                // 도메인갯수 x 날짜
                                e.hours.forEach((h, index) => {
                                    var daytime = '' + e.date + $filter('zeroAppend')(index);
                                    var daytime_index = dou.map(m => m.daytime).indexOf(daytime);
                                    if (daytime_index == -1) {
                                        dou.push({
                                            daytime: daytime,
                                            second: h.second,
                                            counter: h.counter,
                                            dataUsage: h.dataUsage
                                        })
                                    } else {
                                        dou[daytime_index].second += h.second;
                                        dou[daytime_index].counter += h.counter;
                                        dou[daytime_index].dataUsage += h.dataUsage;
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
                            }) // end of forEach
                            sum.rate = $filter('percent')(sum.count * 10, sum.summary, sum.dataUsage / 1000000);//.join(',');
                            // pre데이터 우선 수집
                            if (i == 0) {
                                pre_pivot[sum.url] = sum;
                                acc_pre.push(sum);
                            } else {
                                var val = pre_pivot[sum.url];
                                // var sum = { url: doc.id, category: code, count: 0, summary: 0, dataUsage: 0, rate: [0, 0, 0] };
                                if (val) {
                                    ['count', 'summary', 'dataUsage'].forEach(e => {
                                        var val1 = (isNaN(val[e]) ? 0 : val[e]) - sum[e];
                                        sum['state_'+e] = val1 == 0 ? 'same' : (val1 > 0 ? 'down' : 'up');
                                        sum['p_' + e] = Math.abs(val1);
                                    })
                                } else {
                                    sum['state_'+e] = 'new';
                                    sum['p_' + e] = 0;
                                }
                                acc_cur.push(sum);
                            }
                        });
                        return [acc_cur, acc_pre, cur, pre, pre_pivot];
                    }, [[], [], {}, {}, {}]);
                    // console.log('daytime_of_usaged', daytime_of_usaged);
                    const usability = reduce1[0];
                    // cache..
                    $scope.model.usabilitys = usability;
                    console.log($scope.model.usabilitys);

                    $scope.model.usability = usability
                        .filter(a => a.count >= 1 && a.summary >= 60 && a.dataUsage >= 100)
                        .sort((a, b) => { return b.dataUsage - a.dataUsage }).slice(0, 5);

                    var cur_cat_rank = $scope.run.category_rank(reduce1[0]);
                    var pre_cat_rank = $scope.run.category_rank(reduce1[1]);
                    var cat_rank = cur_cat_rank[0].reduce((acc, cur) => {
                        var pre = pre_cat_rank[0].find(x => x.category);
                        if (pre) {
                            // // 퍼센트로 보여주기엔 데이터 표본 오차가 너무 큼 [2021-01-26 05:11:18]
                            // console.log(pre);
                            for (var prop in pre) {
                                if (prop != 'category') {
                                    cur['p_' + prop] = pre[prop] - cur[prop];
                                    // (pre[prop]/cur[prop]*100).toFixed(1);
                                }
                            }
                            acc.push(cur);
                            return acc;
                        }
                    }, []);
                    console.log(cat_rank);// 시간, 접속횟수
                    $scope.model.top_rank.category = cur_cat_rank[0].sort((a, b) => { return b.summary - a.summary/* urls */ }).slice(0, 5);
                    // $scope.model.top_rank.url = cat_url_rank[1].sort((a, b) => { return b.summary - a.summary });//.slice(0, 5);
                    console.log(cur_cat_rank);
                    $scope.model.isReady = true;

                    $scope.model.usabilitys.forEach((e, index) => {
                        e.index = index+1
                    });
                    $scope.model.paginate.total = $scope.model.usabilitys.length;
                    $scope.pageChanged();
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
            category_rank: arr => {
                return arr.reduce(([acc1, acc2], cur) => {
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
            },
            series: arr => {
                var len = arr.length;
                return [
                    {
                        name: '1월2주',
                        type: 'bar',
                        emphasis: { focus: 'none' },
                        itemStyle: { color: '#C6D0FD' },
                        data: arr.slice(0, len / 2)
                    },

                    {
                        name: '1월3주',
                        type: 'bar',
                        itemStyle: { color: '#5989FF' },
                        emphasis: { focus: 'none' },
                        data: arr.slice(len / 2, len)
                    }]
            },
            format: day_text => {
                return '`' + day_text.slice(2, 4) + '년 ' + day_text.slice(4, 6) + '월 ' + day_text.slice(7, 8) + '주';
            }
        };

        $scope.run.init();


        function chart(category, series) {
            return {
                legend: {
                    data: ['1월2주', '1월3주']
                },
                xAxis: {
                    type: 'category',
                    data: category,
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        formatter: value => moment(value).format('ddd')
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: t => $filter('secondToFormat')(t)
                    },
                    splitLine: {
                        show: true
                    }
                },
                grid: {
                    left: 8,
                    // top: 35,
                    right: 12,
                    bottom: 20
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: _series => { return '' },
                    axisPointer: {
                        animation: false,
                        type: 'cross',
                        crossStyle: {
                            color: '#999'
                        },
                        label: {
                            formatter: e => {
                                return e.axisDimension == 'x' ? $filter('formatDate')(e.value, 'MM월DD일')
                                    : $filter('secondToFormat')(e.value)
                            }
                        }
                    }
                },
                series: series
            }
        }
    })