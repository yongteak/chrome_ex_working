angular.module('app.controller.status', [])
    .controller('statusController', function ($scope, $rootScope, $filter, $timeout, $http, moment, storage, CONFIG) {
        // Array.prototype.sum = function () { return [].reduce.call(this, (a, i) => a + i.value, 0); }
        // console.log(moment().format('LL').split(' ').slice(1).join(' '));
        // [2020-12-25 03:09:52]
        // 우선 언어 관련 페이지에 다 집어넣자
        moment.locale(window.navigator.language.split('-')[0]);
        console.log(moment().subtract(3, 'days').calendar());
        // var week_range = [];
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
                    console.log('tabs',tabs);
                    console.log('weeks',$scope.model.times.weeks);
                    $scope.interval_summary = [];
                    tabs = tabs.filter(x => x.days.find(s => $scope.model.times.weeks.includes('' + s.date)));
                    tabs.forEach( (tab,i,a) => {
                        // if (tab.url == 'www.clien.net') {
                        //     console.log('clien',tab);
                        // }
                        tab.days.forEach( (t1,_i,_a) => {
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
                console.log('summary',$scope.model.summary);
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
                        emphasis: { focus: 'series' }
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
                // console.log(e);
                if (e.componentType == "markLine") return;
                const copy = JSON.parse(JSON.stringify($scope.interval_summary));
                const day = parseInt(e.name);
                var series = [];

                // https://echarts.apache.org/next/examples/en/editor.html?c=bar-y-category-stack
                var pivot = copy.filter(item => item.day === day).reduce((prev, cur) => {
                    let existing = prev.find(x => x.category === cur.category);
                    if (existing) {
                        existing.times.forEach((elem, index) => {
                            elem.value += cur.times[index].second;
                        });
                    } else {
                        cur.times.forEach( e => {
                            if (!e.hasOwnProperty('value')) {
                                e.value = 0;
                            }
                            e.value += e.second;
                        });
                        prev.push({
                            category: cur.category, day: cur.day, times: cur.times
                        });
                    }
                    return prev;
                }, []);
                pivot.forEach(e => {
                    // console.log('data > ',e.times.map(a => a.second));
                    series.push({
                        name: e.category + '|' + $filter('category_to_name')(e.category),
                        data: e.times.map(a => a.value), 
                        type: 'bar', stack: 'total',
                        label: { show: false },
                        animationDelay: function (idx) {
                            return idx * 250;
                        },
                        animationEasingUpdate: "linear",
                        emphasis: { focus: 'series' }
                    });
                });
                $timeout(function () {
                    $scope.param1 = { 'option': opt2(series), 'click': null }
                }, 0.2 * 1000);
                // $scope.model.charts.day.title,
                // 오늘, 12월25일
                // 어제, 12월 24일
                // 12월 21일 일요일
                // today, yesterday
                var dayname = moment(e.name).calendar().split(' ')[0];
                if (dayname === '오늘' || dayname === '어제') {
                    $scope.model.charts.day.title = dayname + ', ' + moment(e.name).format('llll').split(' ').filter((_, idx) => { return idx > 0 && idx < 4 }).join(' ')
                } else {
                    $scope.model.charts.day.title = moment(e.name).format('llll').split(' ').filter((_, idx) => { return idx > 0 && idx < 4 }).join(' ')
                }
                
                $scope.today(day);
            },
            modalClose: () => {
                // $scope.run.init_modal();
                $('#domainModal').modal("hide");
            },
            info: row => {
                $http({
                    url: CONFIG.URI + '/analytics/data?domain=' + row.url,
                    method: "GET"
                }).finally(function () {

                }).then(function (response) {
                    response = response.data;
                    var result = response.result_data;
                    var m = $scope.model.modal;
                    // 추적금지
                    storage.getValue(CONFIG.STORAGE_BLACK_LIST, e => {
                        m.black_list = (e == null || e.undefined) ? []
                            : e.filter(a => { return a.domain == row.url });
                        // console.log(m.black_list);
                    });
                    // 최근 30일 차트 데이터 생성
                    // 시작일,마지막일
                    storage.getValue(CONFIG.STORAGE_TABS, tabs => {
                        // 항상 1개만 존재함
                        var tab = tabs.filter(t => { return t.url == row.url })[0];
                        m.counter = tab.counter;
                        m.dataUsage = tab.dataUsage;
                        m.summaryTime = tab.summaryTime;
                        m.start_day = tab.days[0].date;
                        m.end_day = tab.days[tab.days.length - 1].date;
                        m.diff_day = m.start_day == m.end_day ? 1 : moment(m.end_day).diff(moment(m.start_day), 'days');

                        m.chart = { data: {}, options: null };
                        Array(7 * 5).fill(0).map((_e, n) => n).forEach(n => {
                            var day = parseInt(moment().add(-n, 'day').format("YYYYMMDD"));
                            // tab.days에 모든 날짜 데이터가 있어서 중복 처리되는 경향이 있음, 최적화 필요한가?
                            var find = tab.days.filter(d => {return d.date == day});
                            // console.log('find',find);
                            m.chart.data[day] = find.length == 0 ? 0 : find[0].summary;
                        })
                        $timeout(function () {
                            m.chart.options = { 'option': chart(Object.keys(m.chart.data),Object.values(m.chart.data)), 'click': null }
                        }, 0.2 * 1000);
                    });

                    if (response.result_msg == "STATUS_NORMAL") {
                        // 설명
                        m.title = result.Title;
                        m.desc = result.Description;
                        m.rows = Math.ceil(result.Description.length / 40);
                        m.favicon = row.favicon;
                        m.host = row.url;
                        // 카테고리
                        m.category = row.category;
                        m.category_sub = row.category_sub;
                        m.category_top = row.category_top;
                        // 랭킹
                        m.rank_global = result.GlobalRank.Rank;
                        m.rank_contry = result.CountryRank.Rank;
                        m.rank_category = result.CategoryRank.Rank;
                        // 지역 코드
                        m.contry_code = result.CountryRank.Country;
                        // 월간 예상 방문횟수(4개월, {2020-09-01: 19478384})
                        m.estimated_monthly_visits = result.EstimatedMonthlyVisits;
                        // console.log(m);
                    } else {
                        // return error
                    }
                }, function (response) {
                    console.log('ERROR')
                });
            }
        }

        $scope.run.init();
        
        $scope.all = function () {
            // $scope.model.totals.times = 0;
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
        $scope.today = day => {
            day = day || moment().format('YYYYMMDD');
            $scope.model.day_title = moment(day + '').format('llll').split(' ').filter((_, idx) => { return idx < 4 }).join(' ');
            // $scope.model.total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                // todo
                // filter return이 없는데 데이터가 나오나??
                var tabs = rows.filter(x => { return x.days.find(s => s.date === day)});
                $scope.model.totals.times = 0;
                $scope.model.totals.dataUsage = 0;
                $scope.model.totals.counter = 0;
                tabs.forEach(e => {
                    e.part = e.days.filter(x => x.date == day)[0];
                    $scope.model.totals.times += e.part.summary;
                    $scope.model.totals.dataUsage += e.part.dataUsage;
                    $scope.model.totals.counter += e.part.counter;
                });
                tabs.sort(function (a, b) {
                    return b.days
                        .find(s => s.date === day).summary - a.days
                            .find(s => s.date === day).summary;
                });
                $scope.model.rows = tabs;
                $scope.$apply();
            });
        }

        function chart(key, value) {
            return {
                xAxis: {
                    type: 'category',
                    data: key
                },
                yAxis: {
                    type: 'value',
                    // max: 60*60*24,
                    // min:60*2,
                    axisLabel: {
                        formatter: t => $filter('secondToFormat')(t, t >= 3600 ? 'HH시' : 'mm분')// '{value} Mbps'
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: series => {
                        let tooltip = '';
                        const [firstSeries] = series;
                        const title = $filter('formatDate')(firstSeries.name,'MM월DD일');
                        series.forEach(s => {
                            var val = $filter('secondToFormat')(s.value, s.value >= 3600 ? 'HH시간mm분ss초' : 'mm분ss초')
                            tooltip += `<div>${s.marker} ${title}: <code>${val}</code></div>`;
                        });
                        return series[0].value > 0 ? tooltip : '';
                    }
                },
                axisLabel: {
                    formatter: t => $filter('formatDate')(t,'MM월DD일')
                },
                grid: {
                    left: '10%',
                    right: '4%',
                    bottom: '10%',
                    containLabel: false
                },
                series: [{
                    data: value,
                    type: 'bar'
                }]
            }
        }

        function opt2(data) {
            return {
                animation: true,
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
                            tooltip += `<div>${s.marker} ${s.seriesName}: <code>${s.value}</code></div>`;
                        });
                        sum = sum > 60 ? $filter('secondToFormat')(sum, sum >= 3600 ? 'HH시간mm분ss초' : 'mm분ss초') : sum == 0 ? '-' : sum + '초';
                        tooltip = `<div><h5><b>#${title} </b><code><u>${sum}</u></code></h5></div>` + tooltip;
                        return sum == '-' ? '' :  tooltip;
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
                    data: Array(24).fill(0).map((e, i) => i),
                },
                series: data
            }
        }
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
                tooltip: {
                    show: false,
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
                    show: false,
                    avoidLabelOverlap: true,
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
                    // max: 3600 * 24,
                    axisLabel: {
                        formatter: value => value < (3600 * 24) - 1 ? $filter('secondToFormat')(value, 'HH시mm분') : '24시00분'
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
    })
