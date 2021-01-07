angular.module('app.controller.category', [])
    .controller('categoryController', function ($scope, $log, $rootScope, $filter, identity, $http, moment, pounch, CONFIG) {
        $scope.model = {
            options: {
                category: []
            },
            rows: []
        };
        $scope.run = {
            init: () => {
                // 서버에서 동기화된 tab
                pounch.alldocs(CONFIG.STORAGE_TABS, true).then(docs => {
                    var args = [];
                    if (docs.total_rows > 0) {
                        docs.rows.forEach((d, index) => {
                            // 정기적으로 업로드될때 사용자 id: 카테고리 code 정보를 서버에서 관리함
                            //
                            var code = d.doc.value.category_code || '000';
                            // args.push({ code: code, url: d.doc.value.url });
                            args.push(d.doc.value.url);
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
                                $scope.model.options.category = $rootScope['category'];
                                $scope.model.kv = $scope.model.options.category.data.reduce((acc, cur) => {
                                    acc[cur.code] = { ko: cur.ko, en: cur.en };
                                    return acc;
                                }, {});
                                $scope.model.rows = response.result_data;
                                console.log($scope.model.rows);
                            } else {
                                alert('서버 오류');
                            }
                        }).catch(console.error)
                    } else {
                        alert('사용자 정보가 존재하지 않습니다.');
                    }
                })
            }
        };
        $scope.run.init();
    })
