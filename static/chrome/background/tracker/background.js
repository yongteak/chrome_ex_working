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

var browser = browser();

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

function updateSync() {
    setInterval(startSync, SETTINGS_INTERVAL_SYNC_DEFAULT);
}

function backgroundCheck() {
    // console.log('backgroundCheck isBackgroundUpdateStorage > ',isBackgroundUpdateStorage);
    // if (isBackgroundUpdateStorage) return;
    chrome.windows.getLastFocused({ populate: true }, function (currentWindow) {
        if (currentWindow && currentWindow.focused) {
            var activeTab = currentWindow.tabs.find(t => t.active === true);
            if (activeTab !== undefined && activity.isValidPage(activeTab)) {
                var activeUrl = activity.extractHostname(activeTab.url);
                var tab = activity.getTab(activeUrl);
                // [2021-01-08 15:45:30]
                // db저장시간이 오래걸릴경우 문제생김
                if (tab === undefined) {
                    db.get(activeUrl).then(doc => {
                        // 기존 데이터가 있는경우 push
                        console.log('tab null, db데이터 로드')
                        tabs.push(prevTab(doc.value));
                        tab = activity.getTab(activeUrl);
                        backgroundCheck2(tab, activeUrl, activeTab);
                    }).catch(err => {
                        // if (error.status == '404') {}
                        console.log('tab null, 신규 tab 객체 생성');
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
                    doc.value.push({ 'url': domain, 'date': today, 'count': 1, epoch: epoch });
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
            db.get('restriction_access_list').then(doc => {
                var index = doc.value.findIndex(e => e.url == domain && e.epoch == epoch);
                if (index == -1) {
                    doc.value.push({ 'url': domain, 'date': today, 'count': 1, epoch: epoch });
                    db.put(doc).then(console.log).catch(console.error);
                } else {
                    doc.value[index].count++;
                    doc.value[index].epoch = epoch;
                    db.put(doc).then(console.log).catch(console.error);
                }
            }).catch(err => {
                if (err.name == "not_found") {
                    var new_doc = {
                        '_id': 'restriction_access_list',
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
                    // console.log('summary view > ',summary,day);
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

        // idel time 계측 구간, 자꾸 에러남.. 수정필요
        // try {
        //     chrome.idle.queryState(parseInt(setting_interval_inactivity), state => {
        //         if (state === 'active') {
        //             mainTRacker(activeUrl, tab, activeTab);
        //         } else checkDOM(state, activeUrl, tab, activeTab);
        //     });
        // } catch (error) {
        //     // nothing
        //     console.error(error);
        // }
        mainTRacker(activeUrl, tab, activeTab);

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
    updateEvent('go_block_page', activeUrl);
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

var synchronizing = false;
function startSync() {
    synchronizing = true;
    // console.log('start Sync, synchronizing > ',synchronizing);
    pounch.sync(res => {
        if (res.hasOwnProperty('instnace')) {
            diff_tabs = res.instnace;
        } else if(res.error) {
            console.error(res);
        } else {
            //
        }

        synchronizing = false;
        // console.log('end Sync, synchronizing > ',synchronizing,res);
    })
}

// tab사용시간 관리, browser용
var diff_second;
// clear진행중 lock
var isBackgroundUpdateStorage = false;

// save
function backgroundUpdateStorage() {
    // console.log('backgroundUpdateStorage', isBackgroundUpdateStorage);
    // if (isBackgroundUpdateStorage) return;
    if (synchronizing || !tabs) return;
    // const diff = Math.round(Date.now() / 1000) - diff_second;
    const copy = JSON.parse(JSON.stringify(tabs));
    // isBackgroundUpdateStorage = copy.length > 0;
    // const clearDiffDocs = function (doc, new_doc) {
    //     console.log('[clearDiffDocs] > ', doc._id, doc._rev);
    //     const conflict = "Document update conflict|missing";
    //     db.remove(doc)
    //         .then(_r => {
    //             db.get(doc._id)
    //                 .then(doc1 => {
    //                     return clearDiffDocs(doc1, new_doc);
    //                 })
    //                 .catch(err1 => {
    //                     db.put({ '_id': new_doc.url, 'value': new_doc }).then(res => {
    //                         isBackgroundUpdateStorage = false;
    //                     }).catch(err => {
    //                         isBackgroundUpdateStorage = err.message.indexOf(conflict) != -1;
    //                         console.log(111, err);
    //                     });
    //                 });
    //         })
    //         .catch(err2 => {
    //             db.put({ '_id': new_doc.url, 'value': new_doc }).then(res => {
    //                 console.log('22 saved..', res);
    //                 isBackgroundUpdateStorage = false;
    //             }).catch(err => {
    //                 isBackgroundUpdateStorage = err.message.indexOf(conflict) != -1;
    //                 console.log(222, err);
    //             });
    //         });
    // }
    // console.log('put ', copy);
    copy.forEach(tab => {
        var variable = tab;
        (function (t) {
            // db.get(t.url).then(doc => {
            //     clearDiffDocs(doc, t);
            // }).catch(err => {
            //     isBackgroundUpdateStorage = false;
            //     console.log(err);
            //     db.put({ '_id': t.url, 'value': t }).then(res => {
            //     }).catch(err1 => {
            //         console.log(err1);
            //     });
            // });
            db.get(t.url).then(doc => {
                return db.put({ _id: doc._id, _rev: doc._rev, value: t }, { force: true });
            }).catch(err => {
                console.error(err);
                db.put({ '_id': t.url, 'value': t });
            });

            // 변경분 저장
            diff_tabs.get(t.url).then(doc => {
                doc.value = t;
                return diff_tabs.put(doc, { force: true });
            }).catch(_err => {
                diff_tabs.put({ '_id': t.url, 'value': t }).then(res => {
                    // console.log('res',res);
                }).catch(err => {
                    console.error(err)
                    if (err.message == "Document update conflict") {

                    } else {
                        reload();
                    }
                    // docId: "www.oschina.net"
                    // error: true
                    // id: "www.oschina.net"
                    // message: "Document update conflict"
                    // name: "conflict"
                    // status: 409

                    //
                });
            });


        })(variable)
    })
    // 사본 생성후 가장 마지막 항목만 남기고 제거
    // db에서 저장하는 과정에서 시간 딜레이 생김
    diff_second = Math.round(Date.now() / 1000);
    tabs = tabs.slice(tabs.length - 1, tabs.length);
    // console.log('tabs 저장완료, size > ', tabs.length)
}

function setDefaultSettings() {
    console.log('[setDefaultSettings]');
    console.log('this browser', browser);
    storage.saveValue(SETTINGS_INTERVAL_SYNC, SETTINGS_INTERVAL_SYNC_DEFAULT);
    storage.saveValue(SETTINGS_INTERVAL_INACTIVITY, SETTINGS_INTERVAL_INACTIVITY_DEFAULT);
    storage.saveValue(SETTINGS_INTERVAL_RANGE, SETTINGS_INTERVAL_RANGE_DEFAULT);
    storage.saveValue(SETTINGS_VIEW_TIME_IN_BADGE, SETTINGS_VIEW_TIME_IN_BADGE_DEFAULT);
    storage.saveValue(SETTINGS_INTERVAL_SAVE_STORAGE, SETTINGS_INTERVAL_SAVE_STORAGE_DEFAULT);
    storage.saveValue(STORAGE_NOTIFICATION_MESSAGE, STORAGE_NOTIFICATION_MESSAGE_DEFAULT);
}

function checkSettingsImEmpty() {
    // chrome.storage.local.getBytesInUse(['inactivity_interval'], item => {
    //     if (item == 0) {
    setDefaultSettings();
    // }
    // });
}

function setDefaultValueForNewSettings() {
    loadNotificationMessage();
}

function updateEvent(key, value) {
    if (synchronizing || diff_tabs == undefined || db == undefined) {
        setTimeout(() => updateEvent(key, value), 3000);
        return;
    }
    key = ('' + key).toUpperCase();
    const kv = { 'key': key, 'value': value, 'epoch': Date.now(), 'browser': browser };
    const bucket = 'bucket_event';
    const put = { '_id': bucket, 'value': [kv] };
    db.get(bucket).then(doc => {
        doc.value.push(kv);
        db.put(doc, { force: true });
    }).catch(_err => db.put(put));

    diff_tabs.get(bucket).then(doc => {
        doc.value.push(kv);
        diff_tabs.put(doc, { force: true });
    }).catch(_err => diff_tabs.put(put));
}

function addListener() {
    chrome.tabs.onActivated.addListener(info => {
        // activity.addTab(tab);
        chrome.tabs.get(info.tabId, tab => {
            // console.log(tab.status,tab);
            // tab.url = tab.url ? tab.url : tab.pendingUrl;
            if (tab && tab.hasOwnProperty('url') && !isEmpty2(tab.url)) {
                var activeUrl = activity.extractHostname(tab.url);
                if (activity.isValidPage(tab)) {
                    if (tabs !== undefined) {
                        if (tabs.find(o => o.url === activeUrl)) {
                            // next
                        } else {
                            db.get(activeUrl).then(doc => {
                                tabs.push(prevTab(doc.value));
                            }).catch(err => {
                                console.error(err);
                                activity.addTab(tab);
                                // backgroundUpdateStorage();
                            });
                        }
                    }
                }
            } else {
                // nothing..
            }
        });
    });

    chrome.webNavigation.onCompleted.addListener(details => {
        chrome.tabs.get(details.tabId, tab => {
            if (tab && tab.hasOwnProperty('url') && !isEmpty2(tab.url)) {
                activity.updateFavicon(tab);
            } else {
                console.error('2222 tab url 없어? 오류 케이스 수집필요!!', tab);
            }
        });
    });
    chrome.runtime.onInstalled.addListener(details => {
        console.log('onInstalled > ', details);
        updateEvent(details.reason, details);
        // if (details.reason == 'install') {
        //     storage.saveValue(SETTINGS_SHOW_HINT, SETTINGS_SHOW_HINT_DEFAULT);
        //     setDefaultSettings();
        // }
        // if (details.reason == 'update') {
        //     storage.saveValue(SETTINGS_SHOW_HINT, SETTINGS_SHOW_HINT_DEFAULT);
        //     checkSettingsImEmpty();
        //     setDefaultValueForNewSettings();
        //     // isNeedDeleteTimeIntervalFromTabs = true;
        // }
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

// db에서 과거 데이터를 로드하면 그 뒤에 새로운 데이터를 추가함, 접속횟수 증가
function prevTab(tab) {
    var tab1 = new Tab(tab.url,
        tab.category,
        tab.category_top,
        tab.category_sub,
        tab.favicon,
        tab.days,
        tab.dataUsage,
        tab.summaryTime,
        tab.counter);
    tab1.incCounter();
    return tab1;
}

// 추적 금지
function loadBlackList(isReload) {
    if (synchronizing) {
        setTimeout(() => loadBlackList(isReload), 3000);
        return;
    }
    if (isReload) updateEvent('update_black_list', 'update_black_list');
    db.get(STORAGE_BUCKET)
        .then(rows => {
            setting_black_list = [];
            var ele = rows[STORAGE_BLACK_ELEMENT];
            if (ele) {
                for (var p in ele) {
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
            console.log('blacklist', setting_black_list);
        })
        .catch(console.error);
}

function loadRestrictionList(isReload) {
    if (synchronizing) {
        setTimeout(() => loadRestrictionList(isReload), 3000);
        return;
    }
    if (isReload) updateEvent('update_restriction_list', 'update_restriction_list');
    db.get(STORAGE_BUCKET)
        .then(rows => {
            setting_restriction_list = rows['restriction_list'] || [];
            console.log('setting_restriction_list', setting_restriction_list);
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
    if (synchronizing) {
        setTimeout(loadAddDataFromStorage, 3000);
        return;
    }
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
    if (synchronizing) {
        setTimeout(loadPermissions, 3000);
        return;
    }
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
var diff_tabs;
function reload(runSync) {
    console.log('reload > ', runSync);
    pounch = new PouchStorage(function (instance) {
        db = new instance('tabs', { revs_limit: 10, sauto_compaction: true });
        diff_tabs = new instance('diff_tabs', { revs_limit: 10, sauto_compaction: true });
        tabs = [];

        loadPermissions();
        addListener();
        loadAddDataFromStorage();
        updateSummaryTime();
        updateStorage();
        if (runSync) {
            startSync();
            updateSync();
        }
    });
}
// sync이벤트 완료후 flag
reload(true);
// startSync();
// start!
updateEvent('start_application', browser);