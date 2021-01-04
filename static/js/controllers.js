angular.module('app.controllers', [])
    .controller('app', function ($scope, $filter, $timeout, storage, moment, CONFIG) {
        moment.locale(window.navigator.language.split('-')[0]);
        console.log(moment().subtract(3, 'days').calendar());

        $scope.model = {
            rows: [], todal_times: 0, summary: {}, interval_summary: [],
            charts: {
                day: { category: [], date: [], times: [], series: [], title: '' },
                time: { category: [], date: [], times: [], series: [] },
            },
            totals: { times: 0, dataUsage: 0, counter: 0 },
            times: { today: null, hours: [], weeks: [] },
            show_full_list: true,
            show_limit_list: false,
            modal: {}
        };
        $scope.param = null;
        $scope.param1 = null;

        var week_of_start = moment().startOf('week').format("YYYYMMDD");
        var week_of_end = moment(week_of_start).endOf('week').format("YYYYMMDD");
        var diff = moment(week_of_end).diff(moment(week_of_start), 'days') + 1;
        for (var i = 0; i < diff; i++) {
            $scope.model.times.weeks.push(moment(week_of_start).add(i, 'day').format("YYYYMMDD"));
        }

        $scope.run = {
            init: () => {
                console.log('^init');
                console.log('# 주간 날짜 생성');
                storage.getValue(CONFIG.STORAGE_TABS, tabs => {
                    console.log('tabs', tabs);
                    console.log('weeks', $scope.model.times.weeks);
                    $scope.interval_summary = [];
                    tabs = tabs.filter(x => x.days.find(s => $scope.model.times.weeks.includes('' + s.date)));
                    tabs.forEach((tab, i, a) => {
                        tab.days.forEach((t1, _i, _a) => {
                            $scope.interval_summary.push({
                                domain: tab.url,
                                day: t1.date,
                                category: tab.category_top,
                                times: t1.hours
                            });
                        });
                        if (i == a.length - 1) {
                            $scope.run.setup();
                        }
                    });
                })
            },
            setup: () => {
                console.log("^setup");
                const copy = JSON.parse(JSON.stringify($scope.interval_summary));
                $scope.model.charts.day.series = [];
                $scope.model.summary = copy.reduce((prev, cur) => {
                    let existing = prev.find(x => x.category === cur.category && x.day === cur.day);
                    if (existing) {
                        existing.times += cur.times.reduce((a, b) => a + b.second, 0)
                    } else {
                        prev.push({
                            category: cur.category, day: cur.day, times: cur.times.reduce((a, b) => a + b.second, 0)
                        });
                    }
                    return prev;
                }, []);
                console.log('# day 차트 데이터 생성');
                console.log('summary', $scope.model.summary);
                $scope.model.summary.forEach(e => {
                    var fill = new Array($scope.model.times.weeks.length - 1).fill(0);
                    var idx = $scope.model.times.weeks.indexOf('' + e.day);
                    idx = idx == -1 ? 0 : idx;
                    fill.splice(idx, 0, e.times);
                    // scope.model.charts.day | time
                    $scope.model.charts.day.series.push({
                        name: e.category + '|' + $filter('category_to_name')(e.category),
                        data: fill, type: 'bar', stack: 'total',
                        label: { show: false },
                        animationDelay: function (idx) {
                            return idx * 250;
                        },
                        // [2020-12-25 02:01:26]
                        // 카테고리별 고정 컬러 정의 고려
                        // itemStyle: {
                        //     normal: {
                        //     color: 'rgba(237,125,49, 0.8)',
                        //     }
                        // },

                        animationEasingUpdate: "linear",
                        emphasis: { focus: 'none' }
                    });
                });
                // console.log('$scope.model.summary',$scope.model.summary);
                // [2020-12-27 07:16:10]
                // 주간의 오늘날짜 index값으로 나누기(화요일인경우 2)
                // const average = $scope.model.summary.reduce((a, b) => a + b.times, 0) / moment().weekday()+1;//0일,1월,2화..
                var av = $scope.model.summary.reduce((a, b) => a + b.times, 0);
                var wd = moment().weekday() + 1;
                const average = av / wd; // 그냥은 안됌?

                $scope.model.charts.day.series.push({
                    // https://echarts.apache.org/next/en/option.html#series-line.markLine
                    // 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none'
                    type: 'line',
                    markLine: {
                        symbol: 'none',
                        label: { formatter: '' },
                        lineStyle: {
                            type: 'dashed',
                        },
                        data: [{ name: '평균', yAxis: average }],
                    }
                });
                // 주간 차트 실행
                $timeout(function () { $scope.run.charts() }, 0.2 * 1000);
            },
            charts: () => {
                console.log('# opt1 차트 데이터 적용');
                $scope.param = { 'option': opt1(), 'click': $scope.run.charts1 };
                // console.log($scope.model.charts.day.series[0]);
                $scope.run.charts1({ name: moment().format('YYYYMMDD') });
            },
            charts1: (e) => {
                console.log(e);
            }
        }

        $scope.run.init();


        function opt1() {
            return {
                title: {
                    show: false,
                    text: $scope.model.charts.day.title,
                    textStyle: {
                        fontWeight: 'normal',
                        color: "#AEADB2",
                        fontSize: 14,
                    },
                    subtext: '2시간 9분',
                    subtextStyle: {
                        fontWeight: 'bolder',
                        fontSize: 20,
                        color: "#333",
                        fontFamily: 'sans-serif'

                    }
                },
                toolbox: {
                    show: false,
                    feature: {
                        saveAsImage: {}
                    }
                },
                tooltip: { show: false },
                legend: {
                    show: false,
                    avoidLabelOverlap: true,
                    data: Object.keys($scope.model.summary).forEach(e => e + '|' + $filter('category_to_name')(e)),
                    formatter: name => {
                        return name.split('|')[1];
                    }
                },
                grid: {
                    left: '0%',
                    right: '20%',
                    bottom: '10%',
                    containLabel: false
                },
                yAxis: {
                    position: 'right',
                    type: 'value',
                    minInterval:3600,
                    axisLabel: {
                        // 1시간 기준으로 0h 1h 2h.. 나머지는 공백으로
                        // formatter: value => {
                            // return value % 60 == 0 ? (value/60)+1+'m' : '';
                            // return value % 3600 == 0 ? (value/3600)+1+'h' : '';
                        // }
                        formatter: value => value % 3600 == 0 ? (value/3600) + 'h' : ''
                        // formatter: value => value < (3600 * 24) - 1 ? $filter('secondToFormat')(value, 'HH시mm분') : '24시00분'
                    }
                },
                xAxis: {
                    type: 'category',
                    data: $scope.model.times.weeks,
                    axisLabel: {
                        formatter: value => moment(value).format('ddd')
                    }
                },
                series: $scope.model.charts.day.series
            }
        }
    });