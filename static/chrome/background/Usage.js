/* 
요청 수명주기
https://developer.chrome.com/extensions/webRequest
*/
/*
 * stuff to do:
 *
 * # listen to tab change event
 * # when tab is changed, get the number of requests and status of tabid and update browseraction
 *
 * # listen to webrequest onbeforerequestsent
 * # update tab db
 * # if tabid is activetabid, update browseraction
 *
 * eaaaasy!
 *
 * awal rocks
 * 동일한 URL에서 KB 사이즈가 줄어들경우 refresh 처리
 */

const TAB_DB /*: { [tabId: number]: [number, number] } */ = new Map();
const URL_MAP = new Map();
// 30초, 데이터를 얼마 단위로 쪼갤것인가, 1day로 분리?
const SPLIT_DURATION = 30;

init();

/*
{BandWithByKB, UsedTime. VitedCount, Referer}}
    vited: {},
    summary: {
        total : {bandwithSize,visitedCount,usedTIme},
        host : {
            clien : {bandwithSize,visitedCount,usedTIme},
            mlbpark : {bandwithSize,visitedCount,usedTIme}
        }
    },
    data : {
        20201120:{
            clien:{
                bandwithSize:32403 (KB),
                visitedCount: 3324,
                usedTIme:12321 (Second)
            },
            mlbpark: {

            }...
        }
    }
*/



function init() /*: void */ {
    URL_MAP.clear("views");
    if (!URL_MAP.has("views")) URL_MAP.set("views", {});
    if (!URL_MAP.has("summary")) URL_MAP.set("summary", {});
    if (!URL_MAP.has("data")) URL_MAP.set("data", {});

    const filter = { urls: ["<all_urls>"] };
    // tab 활성
    chrome.tabs.onActivated.addListener(onTabSwitch);
    // 요청이 발생하려고 할 때 발생, 이 이벤트는 TCP 연결이 이루어지기 전에 전송되며 요청을 취소하거나 리디렉션하는 데 사용가능
    chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter);
    // 요청이 성공적으로 처리
    chrome.webRequest.onCompleted.addListener(onRequestCompletedOrErrored, filter);
    // 요청을 성공적으로 처리 할 수 ​​없을 때 
    chrome.webRequest.onErrorOccurred.addListener(onRequestCompletedOrErrored, filter);
    // onBeforeNavigate -> onCommitted -> onDOMContentLoaded -> onCompleted
    // 화면 수신중
    chrome.webNavigation.onCommitted.addListener(resetTabState, filter);
}
// Tab 변경시 해당 Tab의 KB 데이터 표현을 위함, 
function onTabSwitch({ tabId /*: number */ }) {
    // const tabData = getTabData(tabId);
    // updateView(tabData);
    getCurrentlyViewedTabId()
        .then(function ({ id, url }) {
            if (id === tabId) {
                const tabData = getTabData(tabId);
                updateView(tabId, url, tabData);
            }
        });
}
// 다운로드 진행중
function onBeforeRequest({ tabId }) {
    incrementTabTimesCurrentlyDoing(tabId);
    incrementTabTimesAlreadyDone(tabId);
    conditionallyUpdateView(tabId);
}

// 다운로드 완료
function onRequestCompletedOrErrored({ tabId }) {
    decrementTabTimesCurrentlyDoing(tabId);
    conditionallyUpdateView(tabId);
}

// [2020-12-01 12:53:55]
// tab의 상태 변경
// 페이지 refresh의 경우 tab의 수신된 데이터 상태를 초기화하여 다시 쌓음
// 누적형으로 진행할경우 daily또는 특정 시간대만 초기화하여 데이터 누적 방법 사용할것
function resetTabState({ tabId /*: number */ }) /*: void */ {
    // const newTabState = [0, 0];
    // TAB_DB.set(tabId, newTabState);
    conditionallyUpdateView(tabId);
}

function conditionallyUpdateView(tabId) {
    getCurrentlyViewedTabId()
        .then(({ id, url }) => {
            if (id === tabId) {
                const tabData = getTabData(tabId);
                updateView(tabId, url, tabData);
            }
        });
}

function genModel(model, day, domain) {
    if (!model.hasOwnProperty(day)) {
        model[day] = {};
    };
    if (!model[day].hasOwnProperty(domain)) {
        model[day][domain] = {
            bandwith: 0,
            visitedCount: 0,
            usedTIme: 0
        }
    }
    return model;
}
/**
 * 도메인 별로 구분해서 관리
 */
