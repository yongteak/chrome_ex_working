angular.module('app.controller.setting', [])
    .controller('settingController', function ($scope, $window, $filter, pounch, CONFIG) {

        // 로컬 파일 생성, 해당 내용으로 아이디와 패스워드 구성
        // http://172.24.69.139:5984/114916629141904173371

        // /^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/;
        // /^admin.*/
        // /^login.*/
        // /^session.*/
        // /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$/

        // var str = 'localhostdfdf';
        // var regexp = /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$/;
        // str.match(regexp);
        // var matches_array = str.match(regexp);


        $scope.model = {
            blacklist: [],
            domain: null,
            setting: [],
            blacks: {
                loopback: false,
                ipaddr: false,
                sub_admin: false,
                sub_login: false,
                sub_session: false,
                sub_test: false,
                sub_demo: false
            },
            // activity_detected, badge_icon_info,
            options: {
                activity_detected:
                    [{ name: '데이터 사용량', id: 'bandwith_today' },
                    { name: '사용 시간', id: 'time_today' },
                    // { name: '도메인 사용량', id: 'bandwith_today_by_domain' },
                    // { name: '도메인 사용시간', id: 'time_today_by_domain' },
                    // { name: '표시하지 않음', id: 'none' }
                ]
            },
            // select: { activity_detected: 'time_today_by_domain' },
            default: { epoch: 0, name: "activity_detected", updated: 0, value: "time_today" }
        };
        $scope.run = {
            getSetting: () => {
                pounch.getbucket(CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE).then(item => {
                    item = $filter('clean')(item);
                    $scope.model.setting = items.value;
                    $scope.model['select'] = { activity_detected: items.value[0].value };
                }).catch(err => {
                    var default_val = $scope.model.default;
                    default_val.epoch = moment().valueOf();
                    default_val.updated = $filter('formatDate')();

                    pounch.setbucket(CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE, [default_val]);
                    $scope.model.setting = [default_val];
                    $scope.model['select'] = { activity_detected: default_val.value };
                });
            },
            getblackList: () => {
                pounch.getbucket(CONFIG.STORAGE_BLACK_LIST).then(e => {
                    // console.log(CONFIG.STORAGE_BLACK_LIST, ' > ', $filter('clean')(e));
                    e = $filter('clean')(e);
                    $scope.model.blacklist = e.sort((a, b) => { return b.epoch - a.epoch });
                }).catch(console.error);
            },
            getBlacks: (row) => {
                pounch.getbucket(CONFIG.STORAGE_BLACK_ELEMENT).then(e => {
                    if ($filter('isEmpty')(e)) {
                        for (let p in $scope.model.blacks) {
                            $scope.model.blacks[p] = true;
                        }
                    } else {
                        $scope.model.blacks = e;
                    }
                }).catch(console.error);
            },
            blacks: (row) => {
                pounch.setbucket(CONFIG.STORAGE_BLACK_ELEMENT, row)
                    .then(e => {
                        chrome.extension.getBackgroundPage().loadBlackList();
                    }).catch(console.error)
                $scope.model.blacks = row;
            },
            selected: (field, _item) => {
                var items = $scope.model.setting;
                var item = items.find(s => s.name == field);
                item.value = $scope.model.select[field];
                item.epoch = moment().valueOf();
                item.updated = $filter('formatDate')();
                pounch.setbucket(CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE, [item])
                    .then(res => {
                        $scope.run.getSetting();
                        chrome.extension.getBackgroundPage().loadViewBadge();
                    }).catch(console.error)
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

                    pounch.setbucket(CONFIG.STORAGE_BLACK_LIST, $scope.model.blacklist)
                        .then(res => {
                            $scope.run.getblackList();
                            chrome.extension.getBackgroundPage().loadBlackList();
                        }).catch(console.error);;
                } else {
                    //
                }
            },
            enabledChange: row => {
                var list = $filter('clean')($scope.model.blacklist);
                const index = list.findIndex(item => item.epoch === row.epoch);
                list[index].enabled = row.enabled;
                list[index].updated = $filter('formatDate')();
                pounch.setbucket(CONFIG.STORAGE_BLACK_LIST, $scope.model.blacklist)
                    .then(_res => {
                        $scope.run.getblackList();
                        chrome.extension.getBackgroundPage().loadBlackList();
                    }).catch(console.error);
            },
            add_domain: () => {
                var list = $scope.model.blacklist;
                var find_domain = list.find(s => s.domain == $scope.model.domain);
                var isNewDomain = find_domain == undefined;
                if (!isNewDomain) {
                    alert('이미 등록된 도메인 입니다.')
                    return;
                }
                $scope.model.blacklist.push({
                    domain: $scope.model.domain,
                    created: isNewDomain ? $filter('formatDate')() : find_domain.created,
                    updated: $filter('formatDate')(),
                    epoch: isNewDomain ? moment().valueOf() : find_domain.epoch,
                    enabled: true
                });
                pounch.setbucket(CONFIG.STORAGE_BLACK_LIST, $filter('clean')($scope.model.blacklist))
                    .then(res => {
                        $scope.model.domain = "";
                        $scope.run.getblackList();
                        chrome.extension.getBackgroundPage().loadBlackList();
                    }).catch(console.error);
            },
            open: () => {
                var url = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match';
                $window.open(url, '_blank');
            }
        }
        $scope.run.getSetting();
        $scope.run.getBlacks();
        $scope.run.getblackList();
    })