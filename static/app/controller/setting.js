angular.module('app.controller.setting', [])
    .controller('settingController', function ($scope, $filter, pounch, CONFIG) {

        // 로컬 파일 생성, 해당 내용으로 아이디와 패스워드 구성
        // http://172.24.69.139:5984/114916629141904173371
        var id = '114916629141904173371';
        var pw = '114916629141904173371'.split("").reverse().join("");

        // var db = new PouchDB('http://172.24.69.139:5984/114916629141904173371',
        //     { skip_setup: true, revs_limit: 1, auto_compaction: true });
        // db.login(id, pw)
        //     .then(res => {
        //         console.log(res);
        //     }).catch(err => {
        //         if (err.name == 'unauthorized') {
        //             // 회원가입 시도후 계속 오류가 발생할경우 down
        //             db.signUp(id, pw)
        //             .then(res => {
        //                 if (res.ok) {
        //                     // login
        //                 }
        //             }).catch(err => {
        //                 console.error('signup!',err);
        //             });
        //             //     console.log(err, response);
        //             //     if (err) {
        //             //         if (err.name === 'conflict') {
        //             //             // "batman" already exists, choose another username
        //             //         } else if (err.name === 'forbidden') {
        //             //             // invalid username
        //             //         } else {
        //             //             // HTTP error, cosmic rays, etc.
        //             //         }
        //             //     }
        //             //     var local = new PouchDB(CONFIG.STORAGE);
        //             //     local.sync(db, { live: true, retry: true }).on('error', console.log.bind(console));
        //             // });
        //         }
        //     });


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
                pounch.getbucket(CONFIG.STORAGE_SETTINGS_VIEW_TIME_IN_BADGE).then(item => {
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
                    // console.log(CONFIG.STORAGE_BLACK_LIST, ' > ', e);
                    $scope.model.blacklist = e.sort((a, b) => { return b.epoch - a.epoch });
                }).catch(console.error);
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
                            console.log('STORAGE_BLACK_LIST > ', res);
                            $scope.run.getblackList();
                            chrome.extension.getBackgroundPage().loadBlackList();
                        }).catch(console.error);;
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
                pounch.setbucket(CONFIG.STORAGE_BLACK_LIST, $scope.model.blacklist)
                    .then(res => {
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
                pounch.setbucket(CONFIG.STORAGE_BLACK_LIST, $scope.model.blacklist)
                    .then(res => {
                        console.log('STORAGE_BLACK_LIST > ', res);
                        $scope.run.getblackList();
                        chrome.extension.getBackgroundPage().loadBlackList();
                    }).catch(console.error);
            }
        }
        $scope.run.getSetting();
        $scope.run.getblackList();
    })