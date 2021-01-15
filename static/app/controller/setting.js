angular.module('app.controller.setting', [])
    .controller('settingController', function ($scope, $window, $filter, pounch, CONFIG) {

        // 로컬 파일 생성, 해당 내용으로 아이디와 패스워드 구성
        // http://172.24.69.139:5984/114916629141904173371
        var id = '114916629141904173371';
        var pw = '114916629141904173371'.split("").reverse().join("");
        function join() {
            db.signUp(id, pw)
                .then(res => {
                    if (res.ok) {
                        login();
                    }
                }).catch(console.error);
        }
        function login() {
            var db = new PouchDB(CONFIG.COUCHDB_REMOTE_URI + '/g114916629141904173371',
                { skip_setup: true, revs_limit: 5, auto_compaction: true });
            db.login(id, pw)
                .then(res => {
                    console.log('login > ', res);
                    sync();
                }).catch(err => {
                    if (err.name == 'unauthorized') {
                        join()
                    }
                })
        }

        function merge() {
            // pull, merge, push, purge
            new PouchDB('diff_tabs').allDocs({
                include_docs: true
            }).then(local_docs => {
                var diff = {};
                var bulkdocs = [];
                if (local_docs.total_rows > 0) {
                    local_docs.rows.forEach(e => {
                        bulkdocs.push({id:e.doc._id});
                        diff[[e.id]] = e.doc.value;
                    });
                    new PouchDB('tabs').bulkGet({ docs: bulkdocs })
                        .then(docs => {
                            // console.log(docs);
                            docs.results.forEach(res => {
                                var odoc = res.docs[0]['ok'].value;
                                // console.log(odoc);
                                var ddoc = diff[res.id];
                                // console.log(ddoc);
                                if (res.id.match(/^bucket\_/) == null) {
                                    if (odoc.summaryTime !== ddoc.summaryTime) {
                                        ddoc.days.forEach((day, index) => {
                                            // console.log(odoc.days[index])
                                            odoc.days[index].counter = Math.abs(day.counter - odoc.days[index].counter);
                                            odoc.days[index].dataUsage = Math.abs(day.dataUsage - odoc.days[index].dataUsage);
                                            odoc.days[index].summary = Math.abs(day.summary - odoc.days[index].summary);
                                            day.hours.forEach((h,idx) => {
                                                odoc.days[index].hours[idx] =
                                                    Math.abs(h.counter - odoc.days[index].counter);
                                            })
                                        })
                                    }
                                } else if (doc.id == 'bucket_event') {

                                }
                            })
                                // console.log(odoc)
                                // if (doc.id == 'bucket_event') {
                                    // row.value.map(m => m.epoch).indexOf(daytime);


                                //     if (daytime_index == -1) {
                                //     const kv = { 'key': key, 'value': value, 'epoch': Date.now(), 'browser': browser };
                                //     const bucket = 'bucket_event';
                                //     const put = { '_id': bucket, 'value': [kv] };
                                //     doc.value.push(kv);

                                // } else if (tab.id == 'bucket_event') {
                                // } else if (tab.id == 'bucket_event') {
                                // } else {

                                // }

                                // tab.part = tab.days.filter(x => x.date == day)[0];
                                // tabs.push(tab);
                                // $scope.model.totals.times += tab.part.summary;
                                // $scope.model.totals.dataUsage += tab.part.dataUsage;
                                // $scope.model.totals.counter += tab.part.counter;
                            // });
                        })
                        .catch(err => console.error(err));
                }
            });
        }
        merge();





        function sync() {
            // diff_tabs
            var db = new PouchDB(CONFIG.STORAGE_TABS, { revs_limit: 5, auto_compaction: true });
            var url = CONFIG.COUCHDB_REMOTE_URI + '/g114916629141904173371';
            console.log('start sync!', url);
            var opts = { live: false, retry: true };
            db.replicate.from(url).on('complete', info => {
                console.log('from sync ok', info);
                db.sync(url, opts)
                    .on('change', onSyncChange)
                    .on('paused', onSyncPaused)
                    .on('error', onSyncError);
            }).on('error', onSyncError);
        }
        // /^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/;
        // /^admin.*/
        // /^login.*/
        // /^session.*/
        // /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$/

        // var str = 'localhostdfdf';
        // var regexp = /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$/;
        // str.match(regexp);
        // var matches_array = str.match(regexp);

        // login();
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