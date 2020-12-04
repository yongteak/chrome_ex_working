// https://developer.chrome.com/extensions/storage
/*
[2020-12-05 00:10:43]
 - 동기화
  1. 클라우드 로드
  2. 로컬 관리
  3. 클라우드 로드및 마지막 동기화 시간 flag확인
  4. 로컬 -> 클라우드 복제
*/
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

    // [2020-12-03 04:59:13]
    // 동기화할려면 최적화 필요
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