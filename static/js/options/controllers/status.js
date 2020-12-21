angular.module('app.controller.status', [])
    .controller('statusController', function ($scope, $filter, $location, moment, storage, CONFIG) {
        $scope.model = { rows: [], todal_total_times: 0 };
        // time_interval 목록 조회
        //         var arr = [];
        //         var arr1 = [];
        //         ["13:46:3-13:46:8"
        // ,"13:47:46-13:48:45"
        // ,"13:55:38-13:56:22"
        // ,"13:56:37-20:57:2"
        // ,"21:16:7-21:16:11"
        // ,"21:17:30-21:18:1"
        // ,"21:33:6-21:39:51"
        // ,"21:40:12-21:40:12"
        // ,"21:58:6-21:58:9"
        // ,"21:58:20-21:58:22"
        // , "21:58:32-21:58:43"
        // , "22:4:44-22:4:46"
        // , "22:4:46-22:5:1"
        // , "22:27:10-22:27:13"
        // , "22:35:16-22:35:18"
        // , "22:35:25-22:35:31"
        // , "22:35:40-22:35:52"
        // , "22:36:53-22:37:6"].forEach(t => {
        //     var res = $filter('hmsToSeconds')(t);
        //     res.forEach(r => arr1.push(r));
        // });


        // var acc = [];
        // Array(24).fill(0).map((e,i)=>i).forEach(t => {
        //     var elem = arr1.filter(a => { return a.hour == t });
        //     if (elem.length > 0) {
        //         var sum = 0;
        //         elem.forEach(el => sum += el.value);
        //         acc.push({hour:t, value:sum});
        //     } else {
        //         acc.push({hour:t, value:0});
        //     }
        // })

        storage.getValue(CONFIG.STORAGE_TIMEINTERVAL_LIST, rows => {
            // 카테고리 메칭 todo cache
            storage.getValue(CONFIG.STORAGE_TABS, tabs => {
                var summary = [];
                rows.forEach(row => {
                    var acc = [], arr1 = [];
                    row.intervals.forEach(item => $filter('hmsToSeconds')(item).forEach(r => arr1.push(r)));
                    Array(24).fill(0).map((e, i) => i).forEach(t => {
                        var elem = arr1.filter(a => { return a.hour == t });
                        if (elem.length > 0) {
                            var sum = 0;
                            elem.forEach(el => sum += el.value);
                            acc.push({ hour: t, value: sum });
                        } else {
                            acc.push({ hour: t, value: 0 });
                        }
                    })
                    var cat_nm = tabs.find(s => s.url === row.domain).category_sub;
                    summary.push({ domain: row.domain, day: row.day, category: cat_nm, times: acc });
                });
                // console.log(11111, summary);
                // category_sub을 키값으로 24시 데이터 sum
                var sum = {}; // category, value[]
                summary.forEach(data => {
                    if (sum.hasOwnProperty(data.category)) {
                        sum[data.category].times.forEach((_data1, index) => {
                            // console.log(data.times[index]);
                            sum[data.category].times[index].value += data.times[index].value;
                        })
                    } else {
                        sum[data.category] = { times: data.times };
                    }
                })
                console.log(22222, sum);
            })
        });


        $scope.all = function () {
            $scope.model.todal_total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                console.log(1111, rows);
                rows.forEach(e => {
                    e.part = {
                        counter: e.counter,
                        dataUsage: e.dataUsage,
                        summary: e.summaryTime
                    }
                    $scope.model.todal_total_times += e.part.summary;
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
            $scope.model.todal_total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                var today = $filter('formatDate')();
                var targetTabs = rows.filter(x => x.days.find(s => s.date === today));
                console.log(today, targetTabs);
                targetTabs.forEach(e => {
                    e.part = e.days.filter(x => x.date == today)[0];
                    $scope.model.todal_total_times += e.part.summary;
                });
                targetTabs = targetTabs.sort(function (a, b) {
                    return b.days.find(s => s.date === today).summary - a.days.find(s => s.date === today).summary;
                });
                $scope.model.rows = targetTabs;
                $scope.$apply();
                // console.log($scope.model.today);
                // 오늘날짜만 뽑기 또는 최근 마지막 날짜 뽑기
            });
        }

        var now = moment().endOf('day').toDate();
        var time_ago = moment().startOf('day').subtract(10, 'year').toDate();
        $scope.example_data = d3.time.days(time_ago, now).map(function (dateElement, index) {
            return {
                date: dateElement,
                details: Array.apply(null, new Array(Math.round(Math.random() * 15))).map(function (e, i, arr) {
                    return {
                        'name': 'Project ' + Math.ceil(Math.random() * 10),
                        'date': function () {
                            var projectDate = new Date(dateElement.getTime());
                            projectDate.setHours(Math.floor(Math.random() * 24))
                            projectDate.setMinutes(Math.floor(Math.random() * 60));
                            return projectDate;
                        }(),
                        'value': 3600 * ((arr.length - i) / 5) + Math.floor(Math.random() * 3600) * Math.round(Math.random() * (index / 365))
                    }
                }),
                init: function () {
                    this.total = this.details.reduce(function (prev, e) {
                        return prev + e.value;
                    }, 0);
                    return this;
                }
            }.init();
        });

        // Set custom color for the calendar heatmap
        $scope.color = '#790C90';

        // Set overview type (choices are year, month and day)
        $scope.overview = 'year';
        $scope.tooltip = true;

        // Handler function
        $scope.print = function (val) {
            console.log(val);
        };

        $scope.over = function (val) {
            // console.log("over@", val);
            // console.log($scope.example_data);
        };

        var type = false;
        $scope.option = loadDataWithType(type);


        $scope.change = function () {
            type = !type;
            $scope.option = loadDataWithType(type);
            console.log($scope.option)
        }

        $scope.today();

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
