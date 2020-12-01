// https://developer.chrome.com/extensions/storage
'use strict';

class LocalStorage {
    loadTabs(name, callback, callbackIsUndefined) {
        chrome.storage.local.get(name, item => {
            if (item[name] !== undefined) {
                var result = item[name];
                if (result !== undefined)
                    callback(result);
            } else {
                if (callbackIsUndefined !== undefined)
                    callbackIsUndefined();
            }
        });
    }

    clearTabs() {
        chrome.storage.local.clear(() => {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            }
        });
    }

    saveTabs(value, callback) {
        chrome.storage.local.set({ tabs: value });
        if (callback !== undefined)
            callback();
    }

    saveValue(name, value) {
        chrome.storage.local.set({
            [name]: value
        });
    }

    getValue(name, callback) {
        chrome.storage.local.get(name, item => {
            if (item !== undefined) {
                callback(item[name]);
            }
        });
    }

    getMemoryUse(name, callback) {
        chrome.storage.local.getBytesInUse(name, callback);
    };
}

// tabs