/*
[2020-12-01 13:17:40]
Useage.js에서 수집되는 데이터와 통합 필요
*/
'use strict';

function reload_tab() {
    chrome.tabs.query({ url: "*://data.similarweb.com/api/*" }, tab => {
        tab.forEach(t => {
            chrome.tabs.reload(t.id, { bypassCache: true }, () => { console.log('reload tabs') });
        })
        // console.log(4444,tab);
    });
}

function open_tab(domains) {
    domains.forEach(d => {
        chrome.tabs.create({
            url: "https://data.similarweb.com/api/v1/data?domain=" + d,
            active: false
        });
    });
}
function get_reports(callback) {
    chrome.tabs.query({ url: "*://data.similarweb.com/api/*", status: "complete" }, tab => {
        tab.forEach(t => {
            chrome.tabs.sendMessage(t.id, { req: EVENT_SIMILARWEB_REPORT }, response => {
                callback(t.url, response);
                // console.log(t.status);
                // t.status = 'end_of_task';
                chrome.tabs.remove(t.id, () => console.log('close', response))
            });
        })
        // console.log(4444,tab);
    });
}

// pounchdb
var db;
var tabs;
// var timeIntervalList;
var currentTab;
// var isNeedDeleteTimeIntervalFromTabs = false;
var activity = new Activity();
var storage = new LocalStorage();

var setting_black_list;
var setting_restriction_list;
var setting_restriction_access_list
var setting_interval_sync_upload;
var setting_interval_inactivity;
var setting_view_in_badge;

var setting_notification_list;
var setting_notification_message;

var identity;

var isHasPermissioForYouTube;
var isHasPermissioForNetflix;
var isHasPermissioForNotification;

function updateSummaryTime() {
    setInterval(backgroundCheck, SETTINGS_INTERVAL_CHECK_DEFAULT);
}

function updateStorage() {
    setInterval(backgroundUpdateStorage, SETTINGS_INTERVAL_SAVE_STORAGE_DEFAULT);
}

function backgroundCheck() {
    const today = formatDate();
    chrome.windows.getLastFocused({ populate: true }, function (currentWindow) {
        if (currentWindow.focused) {
            var activeTab = currentWindow.tabs.find(t => t.active === true);
            if (activeTab !== undefined && activity.isValidPage(activeTab)) {
                var activeUrl = activity.extractHostname(activeTab.url);
                var tab = activity.getTab(activeUrl);
                // [2021-01-08 15:45:30]
                // db저장시간이 오래걸릴경우 문제생김
                if (tab === undefined) {
                    db.get(activeUrl).then(doc => {
                        // 기존 데이터가 있는경우 push
                        console.log('db데이터 로드')
                        tabs.push(prevTab(doc.value));
                        tab = activity.getTab(activeUrl);
                        backgroundCheck2(tab, activeUrl, activeTab);
                    }).catch(err => {
                        // if (error.status == '404') {}
                        console.log('신규 tab 객체 생성');
                        activity.addTab(activeTab);
                        tab = activity.getTab(activeUrl);
                        backgroundCheck2(tab, activeUrl, activeTab);
                    });
                } else {
                    backgroundCheck2(tab, activeUrl, activeTab);
                }
            }
        }
    })
}

