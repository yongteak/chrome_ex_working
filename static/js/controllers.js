// https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/%EC%95%A0%EB%A1%9C%EC%9A%B0_%ED%8E%91%EC%85%98
angular.module('app.controllers', [])
    .controller('view', function ($scope, $interval, $filter, identity, storage) {
        // $scope.count = 0;
        $scope.model = 'req';
       
        var times = 60;
        var promise = $interval(
            function () {
                var retry = 60 - (times++);
                $scope.retryMessage = retry + " seconds";
                if (retry == 30) { //cancel in 30 seconds instead .. for some reason
                    $interval.cancel(promise);
                }
                // alert($scope.retryMessage)
            }, 1000, 10);

        $scope.$on('$viewContentLoaded', () => {
            console.log("viewContentLoaded");
        });

        $scope.init = () => {
            console.log("view > init!");
            // alert('1');
            identity.getUserID(userID => {
                $scope.userID = userID;
                // alert(userID);
                storage.saveValue("test", userID);

                if (!$filter('isEmpty')(userID)) {
                    // 계정 설정 메세지
                } else {
                    // 최초 실행인경우 setup 시작
                }
            });

        };

        storage.getValue("test", e => {
            console.log(e)

            $scope.alerts = [
                { type: 'danger', msg: e },
                // { type: 'danger', msg: 'Oh snap! Change a few things up and try submitting again.' },
                { type: 'success', msg: 'Well done! You successfully read this important alert message.' }
            ];

            $scope.addAlert = function () {
                $scope.alerts.push({ msg: $scope.retryMessage });
            };

            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };

        });

    });