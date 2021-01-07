angular.module('app.controller.dashboard', [])
    .controller('dashboardController', function ($scope, $rootScope, $filter, $timeout, $http, moment, storage, CONFIG) {
        $scope.model = {
            charts: {
                traffic: {},
                scatter: {}
            }
        }

        $timeout(function () {
            $scope.model.charts.times = { 'option': chart(), 'click': null };
            $scope.model.charts.traffic = { 'option': chart(), 'click': null };
            $scope.model.charts.count = { 'option': chart(), 'click': null };
            $scope.model.charts.limit = { 'option': chart(), 'click': null };

            $scope.model.charts.monthly = { 'option': chart2(), 'click': null };
            $scope.model.charts.scatter = { 'option': chart3(), 'click': null };
        }, 0.2 * 1000);

        function percent(count, times, usaged) {
            var sum = count + times + usaged;
            return [Math.round(count / sum * 100),
            Math.round(count / sum * 100),
            Math.round(count / sum * 100)];
        };

        function chart(key, series) {
            return {
                xAxis: {
                    type: 'category',
                    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    show: true
                },
                yAxis: {
                    type: 'value',
                    show: false,
                    // min: 800
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
                legend: {
                    padding: 0,
                    itemGap: 0,
                    data: [' ', ' ']
                },
                grid: {
                    left: 10,
                    top: 4,
                    right: 6,
                    bottom: 18
                },
                series: [{
                    data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 500)),
                    type: 'line',
                    symbolSize: 0,
                    smooth: true,
                    lineStyle: {
                        color: '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        width: 4
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

        function chart3(key, series) {
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
                    show:false,
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
                        data: Array.from({ length: 350 }, () =>
                            [Math.floor(Math.random() * 25), Math.floor(Math.random() * 3600)]),
                }]
            }
        }
    })
