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
            reduce:[],
            daytime_of_usaged:[],
            series: {

            },
            sums: { times: 0, traffic: 0, count: 0, blacklist: 0 },
            top_rank: {
                category: [],
                url: []
            },
            weeks:[],
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
                indexer.dashboard(res => {
                    console.log('db...',res);
                    if (res == 'not_found') {
                        indexer.domain_by_day(build => {
                            var args = build.sort((a, b) => { return b.day - a.day })
                            pounch.getbucket(null, 'bucket_blacklist_access')
                                .then(res1 => $scope.run.start(args, res1.value))
                                .catch(_err => $scope.run.start(args, []))
                        });
                    } else {
                        $scope.run.bindind(res)
                    }
                })
            },
            bindind: args => {
                console.log('bindind',args);
                $scope.model = args;
                $scope.run.draw();
            },
            draw: () => {
                [['times', 'secondToFormat'],
                ['traffic', 'dataSizeToUnit'],
                ['count', 'num_comma'],
                ['blacklist', 'num_comma']
                ].forEach((e, idx) => {
                    var series = [{
                        data: $scope.model.reduce[idx], type: 'line', symbolSize: 0, smooth: true,
                        lineStyle: { width: 3, color: '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6) }
                    }];
                    // $scope.model.charts[e[0]] = { 'option': chart($scope.model.weeks, series, e[1]), 'click': null };
                });
                // $scope.model.charts.radar = { 'option': chart2($scope.model.radarReduce, $scope.model.series['radarSeries']), 'click': null };
                $scope.model.charts.by_category = { 'option': chart($scope.model.weeks, $scope.model.series['catSeries']), 'click': null };
                // $scope.model.charts.scatter = { 'option': chart3($scope.model.distribution_of_time_use), 'click': null };
            },
            start: (args, baccess) => {
                console.log('start!!');
                console.log(baccess, args);
                // 30일 데이터만 수집?
                // console.log(args);
                $scope.model.days =
                    Array(30).fill(0).map((_e, idx) => idx).reduce((a, b) => {
                        a.push(moment('' + args[0].day).add(-b, 'day').format("YYYYMMDD"));
                        return a;
                    }, []);
                $scope.model.weeks = $scope.model.days.slice(0, 7).reverse();
                var weeks = $scope.model.weeks;
                // 날짜 기간 고민필요
                var monthly = weeks;//$scope.model.days.reverse(); //Usability

                var wsize = weeks.length;// - 1;
                // 날짜에 데이터 넣기
                var reduce = args.reduce((a, b) => {
                    var idx = weeks.indexOf('' + b.day);
                    // idx = idx == -1 ? 0 : idx;
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

                var baccess1 = baccess
                    .reduce((a, b) => {
                        var index = a.findIndex(x => x.date == b.date);
                        if (index != -1) {
                            a[index].count += b.count;
                        } else {
                            a.push({ date: b.date, count: b.count })
                        }
                        return a;
                    }, [])
                    .reduce((a, b) => {
                        var idx = weeks.indexOf('' + b.date);
                        if (idx != -1) {
                            a.splice(idx, 1, b.count);
                        }
                        return a;
                    }, new Array(wsize).fill(0));
                $scope.model.sums.blacklist = baccess1.reduce((a, b) => a + b, 0);
                // black list access append reduces
                reduce.push(baccess1);
                $scope.model.reduce = reduce;

                // 30일간 사용된 도메인 목록
                var domains = args
                    .filter(a => '' + a.day >= monthly[0] && a.day <= monthly[monthly.length - 1])
                    .reduce((a, b) => {
                        a = a.concat(b.url)
                        return a;
                    }, []);
                domains = Array.from(new Set(domains));
                var dotu = $scope.model.distribution_of_time_use;
                var daytime_of_usaged = $scope.model.daytime_of_usaged;
                // 날짜 시간(24) 사용시간
                pounch.getdocs(domains).then(docs => {
                    // console.log(docs);
                    var reduce1 = docs.results.reduce(([acc, day_by_cat], doc) => {
                        var code = doc.docs[0]['ok'].value.category_code;
                        code = code || '000';
                        var sum = { url: doc.id, categroy_code: code, count: 0, summary: 0, dataUsage: 0, rate: [0, 0, 0] };
                        doc.docs[0]['ok'].value.days
                            .filter(a => '' + a.date >= monthly[0] && a.date <= monthly[monthly.length - 1])
                            .forEach(e => {
                                // 도메인갯수 x 날짜
                                e.hours.forEach((h, index) => {
                                    if (h.second > 0) {
                                        dotu.push([index, h.second]);
                                    }
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
                            });
                        sum.rate = percent(sum.count * 10, sum.summary, sum.dataUsage / 1000000);//.join(',');
                        acc.push(sum);
                        return [acc, day_by_cat];
                    }, [[], {}]);
                    console.log('daytime_of_usaged', daytime_of_usaged);
                    const usability = reduce1[0];
                    // cache..
                    $scope.model.usabilitys = usability;
                    // console.log(usability);
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
                            acc[1].push({ name: cur.categroy_code, max: 0 });
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
                        },
                        formatter: function (value) {
                            return $filter('category_code_to_name')(value)
                        }

                    },
                    indicator: indicator
                },
                series: series,
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
                    left: 9,
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
                            type: 'scatter'
                        }]
            }
        }
    })
