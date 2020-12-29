angular.module('app.controller.setting', [])
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
                    [{ name: '사용량', id: 'bandwith_today' },
                    { name: '사용시간', id: 'time_today' },
                    { name: '도메인 사용량', id: 'bandwith_today_by_domain' },
                    { name: '도메인 사용시간', id: 'time_today_by_domain' },
                    { name: '표시하지 않음', id: 'none' }]
            },
            select: { activity_detected: 'time_today_by_domain' }
        };
        $scope.run = {
            getSetting: () => {
                storage.getValue(CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE, e => {
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
                storage.saveValue(CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE, $scope.model.setting);
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
                // chrome.extension.getBackgroundPage().loadBlackList();
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
                    created: isNewDomain ? $scope.model.today : find_domain.created,
                    updated: $scope.model.today,
                    epoch: isNewDomain ? moment().valueOf() : find_domain.epoch,
                    enabled: true
                };
                $scope.model.domains.push(model);
                storage.saveValue(CONFIG.STORAGE_BLACK_LIST, $filter('clean')($scope.model.domains));
                $scope.run.getDomain();
                $scope.model.domain = null;
                chrome.extension.getBackgroundPage().loadBlackList();
            }
        }
        $scope.run.getSetting();
        $scope.run.getDomain();
    })