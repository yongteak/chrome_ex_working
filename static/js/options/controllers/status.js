angular.module('app.controller.status', [])
    .controller('statusController', function ($scope, $filter, $location, $http, moment, storage, CONFIG) {
        Array.prototype.sum = function () { return [].reduce.call(this, (a, i) => a + i.value, 0); }
        moment.locale('ko');
        $scope.model = {
            rows: [], todal_times: 0, summary: {}, interval_summary: [],
            options: { category: [], date: [], times: [], series: [] },
            times: { today: null, hours: [], weeks: [] },
            show_full_list: true,
            show_limit_list: false
        };
        $scope.param = null;

        $scope.run = {
            init: () => {
                console.log('^init');
                console.log('# 주간 날짜 생성');
                Array.apply(null, Array(7)).map(function (_, i) {
                    $scope.model.times.weeks.push(moment().clone().startOf('week').add(i, 'days').format("YYYYMMDD"));
                });
                // console.log('# 23시간 생성');
                console.log('# interval 데이터 수집');
                storage.getValue(CONFIG.STORAGE_TIMEINTERVAL_LIST, rows => {
                    // console.log(rows);
                    // const today = 20201223;
                    // rows = rows.filter(iv => { return iv.day == today });
                    storage.getValue(CONFIG.STORAGE_TABS, tabs => {
                        $scope.interval_summary = [];
                        rows.forEach((row, i, a) => {
                            var acc = [], arr1 = [];
                            // 시간 변환
                            row.intervals
                                .forEach(item => $filter('hmsToSeconds')(item)
                                    .forEach(r => { arr1.push(r) })
                                );
                            // 0-23시 기준으로 sum
                            Array(24).fill(0).map((e, i) => i).forEach(t => {
                                var sum = arr1
                                    .filter(a => { return a.hour == t })
                                    .reduce((a, b) => a + b.value, 0);
                                acc.push({ hour: t, value: sum });
                            });

                            var cat_nm = tabs.find(s => s.url === row.domain).category_top;
                            $scope.interval_summary.push({
                                domain: row.domain,
                                day: row.day,
                                category: cat_nm,
                                times: acc
                            });
                            // if (row.domain == 'docs.google.com') {
                            //     console.log('docs', row.day, $scope.interval_summary);
                            // }

                            if (i == a.length - 1) {
                                $scope.run.setup();
                            }
                        });
                    });
                });
            },
            setup: () => {
                console.log("^setup");
                const copy = JSON.parse(JSON.stringify($scope.interval_summary));
                $scope.model.summary = copy.reduce((prev, cur) => {
                    let existing = prev.find(x => x.category === cur.category && x.day === cur.day);
                    if (existing) {
                        existing.times += cur.times.reduce((a, b) => a + b.value, 0)
                    } else {
                        prev.push({
                            category: cur.category, day: cur.day, times: 0
                        });
                    }
                    return prev;
                }, []);
                console.log('# day 차트 데이터 생성');
                // console.log('$scope.model.summary',$scope.model.summary);
                $scope.model.summary.forEach(e => {
                    var fill = new Array($scope.model.times.weeks.length - 1).fill(0);
                    var idx = $scope.model.times.weeks.indexOf('' + e.day);
                    idx = idx == -1 ? 0 : idx;
                    fill.splice(idx, 0, e.times);
                    $scope.model.options.series.push({
                        name: e.category + '|' + $filter('category_to_name')(e.category),
                        data: fill, type: 'bar', stack: 'total',
                        label: { show: false },
                        emphasis: { focus: 'series' }
                    });
                });
            },
            charts: () => {
                console.log('# opt1 차트 데이터 적용');
                // var gen_opt = opt1();
                $scope.param = {
                    // 24시간
                    // $scope.model.options.series
                    'option': opt1(), 'click': e => {
                        // 날짜정보가 없는경우 해당 시간대의 모든 카테고리에 해당하는 도메인 조회
                        // var req_kv = {,value:e.seriesName.hour};
                        const filter = e.seriesName.split('|')[0];
                        const hour = e.data.hour;
                        // console.log(hour,filter,$scope.interval_summary);
                        $scope.model.rows = $scope.interval_summary
                            .filter(item => item.category === filter)
                            .filter(t => t.times[hour].value > 0);
                        $scope.model.rows.forEach(h => h['seconds'] = h.times[hour].value);
                        $scope.model.rows.sort(function (a, b) {
                            return b.seconds - a.seconds;
                        });
                        // console.log(hour$scope.model.rows);
                        $scope.model.show_full_list = false;
                        $scope.model.show_limit_list = !$scope.model.show_full_list;
                        $scope.$apply();
                    }
                };
            },
            info: row => {
                $http({
                    url: "http://localhost:8080/api/v1/analytics/data?domain=" + row.domain,
                    method: "GET"
                }).finally(function () {

                }).then(function (response) {
                    response = response.data;
                    console.log(response);
                    if (response.result_msg == "STATUS_NORMAL") {

                    } else {

                    }
                }, function (response) {
                    console.log('ERROR')
                });
            }
        }

        $scope.run.init();



        $scope.all = function () {
            $scope.model.total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                rows.forEach(e => {
                    e.part = {
                        counter: e.counter,
                        dataUsage: e.dataUsage,
                        summary: e.summaryTime
                    }
                    $scope.model.total_times += e.part.summary;
                });
                rows = rows.sort(function (a, b) {
                    return b.part.summary - a.part.summary;
                });
                $scope.model.rows = rows;
                // console.log(rows);
                $scope.$apply();
            })
        }
        $scope.today = function () {
            $scope.run.charts();
            return;
            $scope.model.total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                var today = $filter('formatDate')();
                var targetTabs = rows.filter(x => x.days.find(s => s.date === today));
                // console.log(today, targetTabs);
                targetTabs.forEach(e => {
                    e.part = e.days.filter(x => x.date == today)[0];
                    $scope.model.total_times += e.part.summary;
                });
                targetTabs = targetTabs.sort(function (a, b) {
                    return b.days
                        .find(s => s.date === today).summary - a.days
                            .find(s => s.date === today).summary;
                });
                $scope.model.rows = targetTabs;
                $scope.$apply();
            });
        }

        var now = moment().endOf('day').toDate();
        var time_ago = moment().startOf('day').subtract(10, 'year').toDate();

        function opt1() {
            // [2020-12-23 14:29:27]
            // 차트 조건만큼 데이터 미리 생성후 binding처리 필요
            return {
                toolbox: {
                    show: true,
                    feature: {
                        saveAsImage: {}
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: series => {
                        let tooltip = '';
                        let sum = 0;
                        const [firstSeries] = series;
                        const title = moment(firstSeries.axisValue).format('YY년MM월DD일')

                        series.forEach(s => {
                            sum += s.value;
                            s.seriesName = s.seriesName.split('|')[1];
                            s.value = s.value > 60 ? $filter('secondToFormat')(s.value, s.value >= 3600 ? 'HH시간mm분' : 'mm분ss초') : s.value == 0 ? '-' : s.value + '초';
                            if (s.value != '-')
                                tooltip += `<div>${s.marker} ${s.seriesName}: <code>${s.value}</code></div>`;
                        });
                        sum = sum > 60 ? $filter('secondToFormat')(sum, sum >= 3600 ? 'hh시간mm분' : 'mm분ss초') : sum == 0 ? '' : sum + '초';
                        tooltip = `<div><h5><b>#${title} </b><code><u>${sum}</u></code></h5></div>` + tooltip;
                        return tooltip;
                    }
                },
                legend: {
                    data: Object.keys($scope.model.summary).forEach(e => e + '|' + $filter('category_to_name')(e)),
                    formatter: name => {
                        return name.split('|')[1];
                    }
                },
                grid: {
                    left: '10%',
                    right: '4%',
                    bottom: '10%',
                    containLabel: false
                },
                yAxis: {
                    type: 'value',
                    max: 3600 * 24,
                    axisLabel: {
                        formatter: value => value < (3600 * 24) - 1 ? $filter('secondToFormat')(value, 'HH시mm분'):'24시00분'
                    }
                },
                xAxis: {
                    type: 'category',
                    data: $scope.model.times.weeks,
                    axisLabel: {
                        formatter: value => moment(value).format('ddd')
                    }
                },
                series: $scope.model.options.series
            }
        }

        function opt() {
            // [2020-12-23 14:29:27]
            // 차트 조건만큼 데이터 미리 생성후 binding처리 필요
            return {
                toolbox: {
                    show: true,
                    feature: {
                        saveAsImage: {}
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: series => {
                        let tooltip = '';
                        let sum = 0;
                        const [firstSeries] = series;
                        const title = firstSeries.axisValue + '시'

                        series.forEach(s => {
                            sum += s.value;
                            s.seriesName = s.seriesName.split('|')[1];
                            s.value = s.value > 60 ? $filter('secondToFormat')(s.value, s.value >= 3600 ? 'HH시간mm분ss초' : 'mm분ss초') : s.value == 0 ? '-' : s.value + '초';
                            if (s.value != '-')
                                tooltip += `<div>${s.marker} ${s.seriesName}: <code>${s.value}</code></div>`;
                        });
                        sum = sum > 60 ? $filter('secondToFormat')(sum, sum >= 3600 ? 'HH시간mm분ss초' : 'mm분ss초') : sum == 0 ? '' : sum + '초';
                        tooltip = `<div><h5><b>#${title} </b><code><u>${sum}</u></code></h5></div>` + tooltip;
                        return tooltip;
                    }
                },
                legend: {
                    data: Object.keys($scope.model.summary).forEach(e => e + '|' + $filter('category_to_name')(e)),
                    formatter: name => {
                        return name.split('|')[1];
                    }
                },
                grid: {
                    left: '10%',
                    right: '4%',
                    bottom: '10%',
                    containLabel: false
                },
                yAxis: {
                    type: 'value',
                    max: 3600,
                    axisLabel: {
                        formatter: value => $filter('secondToFormat')(value, value >= 3600 ? 'HH시mm분' : 'mm분ss초')// '{value} Mbps'
                    }
                },
                xAxis: {
                    type: 'category',
                    data: Array(24).fill(0).map((e, i) => i)
                },
                series: $scope.model.options.series
            }
        }

        function loadDataWithType(type) {
            if (type) {
                return {
                    title: {
                        text: '堆叠区域图'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis: [{
                        type: 'category',
                        boundaryGap: false,
                        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日', "12"]
                    }],
                    yAxis: [{
                        type: 'value'
                    }],
                    series: [{
                        name: '搜索引擎',
                        type: 'line',
                        stack: '总量',
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        areaStyle: { normal: {} },
                        data: [820, 932, 901, 934, 1290, 1330, 1320, 333]
                    }]
                };
            }
            return {
                title: {
                    text: '某站点用户访问来源',
                    subtext: '纯属虚构',
                    x: 'center'
                },

                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    show: false,
                    orient: 'vertical',
                    left: 'left',
                    data: ['直接访问', '邮件营销', '联盟广告', '视频广告', '搜索引擎']
                },
                series: [{
                    name: '访问来源',
                    type: 'pie',
                    radius: '55%',
                    center: ['50%', '60%'],
                    data: [
                        { value: 335, name: '直接访问' },
                        { value: 310, name: '邮件营销' },
                        { value: 234, name: '联盟广告' },
                        { value: 135, name: '视频广告' },
                        { value: 1548, name: '搜索引擎' }
                    ],
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };
        }
    })
