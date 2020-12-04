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
    .controller('settingController', function ($scope, $location,$filter, identity,storage,CONFIG) {
        // console.log(CONFIG);
        // storage.getValue(CONFIG.STORAGE_TABS, e => {
        //     // console.log(e)
        // });
    })
    .controller('limitController', function ($scope, $location) {
    })
    .controller('alarmController', function ($scope, $location) {
    })
    .controller('dataController', function ($scope, $location) {
    })
    .controller('syncController', function ($scope, $location) {
    })
    .controller('statusController', function ($scope, $location,moment) {

        var now = moment().endOf('day').toDate();
        var time_ago = moment().startOf('day').subtract(10, 'year').toDate();
        $scope.example_data = d3.time.days(time_ago, now).map(function (dateElement, index) {
          return {
            date: dateElement,
            details: Array.apply(null, new Array(Math.round(Math.random() * 15))).map(function(e, i, arr) {
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
            // console.log("over@",val);
          };

        var vm = this;
    var type = false;
    vm.option = loadDataWithType(type);

    $scope.change = function() {
        type = !type;
        vm.option = loadDataWithType(type);
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
