// https://stackoverflow.com/questions/37160354/chrome-storage-sync-get-not-returning-value-angular-services
angular.module('app.services', [])
    .factory('storage', ['$window', '$timeout', function ($window, $timeout) {
        return {
            saveValue: function (name, value) {
                return chrome.storage.local.set({
                    [name]: value
                })
            },
            getValue: function (name, callback) {
                return chrome.storage.local.get(name, function (item) {
                    if (item !== undefined) {
                        callback(item[name]);
                    }
                })
            }
        }
    }])
    .factory('identity', ['$window', '$timeout', function ($window, $timeout) {
        return {
            getUserID: function (callback) {
                chrome.identity.getProfileUserInfo(function (user) {
                    // user.email
                    // user.id : 이메일 계정의 고유 값      
                    return callback(user.id);
                })
            }
        }
    
    }])

