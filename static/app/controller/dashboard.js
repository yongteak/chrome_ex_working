angular.module('app.controller.dashboard', [])
    .controller('dashboardController', function ($scope, $rootScope, $filter, $timeout, $http, moment, storage, CONFIG) {
        $scope.model = {
            charts: {
                traffic: {}
            }
        }

        $timeout(function () {
            $scope.model.charts.times = { 'option': chart(), 'click': null };
            $scope.model.charts.traffic = { 'option': chart(), 'click': null };
            $scope.model.charts.count = { 'option': chart(), 'click': null };
            $scope.model.charts.limit = { 'option': chart(), 'click': null };

            $scope.model.charts.monthly = { 'option': chart2(), 'click': null };
        }, 0.2 * 1000);

        function chart(key, series) {
            return {
                xAxis: {
                    type: 'category',
                    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    show: false
                },
                yAxis: {
                    type: 'value',
                    show: false,
                    min: 800
                },
                tooltip: {
                    trigger: 'axis',
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
                    left: 8,
                    top: 4,
                    right: 5,
                    bottom: 2
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
                xAxis:{
                    type: 'category',
                    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
                },
                legend: {
                    padding: 0,
                    itemGap: 0,
                    data: [' ', ' ']
                },
                grid: {
                    left: 50,// 데이터 최대값 계측 평균 값 구현 필요
                    top: 18,
                    right: 5,
                    bottom: 20
                },
                yAxis:{
                    type: 'value',
                    axisLabel: {
                        formatter: value=> $filter('moneyFormat')(value)
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
    })
