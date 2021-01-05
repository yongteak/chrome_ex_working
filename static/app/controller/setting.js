angular.module('app.controller.setting', [])
    .controller('settingController', function ($scope, $filter, pounch, CONFIG) {
        $scope.model = {
            blacklist: [],
            domain: null,
            setting: [],
            // activity_detected, badge_icon_info,
            options: {
                activity_detected:
                    [{ name: '사용량', id: 'bandwith_today' },
                    { name: '사용시간', id: 'time_today' },
                    { name: '도메인 사용량', id: 'bandwith_today_by_domain' },
                    { name: '도메인 사용시간', id: 'time_today_by_domain' },
                    { name: '표시하지 않음', id: 'none' }]
            },
            // select: { activity_detected: 'time_today_by_domain' },
            default: { epoch: 0, name: "activity_detected", updated: 0, value: "time_today_by_domain" }
        };
        $scope.run = {
            getSetting: () => {
                pounch.getdoc(CONFIG.BUCKET, CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE).then(items => {
                    console.log(111,items.value);
                    $scope.model.setting = items.value;
                    $scope.model['select'] = { activity_detected: items.value[0].value };
                }).catch(err => {
                    console.error(err);
                    var default_val = $scope.model.default;
                    default_val.epoch = moment().valueOf();
                    default_val.updated = $filter('formatDate')();
                    pounch.setdoc(CONFIG.BUCKET,
                        CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE,
                        [default_val]);
                    $scope.model.setting = [default_val];
                    console.log(333,$scope.model.setting);
                    $scope.model['select'] = { activity_detected: default_val.value };
                });
            },
            getblackList: () => {
                pounch.getdoc(CONFIG.BUCKET, CONFIG.STORAGE_BLACK_LIST).then(e => {
                    console.log(CONFIG.STORAGE_BLACK_LIST, ' > ', e.value);
                    $scope.model.blacklist = e.value.sort((a, b) => { return b.epoch - a.epoch });
                    console.log($scope.model.blacklist);
                    // $scope.$apply();
                }).catch(_err => {
                    console.error(_err)
                });
            },
            selected: (field, _item) => {
                var items = $scope.model.setting;
                var item = items.find(s => s.name == field);
                item.value = $scope.model.select[field];
                item.epoch = moment().valueOf();
                item.updated = $filter('formatDate')();
                pounch.setdoc(CONFIG.BUCKET, CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE, [item])
                    .then(res => {
                        $scope.run.getSetting();
                    }).catch(err => {
                        console.error(err);
                    });
            },
            // clear: () => {
            //     storage.saveValue(CONFIG.STORAGE_BLACK_LIST, null);
            // },
            remove: (row) => {
                if (confirm('삭제하시겠습니까?')) {
                    var list = $scope.model.blacklist;
                    const index = list.findIndex(function (item) {
                        return item.epoch === row.epoch;
                    });

                    if (index !== -1) {
                        list.splice(index, 1);
                    } else {
                        // throw error
                    }

                    pounch.setdoc(CONFIG.BUCKET,
                        CONFIG.STORAGE_BLACK_LIST,
                        $scope.model.blacklist)
                        .then(res => {
                            console.log('STORAGE_BLACK_LIST > ', res);
                            $scope.run.getblackList();
                            chrome.extension.getBackgroundPage().loadBlackList();
                        }).catch(err => {
                            console.error(err);
                        });
                    chrome.extension.getBackgroundPage().loadBlackList();
                    $scope.run.getblackList();
                } else {
                    //
                }
            },
            enabledChange: row => {
                var list = $scope.model.blacklist;
                const index = list.findIndex(function (item) {
                    return item.epoch === row.epoch;
                });
                list[index].enabled = row.enabled;
                list[index].updated = $filter('formatDate')();
                pounch.setdoc(CONFIG.BUCKET,
                    CONFIG.STORAGE_BLACK_LIST,
                    $scope.model.blacklist)
                    .then(res => {
                        console.log('STORAGE_BLACK_LIST > ', res);
                        $scope.run.getblackList();
                        chrome.extension.getBackgroundPage().loadBlackList();
                    }).catch(err => {
                        console.error(err);
                    });
                chrome.extension.getBackgroundPage().loadBlackList();
                $scope.run.getblackList();
            },
            add_domain: () => {
                var list = $scope.model.blacklist;
                var find_domain = list.find(s => s.domain == $scope.model.domain);
                var isNewDomain = find_domain == undefined;
                if (!isNewDomain) {
                    alert('이미 등록된 도메인 입니다.')
                    return;
                }
                var model = {
                    domain: $scope.model.domain,
                    created: isNewDomain ? $filter('formatDate')() : find_domain.created,
                    updated: $filter('formatDate')(),
                    epoch: isNewDomain ? moment().valueOf() : find_domain.epoch,
                    enabled: true
                };
                $scope.model.blacklist.push(model);
                pounch.setdoc(CONFIG.BUCKET,
                    CONFIG.STORAGE_BLACK_LIST,
                    $scope.model.blacklist)
                    .then(res => {
                        console.log('STORAGE_BLACK_LIST > ', res);
                        $scope.run.getblackList();
                        chrome.extension.getBackgroundPage().loadBlackList();
                    }).catch(err => {
                        console.error(err);
                    });
            }
        }
        $scope.run.getSetting();
        $scope.run.getblackList();
    })