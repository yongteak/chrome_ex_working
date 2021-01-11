angular.module('app.controller.dashboard', [])
    .controller('dashboardController', function ($scope, $rootScope, $filter, $timeout, pounch, moment, indexer, CONFIG) {
        Array.prototype.forEachAsync = async function (fn) {
            for (let t of this) { await fn(t) }
        }

        Array.prototype.forEachAsyncParallel = async function (fn) {
            await Promise.all(this.map(fn));
        }

        $scope.model = {
            charts: {
                traffic: {},
                scatter: {},
                by_category: {},
                radar: {}
            },
            sums: { times: 0, traffic: 0, count: 0 },
            top_rank: {
                category: [],
                url: []
            },
            week_of_days: [],
            domain_by_day: [],
            usabilitys: [],
            usability: [],
            distribution_of_time_use: [],//Array(24).fill(0),
            cumulative_usage: [],
            cumulative_sum: { count: 0, dataUsage: 0, summary: 0 }
        };
        $scope.run = {
            init: () => {
                indexer.domain_by_day(build => {
                    $scope.run.start(build.sort((a, b) => { return b.day - a.day }));
                });
            },
            start: args => {
                console.log(args);
                // 30일 데이터만 수집?
                // console.log(args);
                $scope.model.days =
                    Array(30).fill(0).map((_e, idx) => idx).reduce((a, b) => {
                        a.push(moment('' + args[0].day).add(-b, 'day').format("YYYYMMDD"));
                        return a;
                    }, []);
                var weeks = $scope.model.days.slice(0, 7).reverse()
                // 날짜 기간 고민필요
                var monthly = weeks;//$scope.model.days.reverse(); //Usability

                var wsize = weeks.length;// - 1;
                // 날짜에 데이터 넣기
                var reduce = args.reduce((a, b) => {
                    var idx = weeks.indexOf('' + b.day);
                    idx = idx == -1 ? 0 : idx;
                    if (idx != -1) {
                        a[0].splice(idx, 1, b.summary);
                        a[1].splice(idx, 1, b.dataUsage);
                        a[2].splice(idx, 1, b.counter);

                        $scope.model.sums.times += b.summary;
                        $scope.model.sums.traffic += b.dataUsage;
                        $scope.model.sums.count += b.counter;
                    }
                    return a;
                }, [new Array(wsize).fill(0), // times
                new Array(wsize).fill(0), // traffic
                new Array(wsize).fill(0)]); // count
                // 30일간 사용된 도메인 목록
                var domains = args
                    .filter(a => '' + a.day >= monthly[0] && a.day <= monthly[monthly.length - 1])
                    .reduce((a, b) => {
                        a = a.concat(b.url)
                        return a;
                    }, []);
                domains = Array.from(new Set(domains));
                var dotu = $scope.model.distribution_of_time_use;
                pounch.getdocs(domains).then(docs => {
                    var reduce1 = docs.results.reduce(([acc, day_by_cat], doc) => {
                        var code = doc.docs[0]['ok'].value.category_code;
                        code = code || '000';
                        var sum = { url: doc.id, categroy_code: code, count: 0, summary: 0, dataUsage: 0, rate: [0, 0, 0] };
                        doc.docs[0]['ok'].value.days
                            .filter(a => '' + a.date >= monthly[0] && a.date <= monthly[monthly.length - 1])
                            .forEach(e => {
                                e.hours.forEach((h, index) => {
                                    if (h.second > 0) dotu.push([index, h.second])
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
                                            category_code: code,
                                            date: e.date,
                                            summary: e.summary
                                        })
                                    }
                                } else {
                                    day_by_cat[[code]] = [{
                                        category_code: code,
                                        date: e.date,
                                        summary: e.summary
                                    }];
                                }
                                // if (day_by_cat[e.date]) {
                                //     var idx = day_by_cat[e.date].map(m => m.category_code).indexOf(code);
                                //     if (idx >= 0) {
                                //         day_by_cat[e.date][idx].summary += e.summary;
                                //     } else {
                                //         day_by_cat[e.date].push({
                                //             category_code: code,
                                //             date: e.date,
                                //             summary: e.summary
                                //         })
                                //     }
                                // } else {
                                //     day_by_cat[[e.date]] = [{
                                //         category_code: code,
                                //         date: e.date,
                                //         summary: e.summary
                                //     }];
                                // }
                            });
                        sum.rate = percent(sum.count * 10, sum.summary, sum.dataUsage / 1000000);//.join(',');
                        acc.push(sum);
                        return [acc, day_by_cat];
                    }, [[], {}]);
                    // console.log('series=>',series)

                    // [
                    //     {
                    //         name: '000', // code
                    //         type: 'bar',
                    //         stack: 'total',
                    //         data: [..0] // 7개 데이터
                    //     },

                    const usability = reduce1[0];
                    // cache..
                    $scope.model.usabilitys = usability;
                    console.log(usability);
                    // 시간 10분이상, 접속횟수 10회이상, 데이터 1MB 이상
                    $scope.model.usability = usability
                        .filter(a => a.count >= 1 && a.summary >= 60 && a.dataUsage >= 100)
                        .sort((a, b) => { return b.dataUsage - a.dataUsage }).slice(0, 5);
                    console.log($scope.model.usability);
                    // 누적 사용량
                    $scope.model.cumulative_usage = usability
                        .sort((a, b) => { return b.summary - a.summary }).slice(0, 5);

                    $scope.model.cumulative_sum = $scope.model.cumulative_usage.reduce((acc, cur) => {
                        acc.count += cur.count;
                        acc.dataUsage += cur.dataUsage;
                        acc.summary += cur.summary;
                        return acc;
                    }, { count: 0, dataUsage: 0, summary: 0 });

                    // 주간 카테고리 Top 5
                    // 카테고리 / 시간 / 데이터 <=> 과거 1주일전 데이터 비교
                    var cat_url_rank = usability.reduce(([acc1, acc2], cur) => {
                        var code = cur.categroy_code || '000';
                        var index = {
                            cat: acc1.map(m => m.categroy_code).indexOf(code),
                            url: acc2.map(m => m.url).indexOf(cur.url),
                        };
                        if (index.cat >= 0) {
                            acc1[index.cat].count += cur.count;
                            acc1[index.cat].dataUsage += cur.dataUsage;
                            acc1[index.cat].summary += cur.summary;
                            acc1[index.cat].urls++;
                        } else {
                            acc1.push({ categroy_code: code, urls: 1, summary: cur.summary, count: cur.count, dataUsage: cur.dataUsage })
                        }

                        if (index.url >= 0) {
                            acc2[index.url].count += cur.count;
                            acc2[index.url].dataUsage += cur.dataUsage;
                            acc2[index.url].summary += cur.summary;
                        } else {
                            acc2.push({ url: cur.url, categroy_code: code, summary: cur.summary, count: cur.count, dataUsage: cur.dataUsage })
                        }
                        return [acc1, acc2];
                    }, [[], []]);
                    // 시간, 접속횟수
                    $scope.model.top_rank.category = cat_url_rank[0].sort((a, b) => { return b.summary - a.summary }).slice(0, 5);
                    $scope.model.top_rank.url = cat_url_rank[1].sort((a, b) => { return b.summary - a.summary }).slice(0, 5);

                    // console.log($scope.model.cumulative_usage,$scope.model.cumulative_sum);
                    // 시간대별 주간 누적 사용시간 분포
                    // $scope.model.distribution_of_time_use
                    // [ [시간,값] .. ]
                    // console.log(usability);
                    // console.log(dotu)
                    // distribution_of_time_use

                    // yAxisFormat = secondToFormat,dataSizeToUnit,num_comma
                    [['times', 'secondToFormat'],
                    ['traffic', 'dataSizeToUnit'],
                    ['count', 'num_comma']].forEach((e, idx) => {
                        var seriesData = [{
                            data: reduce[idx], type: 'line', symbolSize: 0, smooth: true,
                            lineStyle: { width: 3, color: '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6) }
                        }];
                        // $scope.model.charts[e[0]] = { 'option': chart(weeks, seriesData,e[1]), 'click': null };
                    });
                    // console.log(usability);
                    // 일자별 카테고리별 사용시간
                    // console.log(weeks,'reduce1', reduce1[1]);
                    // 주간 사용량
                    var catSeriesData = [];
                    for (var p in reduce1[1]) {
                        var fill = new Array(wsize).fill(0);
                        reduce1[1][p].filter(s => weeks.includes('' + s.date)).forEach(e => {
                            var idx = weeks.indexOf('' + e.date);
                            if (idx != -1) fill.splice(idx, 1, e.summary);
                        })
                        catSeriesData.push({
                            name: p, type: 'bar', stack: 'total',
                            data: fill, hoverAnimation: false
                        });
                    };
                    $scope.model.charts.radar = { 'option': chart2(weeks, catSeriesData), 'click': null };
                    // $scope.model.charts.by_category = { 'option': chart(weeks, catSeriesData), 'click': null };
                    // $scope.model.charts.scatter = { 'option': chart3($scope.model.distribution_of_time_use), 'click': null };
                    // 전체 카테고리 목록중 비율을 계산하여 사용시간 x 접속횟수 통계 잡기
                    // console.log(2222, cat_url_rank[0]);
                    // url 5 summary 60, count 10, datausage 100000
                    // col 백분율 계산 + 전체 합산
                    // 5개 필터링 필요
                    var a1 = cat_url_rank[0].reduce((acc, cur) => {
                        // if (cur.urls >= 5 && cur.summary >= 60 && cur.count >= 10) {
                            acc.urls += cur.urls;
                            acc.summary += cur.summary;
                            acc.count += cur.count;
                            acc.rows++;
                        // }
                        return acc;
                    }, { rows: 0, urls: 0, summary: 0, count: 0 });
                    var a2 = cat_url_rank[0].reduce((acc, cur) => {
                        if (cur.urls >= 5 && cur.summary >= 60 && cur.count >= 10) {
                            var rate =
                                parseInt(((cur.urls / a1.urls) * 100).toFixed(0))
                                + parseInt(((cur.summary / a1.summary) * 100).toFixed(0))
                                + parseInt(((cur.count / a1.count) * 100).toFixed(0));
                            acc[0].push(rate);
                            acc[1].push({name: cur.categroy_code,max:0});
                            acc[2] += rate;
                        }
                        return acc;
                    }, [[], [], 0]);
                    var max = a2[1];
                    console.log(222222222,a2);

                    // (200+19624+205)

                    // { name: '미분류(기타)', max: 52000 },
                    // { name: '개발자도구', max: 52000 },
                    // { name: '생산성', max: 52000 },
                    // { name: '소프트웨어', max: 52000 },
                    // { name: '라이프스타일', max: 52000 }
                    // [{
                    //     type: 'radar',
                    //     // areaStyle: {normal: {}},
                    //     data: [
                    //         {
                    //             value: [4300, 10000, 28000, 35000, 50000]
                    //         }
                    //     ]
                    // }]
                });
            }
        }

        // $timeout(function () {
        //     $scope.model.charts.limit = { 'option': chart(), 'click': null };

        //     $scope.model.charts.monthly = { 'option': chart2(), 'click': null };
        //     $scope.model.charts.scatter = { 'option': chart3(), 'click': null };
        // }, 0.2 * 1000);

        $scope.run.init();

        function percent(count, times, usaged) {
            var sum = count + times + usaged;
            return [((count / sum) * 100).toFixed(0),
            ((times / sum) * 100).toFixed(0),
            ((usaged / sum) * 100).toFixed(0)]
        };

        function chart(days, seriesData, yAxisFormat, showSplitLine) {
            yAxisFormat = yAxisFormat || 'secondToFormat';
            showSplitLine = showSplitLine || false;
            return {
                xAxis: {
                    type: 'category',
                    data: days,
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
                        formatter: t => $filter(yAxisFormat)(t)
                    },
                    splitLine: {
                        show: false
                    }
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
                                    : $filter(yAxisFormat)(yAxisFormat == 'num_comma' ? e.value.toFixed(0) : e.value)
                            }
                        }
                    }
                },
                legend: {
                    padding: 0,
                    itemGap: 0,
                    data: [' ', ' ']
                },
                grid: {
                    left: 8,
                    top: 10,
                    right: 6,
                    bottom: 18
                },
                series: seriesData
            }
        }

        function chart2(indicator, series) {
            return {
                // title: {
                //     text: '基础雷达图'
                // },
                // tooltip: {},
                // legend: {
                //     data: ['预算分配（Allocated Budget）', '实际开销（Actual Spending）']
                // },
                legend: {
                    padding: 0,
                    itemGap: 0,
                    data: [' ', ' ']
                },
                grid: {
                    left: 8,
                    top: 100,
                    right: 6,
                    bottom: 18
                },
                radar: {
                    // shape: 'circle',
                    name: {
                        textStyle: {
                            color: '#fff',
                            backgroundColor: '#999',
                            borderRadius: 3,
                            padding: [3, 5]
                        }
                    },
                    indicator: indicator
                },
                series: series
                // [{
                //     type: 'radar',
                //     // areaStyle: {normal: {}},
                //     data: [
                //         {
                //             value: [4300, 10000, 28000, 35000, 50000]
                //         }
                //     ]
                // }]
            }
        }

        function chart3(data) {
            return {
                legend: {
                    padding: 0,
                    itemGap: 0,
                    data: [' ', ' ']
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: series => { return '' },
                    axisPointer: {
                        animation: false,
                        type: 'cross',
                        crossStyle: {
                            color: '#999'
                        },
                        label: {
                            formatter: e => {
                                return e.axisDimension == 'x' ? e.value + '시'
                                    : $filter('secondToFormat')(e.value)
                            }
                        }
                    }
                },

                grid: {
                    left: 10,
                    top: 35,
                    right: 12,
                    bottom: 20
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: t => $filter('secondToFormat')(t)
                    },
                    splitLine: {
                        show: false
                    },
                    scale: true,
                },

                xAxis: {
                    scale: true,
                    max: 23,
                    axisLabel: {
                        formatter: '{value}시'
                    }
                },

                series:
                    [
                        {
                            type: 'effectScatter',
                            symbolSize: 5,
                            data: data
                        },
                        {
                            type: 'scatter',
                            // data: data
                            // Array.from({ length: 350 }, () =>
                            //     [Math.floor(Math.random() * 25), Math.floor(Math.random() * 3600)]),
                        }]
            }
        }
    })
