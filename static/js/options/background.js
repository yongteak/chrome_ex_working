// TODO
// 할일들

// FIXME
// 수정할것들
chrome.runtime.onStartup.addListener(function() {
    console.log("@@onStartup");
    // you can add more and more dependencies as long as it is declared in the manifest.json
    var backgroundModule = angular.module('backgroundModule', ['customServices']);
    console.log("onStartup");

    // since we don't have any html doc to use ngApp, we have to bootstrap our angular app from here
    // angular.element(document).ready(function() {
    //     angular.bootstrap(document, ['backgroundModule']);
    // });
    $scope.$on('$viewContentLoaded', function() {
        angular.bootstrap(document, ['backgroundModule']);
        console.log("viewContentLoaded");
        // $timeout(function(){
        //     //Do your stuff
        // });
    });

    backgroundModule.run(function($scope, $http) {
        console.log("backgroundModule run");
        // do some stuffs here
        // chrome.app.window.create('views/mainTemplate.html', {
        //     'bounds': {
        //         'width': window.screen.availWidth,
        //         'height': window.screen.availWidth
        //     },
        //     'state': 'maximized'
        // });
    });

});