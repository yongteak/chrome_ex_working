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

init();

/*
{BandWithByKB, UsedTime. VitedCount, Referer}}
    vited: {},
    summary: {
        total : {bandwithSize,visitedCount,usedTIme},
        domain : {
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
    if (!URL_MAP.has("views")) URL_MAP.set("views",{});
    if (!URL_MAP.has("summary")) URL_MAP.set("summary",{});
    if (!URL_MAP.has("data")) URL_MAP.set("data",{});

    const filter = { urls: ["<all_urls>"] };
    chrome.tabs.onActivated.addListener(onTabSwitch);
    chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter);
    chrome.webRequest.onCompleted.addListener(onRequestCompletedOrErrored, filter);
    chrome.webRequest.onErrorOccurred.addListener(onRequestCompletedOrErrored, filter);
    chrome.webNavigation.onCommitted.addListener(resetTabState, filter);
}
// Tab 변경시 해당 Tab의 KB 데이터 표현을 위함, 
function onTabSwitch({ tabId /*: number */ }) /*: void */ {
    // const tabData = getTabData(tabId);
    // updateView(tabData);
    getCurrentlyViewedTabId()
        .then(function ({id,url}) {
            if (id === tabId) {
                const tabData = getTabData(tabId);
                updateView(tabId, url, tabData);
            }
        });
}

function onBeforeRequest({ tabId /*: number */ }) /*: void */ {
    incrementTabTimesCurrentlyDoing(tabId);
    incrementTabTimesAlreadyDone(tabId);
    conditionallyUpdateView(tabId);
}

function onRequestCompletedOrErrored({ tabId /*: number */ }) /*: void */ {
    decrementTabTimesCurrentlyDoing(tabId);
    conditionallyUpdateView(tabId);
}

function resetTabState({ tabId /*: number */ }) /*: void */ {
    const newTabState = [0, 0];
    TAB_DB.set(tabId, newTabState);
    conditionallyUpdateView(tabId);
}

function conditionallyUpdateView(tabId) {
    // console.log('[conditionallyUpdateView] '+tabId);
    getCurrentlyViewedTabId()
        .then(function ({id,url}) {
            if (id === tabId) {
                const tabData = getTabData(tabId);
                updateView(tabId, url, tabData);
            }
        });
}

function genModel(model,day,domain) {
    if (!model.hasOwnProperty(day)) {
        model[day] = {};
    };
    if (!model[day].hasOwnProperty(domain)) {
        model[day][domain] = {
            bandwith:0,
            visitedCount:0,
            usedTIme:0
        }
    }
    return model;
}
/**
 * 도메인 별로 구분해서 관리
 */
function updateView(tabId, url, [timesCurrentlyDoing, timesAlreadyDone]) {
    // timesAlreadyDone => KB 데이터
    // 데이터를 지속적으로 inert, todo 성능 이슈로 인한 bulk insert형태로 변경필요
    // 30초마다 merge!
    const day = String(getFormatDate());
    const key = day + ":" +String(tabId) + url;
    const domain = getDomain(url);
// todo
// usedtime계산

    // todo
    // refresh및 같은 페이지 조회 카운트 인식 어려움, 일정시간마다 merge하는 형태로 구현필요
    var views = URL_MAP.get("views");
    if (views.hasOwnProperty(key)){
        if (timesAlreadyDone >= views[key]) {
            //
        } else {
            // model값 변경시 map데이터도 참조되어 같이 변경됨, 따로 걍신 코드 필요없음
            var data = URL_MAP.get("data");
            var model = genModel(data,day,domain);
            model[day][domain]["bandwith"] += views[key];
            model[day][domain]["visitedCount"] += 1;
        }
    }
    views[key] = timesAlreadyDone;
    URL_MAP.set(key, timesAlreadyDone);
    // console.log(domain,String(timesAlreadyDone) + "KB");
    chrome.browserAction.setBadgeText({ text: String(timesAlreadyDone) });


/*
{BandWithByKB, UsedTime. VitedCount, Referer}}
vited: {},
summary: {
    total : {bandwithSize,visitedCount,usedTIme},
    domain : {
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

function getCurrentlyViewedTabId() /*: Promise<number> */ {
    return new Promise(function (resolve) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (item) {
            if (Array.isArray(item) && item.length) {
                var id = item[0].id;
                var url = item[0].url;
                resolve({id,url});
            }
        });
    });
}

function getTabData(tabId /*: number */) /*: [number, number] */ {
	if (TAB_DB.has(tabId)) {
		return TAB_DB.get(tabId);
	}
	const tabData = [0, 0];
	TAB_DB.set(tabId, tabData);
	return tabData;
}
function incrementTabTimesCurrentlyDoing(tabId /*: number */) /*: void */ {
	const tabData /*: [number, number] */ = getTabData(tabId);
	tabData[0] += 1;
}

function decrementTabTimesCurrentlyDoing(tabId /*: number */) /*: void */ {
	const tabData /*: [number, number] */ = getTabData(tabId);
	tabData[0] -= 1;
}

function incrementTabTimesAlreadyDone(tabId /*: number */) /*: void */ {
	const tabData /*: [number, number] */ = getTabData(tabId);
	tabData[1] += 1;
}


// YYYYMMDD
function getFormatDate(){
    var date = new Date();
    var year = date.getFullYear();
    var month = (1 + date.getMonth());
    month = month >= 10 ? month : '0' + month;
    var day = date.getDate();
    day = day >= 10 ? day : '0' + day;
    return  year + '' + month + '' + day;
}

function getDomain(url) {
    // console.log(url);
    try {
        var hostName = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i)[2];
        var domain = hostName;    
        if (hostName != null) {
            var parts = hostName.split('.').reverse();
            
            if (parts != null && parts.length > 1) {
                domain = parts[1] + '.' + parts[0];
                    
                if (hostName.toLowerCase().indexOf('.co.uk') != -1 && parts.length > 2) {
                domain = parts[2] + '.' + domain;
                }
            }
        }
        return domain;
    } catch (e) {
        return null;
        // error
    }

        
}