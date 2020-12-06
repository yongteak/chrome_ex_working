// https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/%EC%95%A0%EB%A1%9C%EC%9A%B0_%ED%8E%91%EC%85%98
// function를 생락하고 '=>' 기호 사용하지 말것
// https://stackoverflow.com/questions/47696945/over-function-throwing-me-an-angular-error

angular.module('app.controllers', [])
    .controller('side', ($scope, $location) => {
        $scope.isCurrentPath = path => {
            return $location.path().indexOf(path) != -1;
        };
    })
    .controller('view', $scope => {
        // $scope.count = 0;
        console.log("view!");

        $scope.init = () => {
            console.log("view > init!");
        }
    })
    .controller('settingController', function ($scope, $location, $filter, identity, storage, CONFIG) {
        // 추적 금지 목록 조회
        // console.log(CONFIG);
        var today = $filter('formatDate')();
        $scope.model = {
            domains: [],
            domain: null
        }

        function getDomain() {
            storage.getValue(CONFIG.IGNORED_DOMAINS_LIST, e => {
                if (e) {
                    $scope.model.domains = e.sort((a, b) => { return b.epoch - a.epoch });
                }
                $scope.$apply();
            });
        }

        $scope.clear = function () {
            storage.saveValue(CONFIG.IGNORED_DOMAINS_LIST, null);
            console.log('clear domains');
        }

        $scope.remove = function (row) {
            if (confirm('삭제하시겠습니까?')) {
                var list = $scope.model.domains;
                const index = list.findIndex(function (item) {
                    return item.epoch === row.epoch;
                });

                if (index !== -1) {
                    list.splice(index, 1);
                } else {
                    // throw error
                }

                storage.saveValue(CONFIG.IGNORED_DOMAINS_LIST, $scope.model.domains);
                getDomain();

            } else {
                //
            }
            // console.log(row);
        }

        $scope.enabledChange = function (row) {
            var list = $scope.model.domains;
            const index = list.findIndex(function (item) {
                return item.epoch === row.epoch;
            });
            list[index].enabled = row.enabled;
            storage.saveValue(CONFIG.IGNORED_DOMAINS_LIST, $scope.model.domains);
            getDomain();
        }

        $scope.add_domain = function () {
            var list = $scope.model.domains;
            var find_domain = list.find(s => s.domain == $scope.model.domain);
            var isNewDomain = find_domain == undefined;
            if (!isNewDomain) {
                alert('이미 등록된 도메인 입니다.')
                return;
            }
            var model = {
                domain: $scope.model.domain,
                created: isNewDomain ? today : find_domain.created,
                updated: today,
                epoch: isNewDomain ? moment().valueOf() : find_domain.epoch,
                enabled: true
            };

            // 동일한 데이터가 있는경우 제거후 추가
            // if (!isNewDomain) {
            //     const index = list.findIndex(function (item) {
            //         return item.domain === $scope.model.domain;
            //     });
            //     if (index !== -1) {
            //         list.splice(index, 1);
            //     } else {
            //         // throw error
            //     }
            // }
            $scope.model.domains.push(model);
            storage.saveValue(CONFIG.IGNORED_DOMAINS_LIST, $scope.model.domains);
            getDomain();
            $scope.model.domain = null;
        }

        getDomain();
    })
    .controller('limitController', function ($scope, $location) {
    })
    .controller('alarmController', function ($scope, $location) {
    })
    .controller('dataController', function ($scope, $location) {
    })
    .controller('syncController', function ($scope, $location) {
    })
    .controller('statusController', function ($scope, $filter, $location, moment, storage, CONFIG) {
        $scope.model = { rows: [], todal_total_times: 0 };
        $scope.all = function () {
            $scope.model.todal_total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                rows.forEach(e => {
                    e.part = {
                        counter: e.counter,
                        dataUsage: e.dataUsage,
                        summary: e.summaryTime
                    }
                    $scope.model.todal_total_times += e.part.summary;
                });
                // var today = $filter('formatDate')();
                // var targetTabs = rows.filter(x => x.days.find(s => s.date === today));
                // targetTabs.forEach(e => {
                //     e.part = e.days.filter(x => x.date == today)[0];
                //     $scope.model.todal_total_times += e.part.summary;
                // });
                // targetTabs = targetTabs.sort(function(a, b) {
                //     return b.days.find(s => s.date === today).summary - a.days.find(s => s.date === today).summary;
                // });
                rows = rows.sort(function (a, b) {
                    return b.part.summary - a.part.summary;
                });
                $scope.model.rows = rows;
                // console.log(rows);
                $scope.$apply();
                // console.log($scope.model.today);
                // 오늘날짜만 뽑기 또는 최근 마지막 날짜 뽑기

            })
        }
        $scope.today = function () {
            $scope.model.todal_total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                var today = $filter('formatDate')();
                var targetTabs = rows.filter(x => x.days.find(s => s.date === today));
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
    .controller('profileController', function ($scope, $location) {
    })
    .controller('aboutController', function ($scope, $location) {
    })
