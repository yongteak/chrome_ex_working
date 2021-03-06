// https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/%EC%95%A0%EB%A1%9C%EC%9A%B0_%ED%8E%91%EC%85%98
// function를 생락하고 '=>' 기호 사용하지 말것
// https://stackoverflow.com/questions/47696945/over-function-throwing-me-an-angular-error

angular.module('app.controllers', [])
    .controller('side', ($scope, $location, $rootScope, identity, storage, CONFIG) => {
        $scope.isCurrentPath = path => {
            return $location.path().indexOf(path) != -1;
        };
    })
    .controller('modal', ($scope, $rootScope, identity, storage, CONFIG) => {
        $scope.model = {
            options: {
                category: []
            }
        };

        // 도메인 정보 모달 팝업용
        setTimeout(function () {
            $scope.model.options.category = $rootScope['category'];
            $scope.model.kv = $rootScope['category_kv'];

            $scope.$apply();
            console.log($scope.model);
        }, 500);

        $scope.run = {
            selected: (row, code) => {
                console.log(row,code);
            },
            modalClose: () => {
                $('#domainModal').modal("hide");
            },
        }


    })
    .controller('top', ($rootScope, $scope, $location) => {
        $scope.title = '';
        $rootScope.$on("$locationChangeStart", function (_e, newVal, _old) {
            var path = newVal.split('/').pop();
            if (path == 'setting') {
                $scope.title = '설정';
            } else if (path == 'dashboard') {
                $scope.title = '대시보드';
            } else if (path == 'summary') {
                $scope.title = '집계';
            } else if (path == 'limit') {
                $scope.title = '제한';
            } else if (path == 'alarm') {
                $scope.title = '알람';
            } else if (path == 'data') {
                $scope.title = '백업/복구';
            } else if (path == 'sync') {
                $scope.title = '동기화';
            } else if (path == 'status') {
                $scope.title = '통계';
            } else if (path == 'profile') {
                $scope.title = '사용자 프로필';
            } else if (path == 'about') {
                $scope.title = 'About';
            } else if (path == 'category') {
                $scope.title = '카테고리 분류';
            }
        })
    })
    .controller('profileController', function ($scope, $location) {
    })
    .controller('aboutController', function ($scope, $location) {
    })
