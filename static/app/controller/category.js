angular.module('app.controller.category', [])
    .controller('categoryController', function ($scope, $window, $rootScope, $filter, identity, $http, moment, pounch, CONFIG) {
        $scope.model = {
            options: {
                category: []
            },
            select:[],
            rows: []
        };
        $scope.run = {
            init: () => {
                //
                // 서버에서 동기화된 tab
                pounch.alldocs(CONFIG.STORAGE_TABS, true).then(docs => {
                    var args = [];
                    console.log(docs);
                    if (docs.total_rows > 0) {
                        // console.log(docs.rows);
                        docs.rows.forEach((d, index) => {
                            if (d.id !== CONFIG.BUCKET) {
                                args.push(d.doc.value.url);
                            }
                            if (index == docs.total_rows - 1) {
                                $scope.run.start(args);
                            }
                        });
                    } else {
                        // throw 아직 아무 데이터도 없음..
                    }
                });
            },
            start: (args) => {
                identity.getUserID(userInfo => {
                    if (userInfo.hasOwnProperty('id')) {
                        $http({
                            url: CONFIG.URI + '/analytics/category',
                            method: "POST",
                            data: { urls: args, user_id: userInfo.id }
                        }).then(response => {
                            response = response.data;
                            if (response.result_msg == "STATUS_NORMAL") {
                                $scope.model.options.category = $rootScope['category'];
                                $scope.model.kv = $scope.model.options.category.data.reduce((acc, cur) => {
                                    acc[cur.code] = { ko: cur.ko, en: cur.en };
                                    return acc;
                                }, {});
                                $scope.model.rows = response.result_data;
                                $scope.model.rows.forEach( (e,index) => {
                                    $scope.model.select[index] = e.code || "000";
                                });
                                // console.log($scope.model.select);
                                // $scope.model.select
                                console.log($scope.model.rows);
                            } else {
                                alert('서버 오류');
                            }
                        }).catch(console.error)
                    } else {
                        alert('사용자 정보가 존재하지 않습니다.');
                    }
                });
            },
            code_to_name: code => {
                code = code || '000';
                return $scope.model.kv[code].ko;
            },
            selected: (row, code) => {
                identity.getUserID(userInfo => {
                    console.log(userInfo,row, code)
                    if (userInfo.hasOwnProperty('id')) {
                        $http({
                            url: CONFIG.URI + '/analytics/category',
                            method: "PUT",
                            data: { url: row.url, code:code, user_id: userInfo.id }
                        }).then(response => {
                            response = response.data;
                            if (response.result_msg == "STATUS_NORMAL") {
                                console.log(response.result_data);
                            } else {
                                alert('서버 오류');
                            }
                        }).catch(console.error)
                    } else {
                        alert('사용자 정보가 존재하지 않습니다.');
                    }
                })
            },
            open:url => {
                $window.open('https://'+url);
            }
        };
        $scope.run.init();
    })
