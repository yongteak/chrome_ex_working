angular.module('app.controller.popup', [])
    .controller('popupController', function ($scope, $rootScope, $filter, $timeout, pounch, moment, indexer, CONFIG) {
        $scope.model = {
            usabilitys: [],
            usability: [],
            daytime_of_usaged: [],
            distribution_of_time_use: [],//Array(24).fill(0),
            cumulative_usage: [],
            cumulative_sum: { count: 0, dataUsage: 0, summary: 0 }
        };
        $scope.run = {
            init: () => {
                indexer.domain_by_day(build => {
                    var args = build.sort((a, b) => { return b.day - a.day })
                    $scope.run.start(args)
                });
            },
            start: args => {
                $scope.model.days =
                    Array(3).fill(0).map((_e, idx) => idx).reduce((a, b) => {
                        a.push(moment().add(-b, 'day').format("YYYYMMDD"));
                        return a;
                    }, []).reverse();
                var days = $scope.model.days;
                var daytime_of_usaged = $scope.model.daytime_of_usaged;
                var domains = args.reduce((a, b) => a.concat(b.url), []);

                domains = Array.from(new Set(domains));
                pounch.getdocs(domains).then(docs => {
                    var reduce1 = docs.results.reduce((acc, doc) => {
                        var code = doc.docs[0]['ok'].value.category_code;
                        code = code || '000';
                        var sum = { url: doc.id, categroy_code: code, count: 0, summary: 0, dataUsage: 0, rate: [0, 0, 0] };
                        doc.docs[0]['ok'].value.days
                            .filter(a => '' + a.date >= days[0] && a.date <= days[days.length - 1])
                            .forEach(e => {
                                var hdata = [];
                                e.hours.forEach((h, index) => {
                                    var daytime = '' + e.date + $filter('zeroAppend')(index);
                                    var daytime_index = hdata.map(m => m.daytime).indexOf(daytime);
                                    if (daytime < moment().format('YYYYMMDDH00')) {
                                        if (daytime_index == -1) {
                                            hdata.push({
                                                daytime: daytime,
                                                second: h.second,
                                                counter: h.counter,
                                                dataUsage: h.dataUsage
                                            });
                                        } else {
                                            hdata[daytime_index].second += h.second;
                                            hdata[daytime_index].counter += h.counter;
                                            hdata[daytime_index].dataUsage += h.dataUsage;
                                        }
                                    }
                                }); // hours
                                var dindex = daytime_of_usaged.map(m => m.date).indexOf(e.date);
                                if (dindex == -1) {
                                    daytime_of_usaged.push({ date: e.date, hdata: hdata });
                                } else {
                                    daytime_of_usaged[dindex].hdata.forEach(a => {
                                        var row = hdata.find(h => h.daytime == a.daytime);
                                        a.second += row.second;
                                        a.counter += row.counter;
                                        a.dataUsage += row.dataUsage;
                                    })
                                }
                                sum['dataUsage'] += e.dataUsage;
                                sum['summary'] += e.summary;
                                sum['count'] += e.counter;
                            });
                        sum.rate = 0
                        acc.push(sum);
                        return acc;
                    }, []);

                    var arr = days.reduce((acc, x) => {
                        var find = daytime_of_usaged.find(d => d.date == x);
                        // console.log(find);
                        if (find == undefined) {
                            var record = Array(24).fill(0);
                            acc[0].concat(record.reduce((a, b) => {
                                    a.push(x + $filter('zeroAppend')(b))
                                    return a;
                                }, []));
                            acc[1].concat(record);
                        } else {
                            acc[0] = acc[0].concat(find.hdata.map(m => m.daytime));
                            acc[1] = acc[1].concat(find.hdata.map(m => m.second));
                        }
                        return acc;
                    }, [[], []]);
                    const usability = reduce1;
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

                    console.log(arr);

                    $scope.model.chart = { 'option': chart(arr[0], arr[1]), 'click': null };
                });
            },
            openOptionsPage: () => {
                if (chrome.runtime.openOptionsPage) {
                    chrome.runtime.openOptionsPage();
                } else {
                    window.open(chrome.runtime.getURL('static/index.html'));
                }
            }
        }
        $scope.run.init();

        function chart(category, series) {
            return {
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
                                return e.axisDimension == 'x' ? $filter('fromDateFormat')(e.value, 'YYYYMMDDHH', 'MM월DD일H시')
                                    : $filter('secondToFormat')(e.value)
                            }
                        }
                    }
                },
                grid: {
                    left: 9,
                    top: 0,
                    right: 12,
                    bottom: 20
                },
                xAxis: {
                    type: 'category',
                    axisLabel: {
                        formatter: e => e % 21 ? $filter('fromDateFormat')(e, 'YYYYMMDDH', 'H시') : ''
                    },
                    data: category,//['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                },
                yAxis: {
                    type: 'value'
                },
                series: [{
                    data: series,//[120, 200, 150, 80, 70, 110, 130],
                    type: 'bar'
                }]
            }
        }
    })
