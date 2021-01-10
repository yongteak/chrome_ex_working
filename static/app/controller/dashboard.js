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
                // 30일 데이터만 수집?
                console.log(args);
                $scope.model.days =
                    Array(30).fill(0).map((_e, idx) => idx).reduce((a, b) => {
                        a.push(moment('' + args[0].day).add(-b, 'day').format("YYYYMMDD"));
                        return a;
                    }, []);
                var weeks = $scope.model.days.slice(0, 7).reverse()
                var monthly = $scope.model.days.reverse(); //Usability

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
                    var usability = docs.results.reduce((acc, doc) => {
                        // console.log(doc);
                        var sum = { url: doc.id, count: 0, summary: 0, dataUsage: 0, rate: [0, 0, 0] };
                        doc.docs[0]['ok'].value.days
                            .filter(a => '' + a.date >= monthly[0] && a.date <= monthly[monthly.length - 1])
                            .forEach(e => {
                                e.hours.forEach( (h,index) =>{
                                    if (h.second > 0) dotu.push([index,h.second])
                                })
                                sum['dataUsage'] += e.dataUsage;
                                sum['summary'] += e.summary;
                                sum['count'] += e.counter;
                            });
                        sum.rate = percent(sum.count * 10, sum.summary, sum.dataUsage / 1000000);//.join(',');
                        acc.push(sum);
                        return acc;
                    }, []);
                    // cache..
                    $scope.model.usabilitys = usability;
                    // console.log(usability);
                    // 시간 10분이상, 접속횟수 10회이상, 데이터 1MB 이상
                    $scope.model.usability = usability
                                .filter(a => a.count >= 1 && a.summary >= 60 && a.dataUsage >= 100)
                                .sort((a, b) => { return b.dataUsage - a.dataUsage }).slice(0, 5);
                    // 누적 사용량
                    $scope.model.cumulative_usage = usability
                        .sort((a, b) => { return b.summary - a.summary }).slice(0, 5);

                    $scope.model.cumulative_sum = $scope.model.cumulative_usage.reduce((acc, cur) => {
                        acc.count += cur.count;
                        acc.dataUsage += cur.dataUsage;
                        acc.summary += cur.summary;
                        return acc;
                    }, { count: 0, dataUsage: 0, summary: 0 });

                    // console.log($scope.model.cumulative_usage,$scope.model.cumulative_sum);
                    // 시간대별 주간 누적 사용시간 분포
                    // $scope.model.distribution_of_time_use
                    chart3($scope.model.distribution_of_time_use);
                    // [ [시간,값] .. ]
                    // console.log(usability);
                    // console.log(dotu)
                    // distribution_of_time_use

                    $scope.model.charts.times = { 'option': chart(weeks, reduce[0]), 'click': null };
                    $scope.model.charts.traffic = { 'option': chart(weeks, reduce[1]), 'click': null };
                    $scope.model.charts.count = { 'option': chart(weeks, reduce[2]), 'click': null };

                    $scope.model.charts.scatter = { 'option': chart3($scope.model.distribution_of_time_use), 'click': null };
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

        function chart(days, data) {
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
                series: [{
                    data: data,
                    // Array.from({ length: 7 }, () => Math.floor(Math.random() * 500)),
                    type: 'line',
                    symbolSize: 0,
                    smooth: true,
                    lineStyle: {
                        color: '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        width: 3
                    }
                }]
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