/*
    blacklist에 포함된경우 tab객체를 새로 생성하지 않음
*/
function backgroundCheck2(tab, activeUrl, activeTab) {
    var today = formatDate();
    var isBlackList = activity.isInBlackList(activeUrl);
    var isLimitList = activity.isLimitExceeded(activeUrl);
    var domain = activity.extractHostname(activeUrl);
    var epoch = Math.round(Date.now() / 1000);
    // console.log('isBlackList', isBlackList, 'isLimitList', isLimitList);

    //  추적 금지
    // [2020-12-08 22:19:34]
    // badge 표현 설정 필요
    if (isBlackList || isLimitList) {
        if (isBlackList) {
            // [2021-01-12 14:50:31]
            // 1분단위로 마킹한다.
            db.get('bucket_blacklist_access').then(doc => {
                var index = doc.value.findIndex(e => e.url == domain && e.date == today);
                if (index == -1) {
                    doc.value.push({ 'url': domain, 'date': today, 'count': 1, epoch: epoch});
                    db.put(doc).then(console.log).catch(console.error);
                } else {
                    // 1분이후 등록
                    if (epoch - doc.value[index].epoch >= 60) {
                        doc.value[index].count++;
                        doc.value[index].epoch = epoch;
                        db.put(doc).then(console.log).catch(console.error);
                    }
                }
            }).catch(err => {
                if (err.name == "not_found") {
                    var new_doc = {
                        '_id': 'bucket_blacklist_access',
                        'value': [{
                            'url': domain,
                            'date': today,
                            'count': 1,
                            'epoch': epoch
                        }]
                    };
                    db.put(new_doc).then(console.log).catch(console.error)
                } else {
                    // nothing..
                }
            });

            chrome.browserAction.setBadgeBackgroundColor({ color: '#FF0000' })
            chrome.browserAction.setBadgeText({
                tabId: activeTab.id,
                text: 'n/a'
            });
        }
        // 일정시간동안 비활성 상태인 tab검출
        // if (tab !== undefined) {
        //     if (currentTab !== tab.url) {
        //         activity.setCurrentActiveTab(tab.url);
        //     }
        //     chrome.idle.queryState(parseInt(setting_interval_inactivity), function(state) {
        //         if (state === 'active') {
        //             mainTRacker(activeUrl, tab, activeTab);
        //         } else checkDOM(state, activeUrl, tab, activeTab);
        //     });
        // }

        if (isLimitList) {
            // restriction_access_list
            setBlockPageToCurrent(activeUrl);
            db.get('bucket_blacklist_access').then(doc => {
                var index = doc.value.findIndex(e => e.url == domain && e.epoch == epoch);
                if (index == -1) {
                    doc.value.push({ 'url': domain, 'date': today, 'count': 1, epoch: epoch});
                    db.put(doc).then(console.log).catch(console.error);
                } else {
                    doc.value[index].count++;
                    doc.value[index].epoch = epoch;
                    db.put(doc).then(console.log).catch(console.error);
                }
            }).catch(err => {
                if (err.name == "not_found") {
                    var new_doc = {
                        '_id': 'bucket_blacklist_access',
                        'value': [{
                            'url': domain,
                            'date': today,
                            'count': 1,
                            'epoch': epoch
                        }]
                    };
                    db.put(new_doc).then(console.log).catch(console.error)
                } else {
                    // nothing..
                }
            });
        }
    } else {
        // var is_ready = tab && tab.hasOwnProperty('url') && currentTab !== tab.url;
        if (tab && tab.hasOwnProperty('url') && currentTab !== tab.url) {
            activity.setCurrentActiveTab(tab.url);
        }
        getCurrentlyViewedTabId()
            .then(({ id, _url }) => {
                chrome.tabs.sendMessage(id, { req: EVENT_GENERATE_REPORT }, response => {
                    if (response !== undefined) {
                        // console.log('performance > ', Math.floor(response.performance / 1000), tab);
                        activity.incDataUsaged(tab,
                            response.isObserved ? response.increasedSize : response.transferSize);
                    }
                });
                var day = tab ? tab.days.find(s => s.date === today) : tab//undefined;
                // tab생성과 summary호출 간격이 짧으면 오류 발생함
                if (day !== undefined) {
                    var summary = day.summary;
                    console.log('summary >', summary);
                    // var data = bytesToSize(activity.getDataUsaged(tab));
                    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 0] });
                    chrome.browserAction.setBadgeText({
                        tabId: activeTab.id,
                        // text: data.size + "" + data.unit
                        text: String(convertSummaryTimeToBadgeString(summary))
                    });
                } else {
                    // console.error('day not found!', day);
                }

            })

        chrome.idle.queryState(parseInt(setting_interval_inactivity), state => {
            if (state === 'active') {
                mainTRacker(activeUrl, tab, activeTab);
            } else checkDOM(state, activeUrl, tab, activeTab);
        });
    } // end if
}

