// https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/%EC%95%A0%EB%A1%9C%EC%9A%B0_%ED%8E%91%EC%85%98
// function를 생락하고 '=>' 기호 사용하지 말것
// https://stackoverflow.com/questions/47696945/over-function-throwing-me-an-angular-error

angular.module('app.controllers', [])
    .controller('side', ($scope, $location, identity, storage, CONFIG) => {
        $scope.isCurrentPath = path => {
            return $location.path().indexOf(path) != -1;
        };

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
    .controller('settingController', function ($scope, $location, $filter, identity, storage, CONFIG) {
        $scope.model = {
            is_news: false,
            today: $filter('formatDate')(),
            domains: [],
            domain: null,
            setting: [
                { name: "activity_detected", value: 'bandwith_today', epoch: 0, updated: null }
            ], // activity_detected, badge_icon_info,
            options: {
                activity_detected:
                    [{ name: '웹사이트 랭킹정보', id: 'ranking_web' },
                    { name: '알람:남은 시간또는 용량', id: 'alarm_info' },
                    { name: '오늘:데이터 수신량', id: 'bandwith_today' },
                    { name: '오늘:사이트 사용시간', id: 'time_today' },
                    { name: '전체:데이터 수신량', id: 'bandwith_total' },
                    { name: '전체:사이트 사용량', id: 'time_total' },
                    { name: '표시하지 않음', id: 'none' }]
            },
            select: { activity_detected: 'time_today' }
        };
        $scope.run = {
            getSetting: () => {
                storage.getValue(CONFIG.STORAGE_SETTING, e => {
                    $scope.model.is_new = (e == null || e.undefined);
                    $scope.model.setting = (e == null || e.undefined) ? $scope.model.setting : $filter('clean')(e);
                    var find = $scope.model.setting.find(s => s.name == 'activity_detected');
                    $scope.model.select.activity_detected = find.value;
                    $scope.$apply();
                })
            },
            getDomain: () => {
                storage.getValue(CONFIG.STORAGE_BLACK_LIST, e => {
                    e = (e == null || e.undefined) ? [] : $filter('clean')(e);
                    if (e) {
                        $scope.model.domains = e.sort((a, b) => { return b.epoch - a.epoch });
                    }
                    $scope.$apply();
                })
            },
            selected: (field, _item) => {
                // {name:"activity_detected",value:null,epoch:0,updated:null}
                var items = $scope.model.setting;
                var find = items.find(s => s.name == field);
                find.value = $scope.model.select[field];
                find.epoch = (find.epoch == 0 || $scope.model.is_new) ? moment().valueOf() : find.epoch;
                find.updated = $scope.model.today;
                // console.log(find,$scope.model.setting);
                storage.saveValue(CONFIG.STORAGE_SETTING, $scope.model.setting);
                $scope.run.getSetting();
            },
            clear: () => {
                storage.saveValue(CONFIG.STORAGE_BLACK_LIST, null);
            },
            remove: (row) => {
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
                    $scope.run.getDomain();

                } else {
                    //
                }
            },
            enabledChange: row => {
                var list = $scope.model.domains;
                const index = list.findIndex(function (item) {
                    return item.epoch === row.epoch;
                });
                list[index].enabled = row.enabled;
                storage.saveValue(CONFIG.STORAGE_BLACK_LIST, $filter('clean')($scope.model.domains));
                $scope.run.getDomain();
            },
            add_domain: () => {
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
                $scope.model.domains.push(model);
                storage.saveValue(CONFIG.STORAGE_BLACK_LIST, $filter('clean')($scope.model.domains));
                $scope.run.getDomain();
                $scope.model.domain = null;
            }
        }
        $scope.run.getSetting();
        $scope.run.getDomain();
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
                { desc: '로컬 < 크롬 계정', direction: 'chrome_to_local', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { desc: '로컬 > 클라우드', direction: 'local_to_cloud', count: 0, last: 0, repeat_min: 5, sync_enabled: true },
                { desc: '로컬 < 클라우드', direction: 'cloud_to_local', count: 0, last: 0, repeat_min: 5, sync_enabled: true }
            ],
            identity: undefined,
            history: []
        };


        function lengthInUtf8Bytes(str) {
            const m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        }

        $scope.run = {
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
                // var collection;
                // var variable;
                if ($scope.model.identity['id'] == null) {
                    console.log(222,$scope.model.identity);
                    alert('로그인 정보가 없습니다.');
                    return;
                }
                if (row.direction == 'local_to_chrome') {
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
                                        url: "http://localhost:8888/api/v1/sync",
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
                        url: "http://localhost:8888/api/v1/sync/" + $scope.model.identity.id,
                        method: "GET"
                    }).finally(function () {
                        console.log('finally')
                    }).then(function (response) {
                        response = response.data;
                        if (response.result_msg == "STATUS_NORMAL") {
                            //response.result_data
                            storage.set(response.result_data);
                            console.log('local save ok!');
                            chrome.extension.getBackgroundPage().loadAddDataFromStorage();
                        } else {

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

        // $scope.fileNameChanged = (e) => {
        //     console.log(e)
        // }
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
                console.log($scope.model.copy_modal);
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
                // console.log(rows);
                $scope.$apply();
            })
        }
        $scope.today = function () {
            $scope.model.todal_total_times = 0;
            storage.getValue(CONFIG.STORAGE_TABS, rows => {
                var today = $filter('formatDate')();
                var targetTabs = rows.filter(x => x.days.find(s => s.date === today));
                console.log(today, targetTabs);
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

        $scope.today();

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
