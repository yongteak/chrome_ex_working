angular.module('app.controller.category', [])
    .controller('categoryController', function ($scope, $log, $rootScope, $filter, $timeout, $http, moment, pounch, CONFIG) {
        $scope.model = {
            options:{
                category:[]
            },
            rows:[]
        };



        $scope.run = {
            init:() => {
                // 로컬 카테고리 목록 조회
                // $log.log('>>>',$scope.model.options.category);
                pounch.alldocs(CONFIG.STORAGE_TABS,true).then(docs => {
                    var args = [];
                    if (docs.total_rows > 0) {
                        docs.rows.forEach((d, index) => {
                            var code = d.doc.value.category_code || '000';
                            args.push({ code: code, url: d.doc.value.url});
                            if (index == docs.total_rows - 1) {
                                // [2021-01-07 16:26:30]
                                // todo cache
                                $log.log('end of loop, ready!');
                                // 카테고리 관리용 로컬 도메인 목록 조회
                                pounch.alldocs(CONFIG.STORAGE_CATEGORY,true).then(cats => {
                                    // tab category : 서버 데이터
                                    // 서버 데이터와 중첩되지 않은경우 신규
                                    if (cats.total_rows > 0) {
                                        // {key, code, selection, created, updated}
                                    } else {
                                        // 모두 신규
                                        $scope.run.start(args);
                                    }
                                });
                            }
                        });
                    } else {
                        // throw 아직 아무 데이터도 없음..
                    }
                });
            },
            start:(args) => {
                $scope.model.options.category = $rootScope['category'];
                $scope.model.kv = $scope.model.options.category.data.reduce((acc, cur) => {
                    acc[cur.code] = { ko: cur.ko, en: cur.en};
                    return acc;
                },{});
                $scope.model.rows = args;
            },
            code_to_name:code => {
                return $scope.model.kv[code].ko;
            },
            selected:row => {
                $log.log(row);
            }
        };
        $scope.run.init();
    })