function mainTRacker(activeUrl, tab, activeTab) {
    // 사용 금지
    // if (activity.isLimitExceeded(activeUrl, tab)) {
    //     setBlockPageToCurrent(activeUrl);
    // }
    // 추적 금지
    if (!activity.isInBlackList(activeUrl)) {
        // if (activity.isNeedNotifyView(activeUrl, tab)) {
        //     if (isHasPermissioForNotification) {
        //         showNotification(activeUrl, tab);
        //     } else {
        //         checkPermissionsForNotifications(showNotification, activeUrl, tab);
        //     }
        // }
        // console.log('mainTRacker > !isInBlackList',activeUrl);
        tab.incSummaryTime();
    } else {
        // var today = formatDate();
        // var summary = tab.days.find(s => s.date === today).summary;
        // chrome.browserAction.setBadgeText({
        //     tabId: activeTab.id,
        //     text: '-'//String(convertSummaryTimeToBadgeString(summary))
        // });
        console.log('mainTRacker > isInBlackList', activeUrl);
    }
    // console.log('setting_view_in_badge',setting_view_in_badge);
    // if (true)//(setting_view_in_badge === true) {
    // chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 0] })
    // var today = formatDate();
    // // console.log("today > ",today);
    // // console.log(tab);
    // var summary = tab.days.find(s => s.date === today).summary;
    // // console.log(tab.url," > ",today, String(convertSummaryTimeToBadgeString(summary)));
    // chrome.browserAction.setBadgeText({
    //     tabId: activeTab.id,
    //     text: String(convertSummaryTimeToBadgeString(summary))
    // });
    // } else {
    //     // chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 0] })
    //     // chrome.browserAction.setBadgeText({
    //     //     tabId: activeTab.id,
    //     //     text: ''
    //     // });
    // }
}

function showNotification(activeUrl, tab) {
    chrome.notifications.clear('watt-site-notification', wasCleared => {
        if (!wasCleared) {
            // console.log('!wasCleared');

            chrome.notifications.create(
                'watt-site-notification', {
                type: 'basic',
                iconUrl: 'icons/128x128.png',
                title: "Web Activity Time Tracker",
                contextMessage: activeUrl + ' ' + convertShortSummaryTimeToString(tab.getTodayTime()),
                message: setting_notification_message
            },
                function (notificationId) {
                    // console.log(notificationId);
                    chrome.notifications.clear('watt-site-notification', function (wasCleared) {
                        if (wasCleared)
                            notificationAction(activeUrl, tab);
                    });
                });
        } else {
            notificationAction(activeUrl, tab);
        }
    });
}

function notificationAction(activeUrl, tab) {
    chrome.notifications.create(
        'watt-site-notification', {
        type: 'basic',
        iconUrl: 'icons/128x128.png',
        title: "Web Activity Time Tracker",
        contextMessage: activeUrl + ' ' + convertShortSummaryTimeToString(tab.getTodayTime()),
        message: setting_notification_message
    });
}

function setBlockPageToCurrent(activeUrl) {
    // static/app/tmpl/block.html
    var blockUrl = chrome.runtime.getURL("static/html/block.html") + '?url=' + activeUrl;
    chrome.tabs.query({ currentWindow: true, active: true }, tab => {
        chrome.tabs.update(tab.id, { url: blockUrl });
    });
}

function isVideoPlayedOnPage() {
    var videoElement = document.getElementsByTagName('video')[0];
    if (videoElement !== undefined && videoElement.currentTime > 0 && !videoElement.paused && !videoElement.ended && videoElement.readyState > 2) {
        return true;
    } else return false;
}

function checkDOM(state, activeUrl, tab, activeTab) {
    if (state === 'idle' && isDomainEquals(activeUrl, "youtube.com")) {
        trackForYT(mainTRacker, activeUrl, tab, activeTab);
    } else if (state === 'idle' && isDomainEquals(activeUrl, "netflix.com")) {
        trackForNetflix(mainTRacker, activeUrl, tab, activeTab);
    } else {
        //
    }
    //  activity.closeIntervalForCurrentTab();
}

function trackForYT(callback, activeUrl, tab, activeTab) {
    if (isHasPermissioForYouTube) {
        executeScriptYoutube(callback, activeUrl, tab, activeTab);
    } else {
        checkPermissionsForYT(executeScriptYoutube, activity.closeIntervalForCurrentTab, callback, activeUrl, tab, activeTab);
    }
}

