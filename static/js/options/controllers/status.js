angular.module('app.controller.status', [])
    .controller('statusController', function ($scope, $filter, $location, moment, storage, CONFIG) {
        $scope.model = {
            rows: [], todal_total_times: 0, summary: {},
            options: { category: [], date: [], times: [], series: [] },
            category_name: []
        };

        storage.getValue(CONFIG.STORAGE_TIMEINTERVAL_LIST, rows => {
            // 카테고리 메칭 todo cache
            console.log(000, rows);
            var sday = rows[0].day, eday = rows[rows.length - 1].day;
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
                    var cat_nm = tabs.find(s => s.url === row.domain).category_top;
                    summary.push({ domain: row.domain, day: row.day, category: cat_nm, times: acc });
                });
                // console.log(11111, summary);
                // category_sub을 키값으로 24시 데이터 sum
                // options: { category: [], times: [] }
                // var sum = {}; // category, value[]
                summary.forEach(data => {
                    if ($scope.model.summary.hasOwnProperty(data.category)) {
                        $scope.model.summary[data.category].times.forEach((_data1, index) => {
                            $scope.model.summary[data.category].times[index].value += data.times[index].value;
                        })
                    } else {
                        $scope.model.summary[data.category] = { times: data.times };
                        // $scope.model.category_name.push($filter('category_to_name')(data.category));
                        // console.log('111111',data.category);
                        // $scope.model.summary[$filter('category_to_name')(data.category)] = { times: data.times };
                    }
                });
                // console.log(Object.keys($scope.model.summary).forEach(e => $filter('category_to_name')(e)));
                // console.log(22222, $scope.model.summary);
            });
        });
        /*
        $scope.model.options.category;
        $scope.model.options.date;
        $scope.model.options.times;
        카테고리 목록['Direct', 'Mail Ad', 'Affiliate Ad', 'Video Ad', 'Search Engine']
        y축 데이터(시간 단위) data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        카테고리 데이터(목록과 같은 index) data: [320, 302, 301, 334, 390, 330, 320]
        */

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

            for (var p in $scope.model.summary) {
                $scope.model.options.series.push({
                    name: $filter('category_to_name')(p),
                    type: 'bar',
                    stack: 'total',
                    label: {
                        show: false
                    },
                    emphasis: { focus: 'series' },
                    data: $scope.model.summary[p].times
                });

                $scope.model.options.date = Array(24).fill(0).map((e, i) => i);
            };
            $scope.option = opt();
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
        // $scope.option = opt();//loadDataWithType(type);


        // $scope.change = function () {
        //     type = !type;
        //     $scope.option = opt();//loadDataWithType();
        //     console.log($scope.option)
        // }

        $scope.today();


        function opt() {
            return {
                toolbox: {
                    show: true,
                    feature: {
                        saveAsImage: {}
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    
                    // formatter: params => {
                        // console.log(params);
                        // return $filter('secondToFormat')(params[0].axisValueLabel, 'mm분ss초')
                        // return params.forEach(e => {
                        //     e.axisValueLabel = $filter('secondToFormat')(e.axisValueLabel, 'mm분ss초')
                        // })
                    // }
                },
                // grid: {
                //     containLabel: false
                // },
                legend: {
                    // data: Object.keys($scope.model.summary),
                    data: Object.keys($scope.model.summary).forEach(e => $filter('category_to_name')(e))
                    // formatter: name => {
                    //     return $filter('category_to_name')(name)
                    // }

                    // legend: {
                    //     show: props.legend ? true : false,
                    //     orient: 'horizontal',
                    //     x: 'left',
                    //     y: 'bottom',
                    //     formatter: props.legendValue ? function (name) {
                    //       let itemValue = data.filter(item => item.name === name)
                    //       return `${name}: ${itemValue[0].value}`
                    //   } : "{name}",
                    //     data: props.legend
                    //   }

                    // data: ['Direct', 'Mail Ad', 'Affiliate Ad', 'Video Ad', 'Search Engine']
                },
                grid: {
                    left: '10%',
                    right: '4%',
                    bottom: '10%',
                    containLabel: false
                },
                // itemStyle: {
                //     normal: {
                //         label: {
                //             show: false
                //         },
                //         labelLine: {
                //             show: false
                //         }
                //     }
                // },
                // yAxis: [
                //     {
                //       show: false,
                //       type: "log",
                //     }
                //   ],
                yAxis: {
                    type: 'value',
                    // min: 60,
                    axisLabel: {
                        formatter: value => $filter('secondToFormat')(value, 'mm분ss초')// '{value} Mbps'
                    }
                },
                xAxis: {
                    type: 'category',
                    data: $scope.model.options.date
                    // data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
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
