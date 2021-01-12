angular.module('app.controller.limit', [])
    .controller('limitController', function ($scope, $filter, pounch, CONFIG) {
        const today = $filter('formatDate')();
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
                list[index].updated = today;
                // storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                pounch.setbucket(CONFIG.STORAGE_RESTRICTION_LIST,
                    $filter('clean')($scope.model.domains))
                    .then(_res => {
                        $scope.run.init_modal();
                        $scope.run.getDomain();
                        chrome.extension.getBackgroundPage().loadRestrictionList();
                    }).catch(console.error);
            },
            modalClose: () => {
                $('#domainModal').modal("hide");
            },
            export_csv: () => {
                // console.log('export_csv!');
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

                    // storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                    pounch.setbucket(CONFIG.STORAGE_RESTRICTION_LIST,
                        $filter('clean')($scope.model.domains))
                        .then(_res => {
                            $scope.run.init_modal();
                            $scope.run.getDomain();
                            chrome.extension.getBackgroundPage().loadRestrictionList();
                        }).catch(console.error);
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
                    // storage.saveValue(CONFIG.STORAGE_RESTRICTION_LIST, $filter('clean')($scope.model.domains));
                    // init_modal();
                    pounch.setbucket(CONFIG.STORAGE_RESTRICTION_LIST,
                        $filter('clean')($scope.model.domains))
                        .then(_res => {
                            $scope.run.init_modal();
                            $scope.run.getDomain();
                            chrome.extension.getBackgroundPage().loadRestrictionList();
                        }).catch(console.error);
                    $scope.model.copy_modal = null;
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
                pounch.setbucket(CONFIG.STORAGE_RESTRICTION_LIST,
                    $filter('clean')($scope.model.domains))
                    .then(_res => {
                        $scope.run.init_modal();
                        $scope.run.getDomain();
                        chrome.extension.getBackgroundPage().loadRestrictionList();
                    }).catch(err => {
                        console.error(err);
                    });
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
                pounch.getbucket(null, 'restriction_access_list')
                        .then(doc => {
                            $scope.model.history = doc.value;
                            console.log(doc.value);
                        })
                        .catch(console.error)

                // pounch.getbucket(CONFIG.STORAGE_RESTRICTION_ACCESS_LIST).then(doc => {
                //     // console.log('STORAGE_RESTRICTION_ACCESS_LIST',items);
                //     $scope.model.history = doc.sort((a, b) => { return b.epoch - a.epoch });
                //     $scope.model.setting = [doc];
                // }).catch(console.error);

                pounch.getbucket(CONFIG.STORAGE_RESTRICTION_LIST).then(doc => {
                    console.log('STORAGE_RESTRICTION_LIST',doc);
                    $scope.model.domains = doc.sort((a, b) => { return b.epoch - a.epoch });
                }).catch(console.error);
            },
            open: row => {
                console.log(row);
            }
        };
        $scope.run.getDomain();
    })