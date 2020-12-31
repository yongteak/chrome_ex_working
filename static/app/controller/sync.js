angular.module('app.controller.sync', [])
    .controller('syncController', function ($scope, $http, $location, $filter, $interval, identity, storage, CONFIG, COLLECTIONS) {

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
                            storage.set(response.result_data);
                            console.log('local save ok!');
                            chrome.extension.getBackgroundPage().loadAddDataFromStorage();
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