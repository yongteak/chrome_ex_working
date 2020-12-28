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
            modal:{}
        };
        $scope.param = null;
        $scope.param1 = null;

        var week_of_start = moment().startOf('week').format("YYYYMMDD");
        var week_of_end = moment(week_of_start).endOf('week').format("YYYYMMDD");
        var diff = moment(week_of_end).diff(moment(week_of_start), 'days');
        for (var i = 0; i < diff; i++) {
            $scope.model.times.weeks.push(moment(week_of_start).add(i, 'day').format("YYYYMMDD"));
        }

        $scope.run = {
            init: () => {
                // [2020-12-27 07:54:13]
                // cache
                console.log('^init');
                console.log('# 주간 날짜 생성');
                // Array.apply(null, Array(7)).map(function (_, i) {
                //     $scope.model.times.weeks.push(moment().clone().startOf('week').add(i, 'days').format("YYYYMMDD"));
                // });
                console.log($scope.model.times.weeks);
                // console.log('# 23시간 생성');
                console.log('# interval 데이터 수집');
                storage.getValue(CONFIG.STORAGE_TIMEINTERVAL_LIST, rows => {
                    // rows[n].domain
                    // [2020-12-27 06:44:11]
                    // TODO
                    // 주간 데이터만 필터링
                    // summary데이터 서버에 저장
                    rows = rows.filter(iv => { return $scope.model.times.weeks.includes(''+iv.day) });
                    console.log(rows);
                    storage.getValue(CONFIG.STORAGE_TABS, tabs => {
                        // tabs = tabs.filter(t => {return t.url == })
                        // tabs[n].url
                        // console.log(tabs);
                        $scope.interval_summary = [];
                        rows.forEach((row, i, a) => {
                            var acc = [], arr1 = [];
                            // 시간 변환
                            row.intervals
                                .forEach(item => $filter('hmsToSeconds')(item)
                                    .forEach(r => { arr1.push(r) })
                                );
                            if (row.domain == "til.hashrocket.com") {
                                console.log('docs', row.day, row);
                            }
                            // 0-23시 기준으로 sum
                            Array(24).fill(0).map((e, i) => i).forEach(t => {
                                var sum = arr1
                                    .filter(a => { return a.hour == t })
                                    .reduce((a, b) => a + b.value, 0);
                                    // if (row.domain == "til.hashrocket.com") {
                                    //     console.log('hashrocket',sum,arr1);
                                    // }

                                acc.push({ hour: t, value: sum });
                            });

                            var cat_nm = tabs.find(s => s.url === row.domain).category_top;
                            $scope.interval_summary.push({
                                domain: row.domain,
                                day: row.day,
                                category: cat_nm,
                                times: acc
                            });
                            // if (row.domain == "til.hashrocket.com") {
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
                $scope.model.charts.day.series = [];
                console.log('$scope.model.interval_summary',copy);
                $scope.model.summary = copy.reduce((prev, cur) => {
                    let existing = prev.find(x => x.category === cur.category && x.day === cur.day);
                    if (existing) {
                        existing.times += cur.times.reduce((a, b) => a + b.value, 0)
                    } else {
                        prev.push({
                            category: cur.category, day: cur.day, times: cur.times.reduce((a, b) => a + b.value, 0)
                        });
                    }
                    return prev;
                }, []);
                console.log('# day 차트 데이터 생성');
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
                var wd = moment().weekday()+1;
                const average = av/wd; // 그냥은 안됌?

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
            charts1: (e) => {
                // console.log(e);
                if (e.componentType == "markLine") return;
                const copy = JSON.parse(JSON.stringify($scope.interval_summary));
                const day = parseInt(e.name);
                $scope.model.charts.time.series = [];
                var pivot = copy.filter(item => item.day === day).reduce((prev, cur) => {
                    let existing = prev.find(x => x.category === cur.category);
                    if (existing) {
                        existing.times.forEach((elem, index) => {
                            elem.value += cur.times[index].value;
                        });
                    } else {
                        prev.push({
                            category: cur.category, day: cur.day, times: cur.times
                        });
                    }
                    return prev;
                }, []);

                pivot.forEach(e => {
                    $scope.model.charts.time.series.push({
                        name: e.category + '|' + $filter('category_to_name')(e.category),
                        data: e.times, type: 'bar', stack: 'total',
                        label: { show: false },
                        animationDelay: function (idx) {
                            return idx * 250;
                        },
                        animationEasingUpdate: "linear",
                        emphasis: { focus: 'series' }
                    });
                });
                $timeout(function () {
                    $scope.param1 = { 'option': opt2(), 'click': null }
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
                };
                // console.log($scope.model.charts.day.title);
                // console.log(moment(e.name).calendar());
                // '오늘, '+moment().format('llll').split(' ').filter((_,idx) => {return idx > 0 && idx < 4}).join(' ')

                // 목록 조회
                $scope.today(day);
            },
            charts: () => {
                console.log('# opt1 차트 데이터 적용');
                $scope.param = { 'option': opt1(), 'click': $scope.run.charts1 };
                // console.log($scope.model.charts.day.series[0]);
                $scope.run.charts1({name:moment().format('YYYYMMDD')});
            },
            modalClose: () => {
                // $scope.run.init_modal();
                $('#domainModal').modal("hide");
            },
            info: row => {
                console.log(row);
                console.log('cont..', $rootScope['countries']);
                $http({
                    url: CONFIG.URI + '/analytics/data?domain=' + row.url,
                    method: "GET"
                }).finally(function () {

                }).then(function (response) {
                    response = response.data;
                    var result = response.result_data;
                    var m = $scope.model.modal;
                    // $scope.model.modal;
                    console.log(response);
                    // 추적금지
                    storage.getValue(CONFIG.STORAGE_BLACK_LIST, e => {
                        m.black_list = (e == null || e.undefined) ? []
                            : e.filter(a => { return a.domain == row.url });
                        console.log(m.black_list);
                    });

                    if (response.result_msg == "STATUS_NORMAL") {
                        // 설명
                        m.title = result.Title;
                        m.desc = result.Description;
                        m.favicon = row.favicon;
                        m.host = row.url;
                        // 카테고리
                        m.category = row.category;
                        m.category_sub = row.category_sub;
                        m.category_top = row.category_top;
                        // 전체 접속 횟수
                        m.counter = row.counter;
                        // 전체 데이터 사용량
                        m.dataUsage = row.dataUsage;
                        // 시작/마지막날짜
                        m.start_day = row.days[0].date;
                        m.end_day = row.days[row.days.length-1].date;
                        // 랭킹
                        m.rank_global = result.GlobalRank.Rank;
                        m.rank_contry = result.CountryRank.Rank;
                        m.rank_category = result.CategoryRank.Rank;
                        // 지역 코드
                        m.contry_code = result.CountryRank.Country;
                        // 월간 예상 방문횟수(4개월, {2020-09-01: 19478384})
                        m.estimated_monthly_visits = result.EstimatedMonthlyVisits;
                        console.log(m);
                    } else {

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
            // var sum = arr1
            //                     .filter(a => { return a.hour == t })
            //                     .reduce((a, b) => a + b.value, 0);
            // var rows = copy.filter(s=>{ return s.day == e.name});
            // // 전체 합
            // var sum = $scope.interval_summary.reduce((a,b) => a + b.times.reduce( (a1,b1) => a1 + b1.value,0), 0);
            // copy.forEach(e => {
            //     e.timese.times.reduce( (a1,b1) => a1 + b1.value,0);
            // })
            // 도메인별 합
            $scope.model.day_title = moment(day + '').format('llll').split(' ').filter((_, idx) => { return idx < 4 }).join(' ');
            // $scope.model.total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                var tabs = rows.filter(x => x.days.find(s => s.date === day));
                // console.log(today, targetTabs);

                // e.part = {
                //     counter: e.counter,
                //     dataUsage: e.dataUsage,
                //     summary: e.summaryTime
                // }

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
                console.log(tabs);
                $scope.model.rows = tabs;
                $scope.$apply();
            });
        }

        var now = moment().endOf('day').toDate();
        var time_ago = moment().startOf('day').subtract(10, 'year').toDate();

        function opt2() {
            return {
                animation: true,
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

                        // tooltip += `<div><h5><b>#${title} | ${sum}</b></h5></div>`;

                        series.forEach(s => {
                            sum += s.value;
                            s.seriesName = s.seriesName.split('|')[1];
                            s.value = s.value > 60 ? $filter('secondToFormat')(s.value, s.value >= 3600 ? 'HH시간mm분ss초' : 'mm분ss초') : s.value == 0 ? '-' : s.value + '초';
                            tooltip += `<div>${s.marker} ${s.seriesName}: <code>${s.value}</code></div>`;
                        });
                        sum = sum > 60 ? $filter('secondToFormat')(sum, sum >= 3600 ? 'HH시간mm분ss초' : 'mm분ss초') : sum == 0 ? '-' : sum + '초';
                        // title = title +' | '+sum;
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
                    data: Array(24).fill(0).map((e, i) => i),
                    // axisLabel: {
                    //     formatter: value => moment(value).format('ddd')
                    // }
                },
                series: $scope.model.charts.time.series
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