function updateView(tabId, url, [timesCurrentlyDoing, timesAlreadyDone]) {
    // timesAlreadyDone => 로드가 완료된 상태, 이후 페이지내 로드가 더 될경우 숫자 증가
    // timesCurrentlyDoing : 현재 진행된 로드
    // 데이터를 지속적으로 inert, todo 성능 이슈로 인한 bulk insert형태로 변경필요
    // 30초마다 merge!
    const day = String(getFormatDate());
    const key = day + ":" + String(tabId) + url;
    const host = extractHostname(url);
    // todo
    // usedtime계산

    // todo
    // refresh및 같은 페이지 조회 카운트 인식 어려움, 일정시간마다 merge하는 형태로 구현필요
    var views = URL_MAP.get("views");
    if (views.hasOwnProperty(key)) {
        if (timesAlreadyDone >= views[key]) {
            //
        } else {
            // model값 변경시 map데이터도 참조되어 같이 변경됨, 따로 갱신 코드 필요없음
            var data = URL_MAP.get("data");
            var model = genModel(data, day, host);
            model[day][host]["bandwith"] += views[key];
            // model[day][domain]["visitedCount"] += 1;
        }
    }
    views[key] = timesAlreadyDone;
    URL_MAP.set(key, timesAlreadyDone);
    // console.log(host,String(timesAlreadyDone) + "KB");
    chrome.browserAction.setBadgeText({ text: String(timesAlreadyDone) });


    /*
    {BandWithByKB, UsedTime. VitedCount, Referer}}
    vited: {},
    summary: {
        total : {bandwithSize,visitedCount,usedTIme},
        host : {
            clien : {bandwithSize,visitedCount,usedTIme},
            mlbpark : {bandwithSize,visitedCount,usedTIme}
        }
    },
    data : {
        20201120:{
            clien:{
                bandwithSize:32403 (KB),
                visitedCount: 3324,
                usedTIme:12321 (Second)
            },
            mlbpark: {
    
            }...
        }
    }
    */
    // function init() /*: void */ {
    // if (!URL_MAP.has("vited")) URL_MAP.set({"vited":{}});
    // if (!URL_MAP.has("summary")) URL_MAP.set({"summary":{}});
    // if (!URL_MAP.has("data")) URL_MAP.set({"data":{}});
    // */
    // console.log(URL_MAP);

    //         chrome.storage.local.set(["key"], function () {
    //         });
    //         delete url_map.key;    
    //     }

    // } else {
    //     // yyyymmdd
    //     const dayOf = getFormatDate();
    //     // 날짜 : {도메인 : {BandWithByKB, UsedTime. VitedCount, Referer}}

    // }

    // var items = { key1: value1, key2: value2 };  // 추가할 항목들
    // chrome.storage.local.set(items, function () {
    //     // 콜백
    //     console.log('기록 되었습니다.');
    // });



    // chrome.storage.local.get(["key"], function (items) {
    //     value = items.key;
    // });
    // console.log("[" + timesCurrentlyDoing + "]" + String(timesAlreadyDone) + "KB")
    // chrome.browserAction.setBadgeText({ text: String(timesAlreadyDone) });
    // if (timesCurrentlyDoing > 0) {
    // 	chrome.browserAction.setIcon({ path: 'static/on.gif' });
    // } else {
    // 	chrome.browserAction.setIcon({ path: 'static/off.png' });
    // }
}

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

function getTabData(tabId) {
    if (TAB_DB.has(tabId)) {
        return TAB_DB.get(tabId);
    }
    const tabData = [0, 0];
    console.log("init tab data > ", tabId);
    TAB_DB.set(tabId, tabData);
    return tabData;
}
function incrementTabTimesCurrentlyDoing(tabId) {
    const tabData = getTabData(tabId);
    console.log('inc  ', tabData);
    tabData[0] += 1;
}

/*
[2020-12-01 13:15:34]
데이터 증감만 진행
*/
function decrementTabTimesCurrentlyDoing(tabId) {
    const tabData = getTabData(tabId);
    // tabData[0] -= 1;
}

function incrementTabTimesAlreadyDone(tabId) {
    const tabData = getTabData(tabId);
    tabData[1] += 1;
}


// YYYYMMDD
function getFormatDate() {
    var date = new Date();
    var year = date.getFullYear();
    var month = (1 + date.getMonth());
    month = month >= 10 ? month : '0' + month;
    var day = date.getDate();
    day = day >= 10 ? day : '0' + day;
    return year + '' + month + '' + day;
}

function extractHostname(url) {
    var hostname;

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];

    return hostname;
}
// function getDomain(url) {
//     // console.log(url);
//     try {
//         var hostName = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i)[2];
//         var domain = hostName;
//         if (hostName != null) {
//             var parts = hostName.split('.').reverse();

//             if (parts != null && parts.length > 1) {
//                 domain = parts[1] + '.' + parts[0];

//                 if (hostName.toLowerCase().indexOf('.co.uk') != -1 && parts.length > 2) {
//                     domain = parts[2] + '.' + domain;
//                 }
//             }
//         }
//         return domain;
//     } catch (e) {
//         return null;
//         // error
//     }
// }