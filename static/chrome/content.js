
let reportObject = {
    entries: [],
    entriesCount: 0,
    resourcesCount: {
        other: 0,
        html: 0,
        css: 0,
        link: 0,
        img: 0,
        script: 0,
        xhr: 0
    },
    transferSize: 0,
    transferSizeInUnits: {},
    decodedBodySize: 0,
    decodedBodySizeInUnits: {},
    duration: 0,
    performance_timings: performance.timing,
    lastreporttime: null,
    origin: window.location.origin,
    beforeSize:0,
    increasedSize:0,
    isObserved:false,
    isFlush:false,
    status:"idle"
};
// Returns size of the data in following formats: Bytes, KB, MB, GB & TB
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return { size: Math.round(bytes / Math.pow(1024, i), 2), unit: sizes[i] };
}

// Converts millis to seconds
function millisToMinutesAndSeconds(duration) {
    var milliseconds = parseInt((duration % 1000))
        , seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    // console.log(duration,milliseconds,)
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

function updateReport(entries) {
    reportObject.isFlush = false;
    // 상태 복사
    reportObject.beforeSize = parseInt(reportObject.transferSize+"".repeat(1));
    try {
        for (let i = 0, l = entries.length; i < l; i++) {
            // transferSize += (!isNaN(entries[i].transferSize)) ? (entries[i].transferSize) : 0;
            reportObject.transferSize += (!isNaN(entries[i].transferSize)) ? (entries[i].transferSize) : 0;
        }
        
        const diff = reportObject.transferSize - reportObject.beforeSize;
        if (!reportObject.isFlush && reportObject.isObserved && diff > 0) {
            reportObject.increasedSize += diff
            console.log(reportObject.beforeSize,reportObject.transferSize,diff,reportObject.increasedSize);
        }
        reportObject.status = "active";

        
    } catch (err) {
        console.error("Unable to extract entries -- " + err);
    }
}

(() => {
    updateReport(performance.getEntries());
    const resourceObserver = new PerformanceObserver(list => {
        updateReport(list.getEntries());
    });
    resourceObserver.observe({ entryTypes: ["resource"] });
})();

// Adding message listener
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // pushAnalyticsEvents(window.location.href, request.req); // Pushing google analyticts info
        if (request.req === "performance_report" && reportObject.status == "active") {
            reportObject.lastreporttime = new Date();
            sendResponse(reportObject);
            // 데이터 갱신 상태가 아닌경우 이벤트 발송을 하지 않는다.
            reportObject.status = "idle";
            // 화면 로드 상태 정보
            reportObject.isObserved = true;
            // 이벤트 발송후 증감값 다시 계산
            reportObject.isFlush = true;
            reportObject.increasedSize = 0;
            
            return true; // sendResponse was called synchronously. If you want to send asynchronously use sendResponse, add return true; to the onMessage event handler.
        }
    }
);