function trackForNetflix(callback, activeUrl, tab, activeTab) {
    if (isHasPermissioForNetflix) {
        executeScriptNetflix(callback, activeUrl, tab, activeTab);
    } else {
        checkPermissionsForNetflix(executeScriptNetflix, activity.closeIntervalForCurrentTab, callback, activeUrl, tab, activeTab);
    }
}

function executeScriptYoutube(callback, activeUrl, tab, activeTab) {
    chrome.tabs.executeScript({ code: "var videoElement = document.getElementsByTagName('video')[0]; (videoElement !== undefined && videoElement.currentTime > 0 && !videoElement.paused && !videoElement.ended && videoElement.readyState > 2);" }, (results) => {
        if (results !== undefined && results[0] !== undefined && results[0] === true) {
            callback(activeUrl, tab, activeTab);
        }
    });
}

function executeScriptNetflix(callback, activeUrl, tab, activeTab) {
    chrome.tabs.executeScript({ code: "var videoElement = document.getElementsByTagName('video')[0]; (videoElement !== undefined && videoElement.currentTime > 0 && !videoElement.paused && !videoElement.ended && videoElement.readyState > 2);" }, (results) => {
        if (results !== undefined && results[0] !== undefined && results[0] === true) {
            callback(activeUrl, tab, activeTab);
        }
    });
}

function backgroundUpdateStorage() {
    if (!tabs) return;
    const copy = JSON.parse(JSON.stringify(tabs));
    copy.forEach(tab => {
        var variable = tab;
        (function (t) {
            // console.log('tab 저장..',t.url);
            db.get(t.url).then(doc => {
                db.put({ _id: doc._id, _rev: doc._rev, value: t }, { force: true }).then(res => {
                }).catch(console.error);
            }).catch(_err => {
                db.put({ '_id': t.url, 'value': t }).then(res => {
                }).catch(console.error);
            });
        })(variable)
    })
    // 사본 생성후 가장 마지막 항목만 남기고 제거
    // db에서 저장하는 과정에서 시간 딜레이 생김
    tabs = tabs.slice(tabs.length - 1, tabs.length);
    // console.log('tabs 저장완료, size > ', tabs.length)
}

function setDefaultSettings() {
    storage.saveValue(SETTINGS_INTERVAL_INACTIVITY, SETTINGS_INTERVAL_INACTIVITY_DEFAULT);
    storage.saveValue(SETTINGS_INTERVAL_RANGE, SETTINGS_INTERVAL_RANGE_DEFAULT);
    storage.saveValue(SETTINGS_VIEW_TIME_IN_BADGE, SETTINGS_VIEW_TIME_IN_BADGE_DEFAULT);
    storage.saveValue(SETTINGS_INTERVAL_SAVE_STORAGE, SETTINGS_INTERVAL_SAVE_STORAGE_DEFAULT);
    storage.saveValue(STORAGE_NOTIFICATION_MESSAGE, STORAGE_NOTIFICATION_MESSAGE_DEFAULT);
}

function checkSettingsImEmpty() {
    chrome.storage.local.getBytesInUse(['inactivity_interval'], item => {
        if (item == 0) {
            setDefaultSettings();
        }
    });
}

function setDefaultValueForNewSettings() {
    loadNotificationMessage();
}

