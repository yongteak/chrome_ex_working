angular.module('app.controller.sync', [])
    .controller('syncController', function ($scope, $rootScope, $http, $location, $filter, $interval, identity, storage, CONFIG, COLLECTIONS) {

        // var tz = $rootScope['timezone'];
        // var ltz = $rootScope['local_timezone'];
        // var u1 = tz.filter(z => { return z.abbr === 'UTC'});
        // var u2 = tz.filter(z => { return z.utc.find(x => x === ltz) });

        $scope.model = {
            rows: [
                { from: '로컬', to: '크롬', direction: 'local_to_chrome', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { from: '크롬', to: '로컬', direction: 'chrome_to_local', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { from: '로컬', to: '클라우드', direction: 'local_to_cloud', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { from: '클라우드', to: '로컬', direction: 'cloud_to_local', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { from: '(Similarweb) 로컬', to: '클라우드', direction: 'similarweb_to_cloud', count: 0, last: 0, repeat_min: 5, sync_enabled: true }
            ],
            identity: undefined,
            history: [],
            similarweb: [],
            similarweb1: [],
        };

        /* [2021-01-03 08:44:42]
            1. 둘다 도메인 목록 추출
            2. 양쪽에 없는 도메인은 전체 복제
            3. 충돌되는 도메인은 결합, 과거 마지막 시간대(hours)이후 데이터를 merge한다.
              => days 데이터가 동일한경우 서버측 데이터로 덮어씌운다.
        */
        // fetch(chrome.extension.getURL('static/assets/resource/WEB-SCREEN-TIME-BACKUP_2021-01-02.json'))
        //     .then(resp => resp.json())
        //     .then(row => {
        //         // {key:domain, value:index}
        //         var tabs1 = row['tabs'];
        //         storage.getValue(CONFIG.STORAGE_TABS, tabs2 => {
        //             // var t = {};
        //             // tabs1.concat(tabs2).forEach(e => t[e.url] = e.url);
        //             // console.log(tabs1.concat(tabs2).length,Object.keys(t).length);
        //             var pivot = tabs1.concat(tabs2).reduce((prev, cur) => {
        //                 var existing = prev.find(x => x.url === cur.url);
        //                 if (existing) {
        //                     if (JSON.stringify(existing.days) !== JSON.stringify(cur.days)) {
        //                         var diff = existing.days.concat(cur.days).reduce((prev1, cur1) => {
        //                             var exist1 = prev1.find(x => x.date === cur1.date);
        //                             if (exist1) {
        //                                 if (exist1.summary !== cur1.summary) {
        //                                     exist1.hours.forEach((e, idx) => {
        //                                         // counter가 작은쪽을 덮어씌운다.
        //                                         if (e.counter < cur1.hours[idx].counter) {
        //                                             e = cur1.hours[idx];
        //                                             exist1.summary += e.second;
        //                                             exist1.counter += e.counter;
        //                                             exist1.dataUsage += e.dataUsage;
        //                                             console.log(cur.url, exist1);
        //                                         }
        //                                     });
        //                                 }
        //                             } else {
        //                                 prev1.push(cur1);
        //                             }
        //                             return prev1;
        //                         }, []);
        //                         existing.days = diff;
        //                     }

        //                 } else {
        //                     prev.push(cur)
        //                 }
        //                 return prev;
        //             }, []);
        //             console.log(pivot.find(p => p.url === 'www.google.com'));
        //         });
        //     });

        // http://localhost:8080/api/v1/system/queue/analytics/2
        function lengthInUtf8Bytes(str) {
            const m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        };

        storage.getValue('similarweb', item => $scope.model.similarweb = item || []);

        $scope.run = {
            open_tab: () => {
                $http({
                    url: CONFIG.URI + '/system/queue/analytics/10',
                    method: "GET"
                }).finally(function () {

                }).then(function (response) {
                    response = response.data;
                    if (response.result_msg == "STATUS_NORMAL") {
                        chrome.extension.getBackgroundPage().open_tab(response.result_data);
                    } else {

                    }
                }, function (response) {
                    console.log('ERROR')
                });
            },
            reload_tabs: () => {
                chrome.extension.getBackgroundPage().reload_tab();
            },
            get_report: () => {
                chrome.extension.getBackgroundPage().get_reports((url, response) => {
                    // 로컬에 저장후 일괄 업로드
                    url = url.split("v1/data?domain=")[1];
                    response = JSON.parse(response);
                    response.host = url;
                    $scope.model.similarweb1.push(response);
                    $scope.$apply();
                });
            },
            set_report: () => {
                $scope.model.similarweb = $scope.model.similarweb.concat($scope.model.similarweb1);
                storage.saveValue('similarweb', $scope.model.similarweb);
                $scope.model.similarweb1 = [];
            },
            getIdentity: () => {
                storage.getValue(CONFIG.IDENTITY, item => {
                    if (item == undefined) {
                        identity.getUserID(userInfo => {
                            console.log('userInfo > ', userInfo);
                            if (userInfo == undefined) {
                                // 로그인 상태 없음
                            } else {
                                storage.saveValue(CONFIG.IDENTITY, userInfo);
                                $scope.model.identity = userInfo;
                                // $scope.$apply();
                            }
                        });
                    } else {
                        $scope.model.identity = item;
                        // console.log('item > ', item, $scope.model.identity == null);
                        // $scope.$apply();
                    }
                })
            },
            history: () => {
                storage.getValue(CONFIG.STORAGE_HISTORY_OF_SYNC, rows => {
                    if (rows) {
                        $scope.model.history = rows.sort((a, b) => { return b.epoch - a.epoch });
                        $scope.$apply();
                    }
                });
            },
            format: epochTime => {
                moment.unix(epochTime).format('dddd, MMMM Do, YYYY h:mm:ss A')
            },
            // 제약 사항 정리
            // https://github.com/Xwilarg/NHentaiAnalytics/blob/780ce6c571e1095ab2af375a61c496a3b49bdeee/js/background.js
            sync: row => {
                if ($scope.model.identity['id'] == null) {
                    console.log(222, $scope.model.identity);
                    alert('로그인 정보가 없습니다.');
                    return;
                }

                if (row.direction == 'similarweb_to_cloud') {
                    storage.getValue('similarweb', item => {
                        $scope.model.similarweb = item;
                        $http({
                            url: CONFIG.URI + '/analytics/simila/sync',
                            method: "PUT",
                            data: { payload: item }
                        }).finally(function () {

                        }).then(function (response) {
                            console.log(response.data)
                            storage.saveValue('similarweb', null);
                        }, function (response) {
                            console.log('ERROR')
                        });
                    });

                } else if (row.direction == 'local_to_chrome') {
                    var result = {};
                    for (var collection in COLLECTIONS) {
                        var variable = collection;
                        (function (field) {
                            storage.getValue(field, item => {
                                result[field] = item;
                                if (Object.keys(result).length == Object.keys(COLLECTIONS).length) {

                                    var jsonstr = JSON.stringify(result), i = 0, storageObj = {},
                                        maxBytesPerItem = chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2,
                                        maxValueBytes, index, segment, counter;
                                    var key = "tags";

                                    while (jsonstr.length > 0) {
                                        index = key + "" + i++;
                                        maxValueBytes = maxBytesPerItem - lengthInUtf8Bytes(index);

                                        counter = maxValueBytes;
                                        segment = jsonstr.substr(0, counter);
                                        while ((lengthInUtf8Bytes(JSON.stringify(segment)) + key.length) > maxValueBytes)
                                            segment = jsonstr.substr(0, --counter);

                                        storageObj[index] = segment;
                                        jsonstr = jsonstr.substr(counter);
                                    }
                                    storageObj[key] = i;
                                    console.log(storageObj);
                                    // 높은 확률로 안됨
                                    chrome.storage.sync.set(storageObj, () => {
                                        console.log(chrome.runtime.lastError);
                                        chrome.storage.sync.get(['tags'], elems => console.log(elems))


                                        storage.getValue(CONFIG.STORAGE_HISTORY_OF_SYNC, rows => {
                                            rows = rows || [];
                                            var has_error = chrome.runtime.lastError !== undefined;
                                            var message = has_error ? chrome.runtime.lastError.message : 'success';
                                            rows.push({
                                                type: row.direction,
                                                is_error: has_error,
                                                message: message,
                                                epoch: moment().valueOf(),
                                                created: $filter('formatDate')(),
                                                size: JSON.stringify(storageObj).length
                                            });
                                            storage.saveValue(CONFIG.STORAGE_HISTORY_OF_SYNC, $filter('clean')(rows));
                                        })
                                    });
                                }
                            })
                        })(variable);//passing in variable to var here
                    }
                } else if (row.direction == 'chrome_to_local') {
                    chrome.storage.sync.get('tags', size => {
                        var keys = Array(size.tags).fill(0).map((e, i) => 'tags' + i++);
                        chrome.storage.sync.get(keys, items => {
                            var res = '';
                            keys.forEach(e => res += items[e])
                            console.log(items);
                            res = JSON.parse(res);
                            storage.set(res);
                            console.log('local save ok!');
                            chrome.extension.getBackgroundPage().loadAddDataFromStorage();

                            storage.getValue(CONFIG.STORAGE_HISTORY_OF_SYNC, rows => {
                                rows = rows || [];
                                var has_error = chrome.runtime.lastError !== undefined;
                                var message = has_error ? chrome.runtime.lastError.message : 'success';
                                rows.push({
                                    type: row.direction,
                                    is_error: has_error,
                                    message: message,
                                    epoch: moment().valueOf(),
                                    created: $filter('formatDate')(),
                                    size: JSON.stringify(res).length
                                });
                                storage.saveValue(CONFIG.STORAGE_HISTORY_OF_SYNC, $filter('clean')(rows));
                            })
                        })
                    });
                } else if (row.direction == 'local_to_cloud') {
                    var result = {};
                    // $scope.model.identity
                    for (var collection in COLLECTIONS) {
                        var variable = collection;
                        (function (field) {
                            storage.getValue(field, item => {
                                result[field] = item;
                                if (Object.keys(result).length == Object.keys(COLLECTIONS).length) {
                                    var incrementalSync = true;
                                    try {
                                        var ltz = $rootScope['local_timezone'];
                                        var tz = $rootScope['timezone'];
                                        var myTz = tz.filter(z => { return z.utc.find(x => x === ltz) });
                                        var offSet = myTz[0].offset;
                                        var dt = result['last'].daytime + '';
                                        var nday = new Date(dt.replace(
                                            /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/,
                                            '$4:$5:00 $2/$3/$1'));
                                        var filterDay = parseInt(moment(nday).add(offSet, 'hours').format('YYYYMMDD'));
                                        console.log(result['last']);
                                        // [2021-01-02 00:58:17]
                                        // todo 데이터가 없는경우 전체 업로드
                                        var tabs = result['tabs'];
                                        result['tabs'] = tabs.filter(t => { return t.days.find(d => d.date >= filterDay) });
                                    } catch (error) {
                                        incrementalSync = false;
                                    }

                                    result['incremental_sync'] = incrementalSync;
                                    console.log('incrementalSync > ', incrementalSync);
                                    $http({
                                        url: CONFIG.URI + '/sync',
                                        method: "PUT",
                                        data: { user_id: $scope.model.identity.id, payload: JSON.stringify(result) }
                                    }).finally(function () {
                                        console.log('finally')
                                    }).then(function (response) {
                                        console.log(response.data)
                                    }, function (response) {
                                        console.log('ERROR')
                                    });
                                }
                            })
                        })(variable);//passing in variable to var here
                    }
                } else if (row.direction == 'cloud_to_local') {
                    // jwt를 사용하여 따로 사용자 id를 받지 않도록 구현
                    $http({
                        url: CONFIG.URI + '/sync/' + $scope.model.identity.id,
                        method: "GET"
                    }).finally(function () {
                        console.log('finally')
                    }).then(function (response) {
                        response = response.data;
                        if (response.result_msg == "STATUS_NORMAL") {
                            //response.result_data
                            console.log(response.result_data);

                            console.log('local save ok??!');
                            // console.log(JSON.stringify(response.result_data['tabs']));
                            // var hash = $filter('md5')(JSON.stringify(response.result_data['tabs']));


                            // chrome.extension.getBackgroundPage().loadAddDataFromStorage();
                        } else {
                            // error msg?
                        }
                    }, function (response) {
                        console.log('ERROR')
                    });
                }
            }
        }
        $scope.run.getIdentity();
        $scope.run.history();
    })