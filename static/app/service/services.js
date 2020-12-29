// https://stackoverflow.com/questions/37160354/chrome-storage-sync-get-not-returning-value-angular-services
angular.module('app.services', [])
    .factory('storage', ['$window', '$timeout', function ($window, $timeout) {
        return {
            getMemoryUse: function (name, callback) {
                return chrome.storage.local.getBytesInUse(name, callback);
            },
            saveValue: function (name, value) {
                console.log('# service.storage.saveValue > ', name);
                return chrome.storage.local.set({
                    [name]: value
                })
            },
            set: function (items) {
                console.log('# service.storage.set > ', items);
                return chrome.storage.local.set(items);
            },
            getValue: function (name, callback) {
                console.log('# service.storage.getValue > ', name);
                return chrome.storage.local.get(name, function (item) {
                    if (item !== undefined) {
                        callback(item[name]);
                    }
                })
            },
            clear: function (callback) {
                console.log('# service.storage.clear');
                return chrome.storage.local.clear(function () {
                    callback();
                })
            },
            saveValueSync: function (name, value) {
                console.log('# service.storage.saveValueSync > ', name);
                return chrome.storage.sync.set({
                    [name]: value
                })
            },
            getValueSync: function (name, callback) {
                console.log('# service.storage.getValueSync');
                return chrome.storage.sync.get(name, function (item) {
                    if (item !== undefined) {
                        callback(item[name]);
                    }
                })
            },
            clearSync: function (callback) {
                return chrome.storage.sync.clear(function () {
                    callback();
                })
            },
        }
    }])
    .factory('identity', ['$window', '$timeout', function ($window, $timeout) {
        return {
            getUserID: function (callback) {
                chrome.identity.getProfileUserInfo(function (user) {
                    return callback(user);
                })
            }
        }
    
    }])