function addListener() {
    chrome.tabs.onActivated.addListener(info => {
        // activity.addTab(tab);
        chrome.tabs.get(info.tabId, tab => {
            var activeUrl = activity.extractHostname(tab.url);
            if (activity.isValidPage(tab)) {
                if (tabs !== undefined) {
                    if (tabs.find(o => o.url === activeUrl)) {
                        // next
                    } else {
                        db.get(activeUrl).then(doc => {
                            tabs.push(prevTab(doc.value));
                        }).catch(err => {
                            activity.addTab(tab);
                            backgroundUpdateStorage();
                        });
                    }
                }
            }
        });
    });

    chrome.webNavigation.onCompleted.addListener(details => {
        chrome.tabs.get(details.tabId, tab => {
            activity.updateFavicon(tab);
        });
    });
    chrome.runtime.onInstalled.addListener(details => {
        console.log('onInstalled > ', details);
        if (details.reason == 'install') {
            storage.saveValue(SETTINGS_SHOW_HINT, SETTINGS_SHOW_HINT_DEFAULT);
            setDefaultSettings();
        }
        if (details.reason == 'update') {
            storage.saveValue(SETTINGS_SHOW_HINT, SETTINGS_SHOW_HINT_DEFAULT);
            checkSettingsImEmpty();
            setDefaultValueForNewSettings();
            // isNeedDeleteTimeIntervalFromTabs = true;
        }
    });
    // [2021-01-13 00:44:20]
    // 비활성 시간 계측 코드 필요
    // chrome.storage.onChanged.addListener((changes, namespace) => {
    //     for (var key in changes) {
    //         if (key === STORAGE_BLACK_LIST) {
    //             loadBlackList();
    //         }
    //         if (key === STORAGE_RESTRICTION_LIST) {
    //             loadRestrictionList();
    //         }
    //         if (key === STORAGE_NOTIFICATION_LIST) {
    //             loadNotificationList();
    //         }
    //         if (key === STORAGE_NOTIFICATION_MESSAGE) {
    //             loadNotificationMessage();
    //         }
    //         // todo
    //         // 비 활성 시간 계측용
    //         if (key === SETTINGS_INTERVAL_INACTIVITY) {
    //             storage.getValue(SETTINGS_INTERVAL_INACTIVITY, item => { setting_interval_inactivity = item; });
    //         }
    //         if (key === SETTINGS_VIEW_TIME_IN_BADGE) {
    //             storage.getValue(SETTINGS_VIEW_TIME_IN_BADGE, item => { setting_view_in_badge = item; });
    //         }
    //     }
    // });
    // [2020-12-01 13:31:41] 네트워크 리소스 사용량 계측
    const filter = { urls: ["<all_urls>"] };
    // tab 활성
    // chrome.tabs.onActivated.addListener(onTabSwitch);
    // 요청이 발생하려고 할 때 발생, 이 이벤트는 TCP 연결이 이루어지기 전에 전송되며 요청을 취소하거나 리디렉션하는 데 사용가능
    // chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter);
    // chrome.webRequest.onResponseStarted.addListener(onResponseStarted, filter);

    // 요청이 성공적으로 처리
    // chrome.webRequest.onCompleted.addListener(onRequestCompletedOrErrored, filter);
    // 요청을 성공적으로 처리 할 수 ​​없을 때
    // chrome.webRequest.onErrorOccurred.addListener(onRequestCompletedOrErrored, filter);
    // onBeforeNavigate -> onCommitted -> onDOMContentLoaded -> onCompleted
    // 화면 수신중
    // chrome.webNavigation.onCommitted.addListener(resetTabState, filter);
    // chrome.webNavigation.onBeforeNavigate.addListener(webNavigation, filter);

    // chrome.runtime.setUninstallURL("https://docs.google.com/forms/d/e/1FAIpQLSdImHtvey6sg5mzsQwWfAQscgZOOV52blSf9HkywSXJhuQQHg/viewform");
}

// function webNavigation(e) {}
// function onTabSwitch({ tabId }) {}
// function onResponseStarted(_info) {}
// function onBeforeRequest(info) {}

function getCurrentlyViewedTabId() {
    return new Promise(resolve => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, item => {
            if (Array.isArray(item) && item.length) {
                var id = item[0].id;
                var url = item[0].url;
                resolve({ id, url });
            }
        });
    });
}

// db에서 과거 데이터를 로드하면 그 뒤에 새로운 데이터를 추가함
function prevTab(tab) {
    return new Tab(tab.url,
        tab.category,
        tab.category_top,
        tab.category_sub,
        tab.favicon,
        tab.days,
        tab.dataUsage,
        tab.summaryTime,
        tab.counter);
}

