// https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/%EC%95%A0%EB%A1%9C%EC%9A%B0_%ED%8E%91%EC%85%98
// function를 생락하고 '=>' 기호 사용하지 말것
// https://stackoverflow.com/questions/47696945/over-function-throwing-me-an-angular-error

angular.module('app.controllers', [])
    .controller('side', ($scope, $location, $rootScope, identity, storage, CONFIG) => {
        $scope.isCurrentPath = path => {
            return $location.path().indexOf(path) != -1;
        };
        $rootScope['countries'] = {};

        fetch(chrome.extension.getURL('static/assets/resource/iso-3166-countries-with-regional-codes.json'))
            .then((resp) => resp.json())
            .then(function (jsonData) {
                $rootScope['countries'] = jsonData;
                console.log('jsonData', jsonData);
            })

        identity.getUserID(userInfo => {
            if (userInfo == undefined) {
                // 로그인 상태 없음
            } else {
                storage.saveValue(CONFIG.IDENTITY, userInfo);
            }
        });
    })
    .controller('view', $scope => {
        console.log("view!");
        // $scope.init = () => {
        //     console.log("view > init!");
        // }
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
    .controller('syncController', function ($scope, $http, $location, $filter, $interval, identity, storage, CONFIG, COLLECTIONS) {

        $scope.model = {
            rows: [
                { desc: '로컬 > 크롬 계정', direction: 'local_to_chrome', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { desc: '크롬 계정 > 로컬', direction: 'chrome_to_local', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { desc: '로컬 > 클라우드', direction: 'local_to_cloud', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { desc: '클라우드 > 로컬', direction: 'cloud_to_local', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { desc: 'Similarweb 업로드', direction: 'similarweb_to_cloud', count: 0, last: 0, repeat_min: 5, sync_enabled: true }
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
                                    // 좀 이상하다아..
                                    chrome.storage.sync.set({ 'tabs': null });
                                    chrome.storage.sync.remove('tabs', () => {
                                        console.log('remove sync tabs');
                                        chrome.storage.sync.remove(Object.keys(COLLECTIONS), () => {
                                            console.log('remove all');
                                            chrome.storage.sync.clear(function () {
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
                                            });
                                        });
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
    .controller('dataController', function ($scope, $location, $filter, $interval, identity, storage, CONFIG, COLLECTIONS) {
        $scope.model = {
            collections: COLLECTIONS
        };
        $scope.run = {
            clear: () => {
                chrome.storage.local.set({ 'tabs': null });
                chrome.storage.local.remove('tabs', () => {
                    console.log('remove tabs');
                });
                chrome.storage.local.remove(Object.keys(COLLECTIONS), () => {
                    console.log('remove all');
                    chrome.storage.local.clear(function () {
                        console.log('clear all');
                        console.log(chrome.runtime.lastError);
                        chrome.extension.getBackgroundPage().tabs = [];
                        chrome.extension.getBackgroundPage().loadAddDataFromStorage();
                    })
                })
            },
            backup: () => {
                var collections = $scope.model.collections;
                var result = {};
                for (var collection in collections) {
                    var variable = collection;
                    (function (field) {
                        storage.getValue(field, item => {
                            result[field] = item;
                            if (Object.keys(result).length == Object.keys(collections).length) {
                                createFile(JSON.stringify(result), "application/json");
                            }
                        })
                    })(variable);//passing in variable to var here
                }

                function createFile(data, type, fileName) {
                    fileName = fileName || 'WEB-SCREEN-TIME-BACKUP|' + moment().format('YYYY-MM-DD');
                    console.log(fileName);
                    var file = new Blob([data], { type: type });
                    var downloadLink;
                    downloadLink = document.createElement("a");
                    downloadLink.download = fileName;
                    downloadLink.href = window.URL.createObjectURL(file);
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                }
            },
            restore_from_file: (e) => {
                let file = e.target.files[0];
                if (file.type === "application/json") {
                    var reader = new FileReader();
                    reader.readAsText(file, 'UTF-8');
                    reader.onload = readerEvent => {
                        let content = readerEvent.target.result;
                        let collections = JSON.parse(content);
                        for (var p in collections) {
                            storage.saveValue(p, collections[p]);
                            if (p == 'tabs') {
                                chrome.extension.getBackgroundPage().tabs = collections[p];
                            }
                        }
                    }
                } else {
                    // error
                }
            },
            restore: () => {
                document.getElementById('file-input-backup').click();
            },
            getCollections: () => {
                for (var p in $scope.model.collections) {
                    var variable = p;
                    (function (x) { //start wrapper code
                        storage.getValue(x, e => {
                            console.log(x, e);
                            if (e == undefined) {
                                $scope.model.collections[x].rows = 0;
                                $scope.model.collections[x].size = 0;
                            } else {
                                $scope.model.collections[x].rows = e.length;
                                storage.getMemoryUse(x, integer => {
                                    $scope.model.collections[x].size = integer;
                                    $scope.$apply();
                                });
                            }
                        })
                    })(variable);//passing in variable to var here
                }
            }
        };
        $scope.run.getCollections();
    })
    .controller('alarmController', function ($scope, $location, $filter, $interval, identity, storage, CONFIG) {
        const today = $filter('formatDate')();
        $scope.model = {
            is_new: true,
            title: '알람 설정 추가하기',
            alarms: [],
            history: [],
            copy_modal: {},
            options: [
                { name: '화면 정중앙', id: 'center' },
                { name: '화면 상단', id: 'top' },
                { name: '화면 하단', id: 'bottom' },
                { name: '화면 전환', id: 'move' }
            ],
            select: "center",
            modal: {
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

        $scope.resetToastPosition = function () {
            $('.jq-toast-wrap').removeClass('.alert-notification-wrapper bottom-left bottom-right top-left top-right mid-center'); // to remove previous position class
            $(".jq-toast-wrap").css({
                "top": "",
                "left": "",
                "bottom": "",
                "right": ""
            });
            $(this).parentsUntil(".alert-notification-wrapper").slideToggle();
        }

        $scope.run = {
            preview: row => {
                'use strict';
                $scope.resetToastPosition();
                $.toast({
                    heading: '설정된 알람 미리 보기',
                    icon: 'error',
                    text: 'Specify the custom position object or use one of the predefined ones',
                    allowToastClose: true,
                    position: 'top-right',
                    sticky: true,
                    loader: false,
                    loaderBg: '#00e093'
                });


                // toggleAlertNotificationTop() {
                $("body").append('\
            <div class="alert-notification-wrapper top">\
                <div class="alert-notification dismissible-alert">\
                    <p><b>알려드립니다!&nbsp;</b>지정하신 알람 시간이 되었습니다! 닫기버튼을 누르면 초기화됩니다. </p>\
                    <i class="alert-close mdi mdi-close"></i>\
                </div>\
            </div>\
        ');
                $(".alert-notification-wrapper .dismissible-alert .alert-close").on("click", function () {
                    $(this).parentsUntil(".alert-notification-wrapper").slideToggle();
                });
                // $(".alert-notification-wrapper .dismissible-alert .alert-close").on("click", function () {
                //     $(this).parentsUntil(".alert-notification-wrapper").slideToggle();
                // });
                // }

            },
            init_modal: () => {
                $scope.model.select = "center";
                $scope.model.modal = {
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
            },
            selected: _item => {
                if ($scope.is_new) {
                    $scope.model.modal.position = $scope.model.select;
                } else {
                    $scope.model.copy_modal.position = $scope.model.select;
                }
            },
            open_modal: row => {
                if (row == undefined) {
                    $scope.run.init_modal();
                    $scope.model.copy_modal = null;
                } else {
                    $scope.model.copy_modal = angular.copy(row);
                    $scope.model.select = $scope.model.copy_modal.position;
                }
                $scope.model.is_new = row == undefined;
                // console.log($scope.model.copy_modal);
                $scope.model.title = $scope.model.is_new ? '알람 추가하기' : '알람 수정하기';
            },
            enabledChange: (row, field) => {
                var list = $scope.model.alarms;
                const index = list.findIndex(item => {
                    return item.epoch === row.epoch;
                });
                list[index][field] = row[field];
                console.log('field > ', field);
                storage.saveValue(CONFIG.STORAGE_ALARM_LIST, $filter('clean')($scope.model.alarms));
                $scope.run.getAlarms();
            },
            modalClose: () => {
                $scope.run.init_modal();
                $('#domainModal').modal("hide");
            },
            remove_alarm: () => {
                if (confirm('삭제하시겠습니까?')) {
                    var row = $scope.model.copy_modal;
                    var list = $scope.model.alarms;
                    const index = list.findIndex(item => {
                        return item.epoch === row.epoch;
                    });

                    if (index !== -1) {
                        list.splice(index, 1);
                    } else {
                        // throw error
                        console.log('error! 삭제할 데이터가 없다!!');
                    }

                    storage.saveValue(CONFIG.STORAGE_ALARM_LIST, $filter('clean')(list));
                    $scope.run.getAlarms();
                    $('#domainModal').modal("hide");
                } else {
                    //
                }
            },
            update_alarm: () => {
                var list = $scope.model.alarms;
                var modal = $scope.model.copy_modal;
                if (parseInt(modal.value) <= 0 || isNaN(parseInt(modal.value))) {
                    alert('시간(Hours)또는 데이터 용량(GB)을 정수(0이상)으로 입력해주세요.')
                } else {
                    var find_domain = list.find(s => s.epoch == modal.epoch);
                    if (find_domain == undefined) {
                        alert('항목을 수정할 수 없습니다.')
                    } else {
                        for (var p in modal) {
                            find_domain[p] = modal[p];
                        }
                        storage.saveValue(CONFIG.STORAGE_ALARM_LIST, $filter('clean')(list));
                        // init_modal();
                        $scope.model.copy_modal = null;
                        $scope.run.getAlarms();
                    }
                    $('#domainModal').modal("hide");
                }
            },
            add_alarm: () => {
                var modal = $scope.model.modal;

                if (parseInt(modal.value) <= 0 || isNaN(parseInt(modal.value))) {
                    alert('시간(Hours)또는 데이터 용량(GB)을 정수(0이상)으로 입력해주세요.')
                } else {

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
                }
            },
            getAlarms: () => {
                storage.getValue(CONFIG.STORAGE_ALARM_LIST, e => {
                    // [2020-12-11 00:42:17]
                    // 최초 설정은 데이터가 없음, undefined
                    e = e === undefined ? [] : $filter('clean')(e);
                    if (e) {
                        $scope.model.alarms = e.sort((a, b) => { return b.epoch - a.epoch });
                    }
                    console.log(1, $scope.model.alarms);

                    $scope.$apply();
                });
            }
        };
        $scope.run.getAlarms();
    })
    .controller('profileController', function ($scope, $location) {
    })
    .controller('aboutController', function ($scope, $location) {
    })
