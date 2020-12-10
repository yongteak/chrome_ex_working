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
        var today = $filter('formatDate')();
        $scope.model = {
            domains: [],
            domain: null
        }

        function getDomain() {
            storage.getValue(CONFIG.STORAGE_BLACK_LIST, e => {
                e = $filter('clean')(e);
                if (e) {
                    $scope.model.domains = e.sort((a, b) => { return b.epoch - a.epoch });
                }
                console.log(e);

                $scope.$apply();
            });
        }

        $scope.clear = function () {
            storage.saveValue(CONFIG.STORAGE_BLACK_LIST, null);
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

                storage.saveValue(CONFIG.STORAGE_BLACK_LIST, $filter('clean')($scope.model.domains));
                getDomain();

            } else {
                //
            }
        }

        $scope.enabledChange = function (row) {
            var list = $scope.model.domains;
            const index = list.findIndex(function (item) {
                return item.epoch === row.epoch;
            });
            list[index].enabled = row.enabled;
            storage.saveValue(CONFIG.STORAGE_BLACK_LIST, $filter('clean')($scope.model.domains));
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
            storage.saveValue(CONFIG.STORAGE_BLACK_LIST, $filter('clean')($scope.model.domains));
            getDomain();
            $scope.model.domain = null;
        }

        getDomain();
    })
    .controller('limitController', function ($scope, $location, $filter, identity, storage, CONFIG) {
        var today = $filter('formatDate')();
        $scope.model = {
            is_new: true,
            title: null,
            domains: [],
            history: [],
            copy_modal: {},
            modal: {
                time_start: '08:00',
                time_end: '17:00',
                count: 0,
                domain: null,
                created: today,
                updated: today,
                epoch: null,//moment().valueOf(),
                enabled: true
            }
        };
        $scope.run = {
            open_modal: row => {
                // console.log(row);
                if (row == undefined) {
                    $scope.run.init_modal();
                } else {
                    $scope.model.copy_modal = angular.copy(row);
                }
                $scope.model.is_new = row == undefined;
                $scope.model.title = "사용제한 도메인"
            },
            enabledChange: row => {
                var list = $scope.model.domains;
                const index = list.findIndex(item => {
                    return item.epoch === row.epoch;
                });
                list[index].enabled = row.enabled;
                storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                $scope.run.getDomain();
            },
            modalClose: () => {
                $('#domainModal').modal("hide");
            },
            export_csv: () => {
                console.log('export_csv!');
                // storage.saveValue(CONFIG.STORAGE_RESTRICTION_ACCESS_LIST, null);
            },
            remove_domain: () => {
                if (confirm('삭제하시겠습니까?')) {
                    var row = $scope.model.copy_modal;
                    var list = $scope.model.domains;
                    const index = list.findIndex(item => {
                        return item.epoch === row.epoch;
                    });

                    if (index !== -1) {
                        list.splice(index, 1);
                    } else {
                        // throw error
                        console.log('error! 삭제할 데이터가 없다!!');
                    }

                    storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                    $scope.run.getDomain();
                    $('#domainModal').modal("hide");
                } else {
                    //
                }
            },
            update_domain: () => {
                var list = $scope.model.domains;
                var modal = $scope.model.copy_modal;

                if ($filter('isEmpty')(modal.domain)) {
                    alert('도메인을 입력해주세요.');
                    return;
                }

                var a = $filter('hhmmStrToNumber')(modal.time_start);
                var b = $filter('hhmmStrToNumber')(modal.time_end);
                if (a >= b) {
                    alert("시작 시간은 종료 시간보다 이전 시간으로 설정해야 합니다.");
                    return;
                }
                var find_domain = list.find(s => s.epoch == modal.epoch);
                if (find_domain == undefined) {
                    alert('항목을 수정할 수 없습니다.')
                } else {
                    for (var p in modal) {
                        find_domain[p] = modal[p];
                    }
                    storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                    // init_modal();
                    $scope.model.copy_modal = null;
                    $scope.run.getDomain();
                }
                $('#domainModal').modal("hide");
            },
            add_domain: () => {
                var list = $scope.model.domains;
                var modal = $scope.model.modal;

                if ($filter('isEmpty')(modal.domain)) {
                    alert('도메인을 입력해주세요.');
                    return;
                }

                var a = $filter('hhmmStrToNumber')(modal.time_start);
                var b = $filter('hhmmStrToNumber')(modal.time_end);
                if (a >= b) {
                    alert("시작 시간은 종료 시간보다 이전 시간으로 설정해야 합니다.");
                    return;
                }
                // console.log(modal);
                var find_domain = list.find(s => s.domain == modal.domain);
                var isNewDomain = find_domain == undefined;
                if (!isNewDomain) {
                    alert('이미 등록된 도메인 입니다.')
                    return;
                }
                modal.created = isNewDomain ? today : find_domain.created;
                modal.updated = today;
                modal.count = 0;
                modal.epoch = isNewDomain ? moment().valueOf() : find_domain.epoch;
                modal.enabled = true;

                $scope.model.domains.push(modal);
                // console.log($scope.model);
                storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                $scope.run.init_modal();
                $scope.run.getDomain();
                // 창닫기
                $('#domainModal').modal("hide");
            },
            init_modal: () => {
                $scope.model.modal = {
                    time_start: '08:00',
                    time_end: '17:00',
                    count: 0,
                    domain: null,
                    created: today,
                    updated: today,
                    epoch: null,//moment().valueOf(),
                    enabled: true
                }
            },
            getDomain: () => {
                storage.getValue(CONFIG.STORAGE_RESTRICTION_ACCESS_LIST, e => {
                    console.log(e);
                    e = JSON.parse(angular.toJson(e));
                    if (e) {
                        $scope.model.history = e.sort((a, b) => { return b.epoch - a.epoch });
                    }
                    $scope.$apply();
                });

                storage.getValue(CONFIG.STORAGE_RESTRICTION_LIST, e => {
                    e = JSON.parse(angular.toJson(e));
                    if (e) {
                        $scope.model.domains = e.sort((a, b) => { return b.epoch - a.epoch });
                    }
                    // console.log(e);
                    $scope.$apply();
                });
            }
        };
        $scope.run.getDomain();

    })
    .controller('syncController', function ($scope, $location) {
    })
    .controller('dataController', function ($scope, $location) {
    })
    .controller('alarmController', function ($scope, $location, $filter, $interval, identity, storage, CONFIG) {
        var today = $filter('formatDate')();
        $scope.model = {
            is_new: true,
            title: '알람 설정 추가하기',
            alarms: [],
            history: [],
            copy_modal: {},
            options:[
                {name:'화면 정중앙',id:'center'},
                {name:'화면 상단',id:'top'},
                {name:'화면 하단',id:'bottom'},
                {name:'화면 전환',id:'move'}
            ],
            select:"center",
            modal: {
                title: null,
                type: 'time',// time, data
                value: 3,// hours, MegaByte
                remind: true,
                repeat: false,
                position: 'center',//top, bottom
                message: '오늘은 여기까지! 조금 쉬도록 하세요~',
                count: 0,
                created: today,
                updated: today,
                epoch: null,
                enabled: true
            },
            
        };
        // console.log($scope.model.select);
        $scope.run = {
            init_modal: () => {
                $scope.model.modal = {
                    title: null,
                    type: 'time',// time, data
                    value: 5,// hours, MegaByte
                    remind: true,
                    repeat: false,
                    position: 'center',//top, bottom
                    message: '오늘은 여기까지! 조금 쉬도록 하세요~',
                    count: 0,
                    created: today,
                    updated: today,
                    epoch: null,
                    enabled: true
                }
                // console.log('init > ',$scope.model.modal);
            },
            selected: _item => {
                console.log($scope.model.select);
            },
            
            open_modal: row => {
                if (row == undefined) {
                    $scope.run.init_modal();
                } else {
                    $scope.model.copy_modal = angular.copy(row);
                }
                $scope.model.is_new = row == undefined;
                $scope.model.title = "사용제한 도메인"
            },
            enabledChange: row => {
                var list = $scope.model.domains;
                const index = list.findIndex(item => {
                    return item.epoch === row.epoch;
                });
                list[index].enabled = row.enabled;
                storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                $scope.run.getDomain();
            },
            modalClose: () => {
                $scope.run.init_modal();
                $('#domainModal').modal("hide");
            },
            export_csv: () => {
                console.log('export_csv!');
                // storage.saveValue(CONFIG.STORAGE_RESTRICTION_ACCESS_LIST, null);
            },
            remove_alarm: () => {
                if (confirm('삭제하시겠습니까?')) {
                    var row = $scope.model.copy_modal;
                    var list = $scope.model.domains;
                    const index = list.findIndex(item => {
                        return item.epoch === row.epoch;
                    });

                    if (index !== -1) {
                        list.splice(index, 1);
                    } else {
                        // throw error
                        console.log('error! 삭제할 데이터가 없다!!');
                    }

                    storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                    $scope.run.getDomain();
                    $('#domainModal').modal("hide");
                } else {
                    //
                }
            },
            update_alarm: () => {
                var list = $scope.model.domains;
                var modal = $scope.model.copy_modal;

                if ($filter('isEmpty')(modal.domain)) {
                    alert('도메인을 입력해주세요.');
                    return;
                }

                var a = $filter('hhmmStrToNumber')(modal.time_start);
                var b = $filter('hhmmStrToNumber')(modal.time_end);
                if (a >= b) {
                    alert("시작 시간은 종료 시간보다 이전 시간으로 설정해야 합니다.");
                    return;
                }
                var find_domain = list.find(s => s.epoch == modal.epoch);
                if (find_domain == undefined) {
                    alert('항목을 수정할 수 없습니다.')
                } else {
                    for (var p in modal) {
                        find_domain[p] = modal[p];
                    }
                    storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                    // init_modal();
                    $scope.model.copy_modal = null;
                    $scope.run.getDomain();
                }
                $('#domainModal').modal("hide");
            },
            add_alarm: () => {
                var modal = $scope.model.modal;
                
                if ($filter('isEmpty')(modal.title)) {
                    alert('알람 이름을 입력해주세요.');
                    return;
                }

                if (parseInt(modal.value) <= 0 || isNaN(parseInt(modal.value))) {
                    alert('간(Hours)또는 데이터 용량(GB)을 정수(0이상)으로 입력해주세요.')
                    return;
                }
                modal.created = today;
                modal.updated = today;
                modal.count = 0;
                modal.epoch = moment().valueOf()
                modal.enabled = true;

                $scope.model.alarms.push(modal);
                console.log($scope.model.alarms);
                storage.saveValue(CONFIG.STORAGE_ALARM_LIST, $filter('clean')($scope.model.alarms));
                $scope.run.init_modal();
                $scope.run.getAlarms();
                // // 창닫기
                $('#domainModal').modal("hide");
            },
            getAlarms: () => {
                storage.getValue(CONFIG.STORAGE_ALARM_LIST, e => {
                    // [2020-12-11 00:42:17]
                    // 최초 설정은 데이터가 없음, undefined
                    e = e === undefined ? [] :$filter('clean')(e);
                    if (e) {
                        $scope.model.alarms = e.sort((a, b) => { return b.epoch - a.epoch });
                    }
                    console.log(e);
    
                    $scope.$apply();
                });
            }
        };
        $scope.run.getAlarms();


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
                rows = rows.sort(function (a, b) {
                    return b.part.summary - a.part.summary;
                });
                $scope.model.rows = rows;
                $scope.$apply();
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