// 추적 금지
function loadBlackList() {
    db.get(STORAGE_BUCKET)
        .then(rows => {
            setting_black_list = [];
            var ele = rows[STORAGE_BLACK_ELEMENT];
            if (ele) {
                for(var p in ele) {
                    if (ele[p]) { // true
                        setting_black_list.push(MATCHS[p]);
                    }
                }
            } else {
                for (var p in MATCHS) {
                    setting_black_list.push(MATCHS[p]);
                }
            }
            rows[STORAGE_BLACK_LIST].forEach(e => {
                if (e.enabled) {
                    setting_black_list.push(e.domain)
                }
            });
            console.log('blacklist',setting_black_list);
        })
        .catch(console.error);
}

function loadRestrictionList() {
    db.get(STORAGE_BUCKET)
        .then(rows => {
            setting_restriction_list = rows['restriction_list'] || [];
            console.log('setting_restriction_list',setting_restriction_list);
            // var ele = rows['setting_restriction_list'];
            // if (ele) {
            //     ele.forEach(e => {
            //         if (e.enabled) {
            //             setting_restriction_list.push(e.domain)
            //         }
            //     })
            // }
        })
        .catch(console.error);
    // storage.getValue(STORAGE_RESTRICTION_LIST, function (items) {
    //     setting_restriction_list = isEmpty2(items) ? [] : items;
    // })
}

// function loadRestrictionAccessList() {
//     storage.getValue(STORAGE_RESTRICTION_ACCESS_LIST, function (items) {
//         setting_restriction_access_list = isEmpty2(items) ? [] : items;
//     });
// }

function loadNotificationList() {
    storage.getValue(STORAGE_NOTIFICATION_LIST, items => {
        setting_notification_list = isEmpty2(items) ? [] : items;
    });
}

function loadNotificationMessage() {
    storage.getValue(STORAGE_NOTIFICATION_MESSAGE, item => {
        setting_notification_message = item;
        if (isEmpty(setting_notification_message)) {
            storage.saveValue(STORAGE_NOTIFICATION_MESSAGE, STORAGE_NOTIFICATION_MESSAGE_DEFAULT);
            setting_notification_message = STORAGE_NOTIFICATION_MESSAGE_DEFAULT;
        }
    });
}

function loadSettings() {
    storage.getValue(SETTINGS_INTERVAL_INACTIVITY, item => { setting_interval_inactivity = item; });
    storage.getValue(SETTINGS_VIEW_TIME_IN_BADGE, item => { setting_view_in_badge = item; });
}

function loadAddDataFromStorage() {
    // loadTabs();
    // loadTimeIntervals();
    loadBlackList();
    loadRestrictionList();
    // loadRestrictionAccessList();
    loadNotificationList();
    loadNotificationMessage();
    loadSettings();
}

function loadPermissions() {
    checkPermissionsForYT();
    checkPermissionsForNetflix();
    checkPermissionsForNotifications();
}

function checkPermissionsForYT(callbackIfTrue, callbackIfFalse, ...props) {
    chrome.permissions.contains({
        permissions: ['tabs'],
        origins: ["https://www.youtube.com/*"]
    }, result => {
        if (callbackIfTrue != undefined && result)
            callbackIfTrue(...props);
        if (callbackIfFalse != undefined && !result)
            callbackIfFalse();
        isHasPermissioForYouTube = result;
    });
}

function checkPermissionsForNetflix(callbackIfTrue, callbackIfFalse, ...props) {
    chrome.permissions.contains({
        permissions: ['tabs'],
        origins: ["https://www.netflix.com/*"]
    }, result => {
        if (callbackIfTrue != undefined && result)
            callbackIfTrue(...props);
        if (callbackIfFalse != undefined && !result)
            callbackIfFalse();
        isHasPermissioForNetflix = result;
    });
}

function checkPermissionsForNotifications(callback, ...props) {
    chrome.permissions.contains({
        permissions: ["notifications"]
    }, result => {
        if (callback != undefined && result)
            callback(...props);
        isHasPermissioForNotification = result;
    });
}

// 시작!
var pounch;
function reload() {
    pounch = new PouchStorage(function (instance) {
        db = new instance('tabs', { revs_limit: 10, auto_compaction: true });
        tabs = [];

        loadPermissions();
        addListener();
        loadAddDataFromStorage();
        updateSummaryTime();
        updateStorage();
    });
}

reload();