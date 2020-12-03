// https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/%EC%95%A0%EB%A1%9C%EC%9A%B0_%ED%8E%91%EC%85%98
// function를 생락하고 '=>' 기호 사용하지 말것
// https://stackoverflow.com/questions/47696945/over-function-throwing-me-an-angular-error

angular.module('app.controllers', [])
    .controller('side', ($scope, $location) => {
        $scope.isCurrentPath = path => {
            return $location.path().indexOf(path) != -1;
        };
    })
    .controller('view', $scope => {
        // $scope.count = 0;
        console.log("view!");

        $scope.init = () => {
            console.log("view > init!");
        }
    })
    .controller('settingController', function ($scope, $location,$filter, identity,storage,CONFIG) {
        // console.log(CONFIG);
        // storage.getValue(CONFIG.STORAGE_TABS, e => {
        //     // console.log(e)
        // });
    })
    .controller('limitController', function ($scope, $location) {
    })
    .controller('alarmController', function ($scope, $location) {
    })
    .controller('dataController', function ($scope, $location) {
    })
    .controller('syncController', function ($scope, $location) {
    })
    .controller('statusController', function ($scope, $location) {
    })
    .controller('profileController', function ($scope, $location) {
    })
    .controller('aboutController', function ($scope, $location) {
    })
