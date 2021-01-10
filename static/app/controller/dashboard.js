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
                scatter: {}
            },
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

                var wsize = weeks.length - 1;
                // 날짜에 데이터 넣기
                var reduce = args.reduce((a, b) => {
                    var idx = weeks.indexOf('' + b.day);
                    idx = idx == -1 ? 0 : idx;
                    a[0].splice(idx, 0, b.summary);
                    a[1].splice(idx, 0, b.dataUsage);
                    a[2].splice(idx, 0, b.counter);
                    return a;
                }, [new Array(wsize).fill(0), // times
                new Array(wsize).fill(0), // traffic
                new Array(wsize).fill(0)]); // count

                // console.log(reduce);


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
                    }, [[], []]);
                    console.log(weeks,'reduce1', reduce1[1]);
                    // var day_by_cat_reduce = reduce1[1].reduce((a, b) => {
                    //     var idx = weeks.indexOf('' + b.date);
                    //     idx = idx == -1 ? 0 : idx;
                    //     a.splice(idx, 0, b.summary);
                    //     return a;
                    // }, []); // count

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

                    ['times', 'traffic', 'count'].forEach((e, idx) => {
                        var seriesData = [{
                            data: reduce[idx], type: 'line', symbolSize: 0, smooth: true,
                            lineStyle: { width: 3, color: '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6) }
                        }];
                        $scope.model.charts[e] = { 'option': chart(weeks, seriesData), 'click': null };
                    });
                    console.log(usability);
                    // 일자별 카테고리별 사용시간
                    // $scope.model.charts.scatter = { 'option': chart3($scope.model.distribution_of_time_use), 'click': null };
                });
            }
        }

        // $timeout(function () {
        //     $scope.model.charts.limit = { 'option': chart(), 'click': null };

        //     $scope.model.charts.monthly = { 'option': chart2(), 'click': null };
        //     $scope.model.charts.scatter = { 'option': chart3(), 'click': null };
        // }, 0.2 * 1000);

        $scope.run.init();

        // var percent = (count, times, usaged) => {
        //     var sum = count + times + usaged;
        //     return [Math.round( (count / sum) * 100),
        //     Math.round( (times / sum) * 100),
        //     Math.round( (usaged / sum) * 100)]
        // };
        // percent(18,370,753153).
        function percent(count, times, usaged) {
            var sum = count + times + usaged;
            return [((count / sum) * 100).toFixed(0),
            ((times / sum) * 100).toFixed(0),
            ((usaged / sum) * 100).toFixed(0)]
        };

        function chart(days, seriesData) {
            return {
                xAxis: {
                    type: 'category',
                    data: days,
                    show: true
                },
                yAxis: {
                    type: 'value',
                    show: false,
                    // min: 800
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: _series => { return '' },
                    axisPointer: {
                        type: 'cross',
                        crossStyle: {
                            color: '#999'
                        }
                    }
                },
                axisLabel: {
                    formatter: t => $filter('formatDate')(t, 'ddd')
                    // moment(mydate).format('ddd')
                    // $filter('formatDate')(t, 'MM월DD일')
                },
                legend: {
                    padding: 0,
                    itemGap: 0,
                    data: [' ', ' ']
                },
                grid: {
                    left: 10,
                    top: 10,
                    right: 6,
                    bottom: 18
                },
                series: seriesData
            }
        }

        function chart2(key, series) {
            return {
                xAxis: {
                    type: 'category',
                    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
                },
                legend: {
                    padding: 0,
                    itemGap: 0,
                    data: [' ', ' ']
                },
                grid: {
                    left: 50,
                    top: 6,
                    right: 5,
                    bottom: 20
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: value => $filter('moneyFormat')(value)
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: series => { return '' },
                    axisPointer: {
                        type: 'cross',
                        crossStyle: {
                            color: '#999'
                        }
                    }
                },
                series: [{
                    type: 'bar',
                    itemStyle: {
                        barBorderRadius: 4
                    },
                    data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 90000000))
                }]
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
                        type: 'cross',
                        crossStyle: {
                            color: '#999'
                        }
                    }
                },
                grid: {
                    left: 50,
                    top: 35,
                    right: 12,
                    bottom: 20
                },
                xAxis: {
                    scale: true,
                    max: 23,
                    axisLabel: {
                        formatter: '{value}h'
                    }
                },
                yAxis: {
                    show: false,
                    scale: true,
                    max: 3600,
                    // minInterval: 60,
                    axisLabel: {
                        formatter: value => {
                            console.log(value);
                            value = value % 60 == 0 ? (value / 60) + 'm' : value;
                            return value;
                        }
                    }
                },
                series:
                    [
                        {
                            type: 'effectScatter',
                            symbolSize: 5,
                            data: [
                                [21, 1543],
                                [12, 900]
                            ]
                        },
                        {
                            type: 'scatter',
                            data: data
                            // Array.from({ length: 350 }, () =>
                            //     [Math.floor(Math.random() * 25), Math.floor(Math.random() * 3600)]),
                        }]
            }
        }
    })
