angular.module('app.controller.alarm', [])
    .controller('alarmController', function ($scope, $filter, pounch, CONFIG) {
        const today = $filter('formatDate')();
        $scope.model = {
            is_new: true,
            title: '알람 설정 추가하기',
            alarms: [],
            history: [],
            copy_modal: {},
            options: [
                { name: '화면 정중앙', id: 'center' },
                { name: '화면 상단', id: 'top' },
                { name: '화면 하단', id: 'bottom' },
                { name: '화면 전환', id: 'move' }
            ],
            select: "center",
            modal: {
                type: 'time',// time, data
                value: 3,// hours, MegaByte
                remind: true,
                repeat: false,
                position: 'center',//top, bottom
                message: '오늘은 여기까지! 조금 쉬도록 하세요~',
                count: 0,
                created: today,
                updated: today,
                epoch: null,
                enabled: true
            },

        };

        $scope.resetToastPosition = function () {
            $('.jq-toast-wrap').removeClass('.alert-notification-wrapper bottom-left bottom-right top-left top-right mid-center'); // to remove previous position class
            $(".jq-toast-wrap").css({
                "top": "",
                "left": "",
                "bottom": "",
                "right": ""
            });
            $(this).parentsUntil(".alert-notification-wrapper").slideToggle();
        }

        $scope.run = {
            preview: row => {
                'use strict';
                $scope.resetToastPosition();
                $.toast({
                    heading: '설정된 알람 미리 보기',
                    icon: 'error',
                    text: 'Specify the custom position object or use one of the predefined ones',
                    allowToastClose: true,
                    position: 'top-right',
                    sticky: true,
                    loader: false,
                    loaderBg: '#00e093'
                });


                // toggleAlertNotificationTop() {
                $("body").append('\
            <div class="alert-notification-wrapper top">\
                <div class="alert-notification dismissible-alert">\
                    <p><b>알려드립니다!&nbsp;</b>지정하신 알람 시간이 되었습니다! 닫기버튼을 누르면 초기화됩니다. </p>\
                    <i class="alert-close mdi mdi-close"></i>\
                </div>\
            </div>\
        ');
                $(".alert-notification-wrapper .dismissible-alert .alert-close").on("click", function () {
                    $(this).parentsUntil(".alert-notification-wrapper").slideToggle();
                });
                // $(".alert-notification-wrapper .dismissible-alert .alert-close").on("click", function () {
                //     $(this).parentsUntil(".alert-notification-wrapper").slideToggle();
                // });
                // }

            },
            init_modal: () => {
                $scope.model.select = "center";
                $scope.model.modal = {
                    type: 'time',// time, data
                    value: 5,// hours, MegaByte
                    remind: true,
                    repeat: false,
                    position: 'center',//top, bottom
                    message: '오늘은 여기까지! 조금 쉬도록 하세요~',
                    count: 0,
                    created: today,
                    updated: today,
                    epoch: null,
                    enabled: true
                }
            },
            selected: _item => {
                if ($scope.is_new) {
                    $scope.model.modal.position = $scope.model.select;
                } else {
                    $scope.model.copy_modal.position = $scope.model.select;
                }
            },
            open_modal: row => {
                if (row == undefined) {
                    $scope.run.init_modal();
                    $scope.model.copy_modal = null;
                } else {
                    $scope.model.copy_modal = angular.copy(row);
                    $scope.model.select = $scope.model.copy_modal.position;
                }
                $scope.model.is_new = row == undefined;
                $scope.model.title = $scope.model.is_new ? '알람 추가하기' : '알람 수정하기';
            },
            enabledChange: (row, field) => {
                var list = $scope.model.alarms;
                const index = list.findIndex(item => {
                    return item.epoch === row.epoch;
                });
                list[index][field] = row[field];
                pounch.setbucket(CONFIG.STORAGE_ALARM_LIST,
                    $filter('clean')($scope.model.alarms))
                    .then(_res => {
                        $scope.run.getAlarms();
                    }).catch(console.error);
            },
            modalClose: () => {
                $scope.run.init_modal();
                $('#domainModal').modal("hide");
            },
            remove_alarm: () => {
                if (confirm('삭제하시겠습니까?')) {
                    var row = $scope.model.copy_modal;
                    var list = $scope.model.alarms;
                    const index = list.findIndex(item => {
                        return item.epoch === row.epoch;
                    });

                    if (index !== -1) {
                        list.splice(index, 1);
                    } else {
                        // throw error
                        console.log('error! 삭제할 데이터가 없다!!');
                    }

                    pounch.setbucket(CONFIG.STORAGE_ALARM_LIST,
                        $filter('clean')(list))
                        .then(_res => {
                            $scope.run.getAlarms();
                        }).catch(console.error);
                    $('#domainModal').modal("hide");
                } else {
                    //
                }
            },
            update_alarm: () => {
                var list = $scope.model.alarms;
                var modal = $scope.model.copy_modal;
                if (parseInt(modal.value) <= 0 || isNaN(parseInt(modal.value))) {
                    alert('시간(Hours)또는 데이터 용량(GB)을 정수(0이상)으로 입력해주세요.')
                } else {
                    var find_domain = list.find(s => s.epoch == modal.epoch);
                    if (find_domain == undefined) {
                        alert('항목을 수정할 수 없습니다.')
                    } else {
                        for (var p in modal) {
                            find_domain[p] = modal[p];
                        }
                        pounch.setbucket(CONFIG.STORAGE_ALARM_LIST,
                            $filter('clean')(list))
                            .then(_res => {
                                $scope.model.copy_modal = null;
                                $scope.run.getAlarms();
                            }).catch(console.error);
                    }
                    $('#domainModal').modal("hide");
                }
            },
            add_alarm: () => {
                var modal = $scope.model.modal;

                if (parseInt(modal.value) <= 0 || isNaN(parseInt(modal.value))) {
                    alert('시간(Hours)또는 데이터 용량(GB)을 정수(0이상)으로 입력해주세요.')
                } else {

                    modal.created = today;
                    modal.updated = today;
                    modal.count = 0;
                    modal.epoch = moment().valueOf()
                    modal.enabled = true;

                    $scope.model.alarms.push(modal);
                    pounch.setbucket(CONFIG.STORAGE_ALARM_LIST,
                        $filter('clean')($scope.model.alarms))
                        .then(_res => {
                            $scope.run.init_modal();
                            $scope.run.getAlarms();
                        }).catch(console.error);
                    $('#domainModal').modal("hide");
                }
            },
            getAlarms: () => {
                pounch.getbucket(CONFIG.STORAGE_ALARM_LIST).then(doc => {
                    $scope.model.alarms = doc.sort((a, b) => { return b.epoch - a.epoch });
                }).catch(console.error);
            }
        };
        $scope.run.getAlarms();
    })