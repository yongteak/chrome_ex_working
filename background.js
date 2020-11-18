chrome.browserAction.onClicked.addListener(function (tab) {
    // for the current tab, inject the "inject.js" file & execute it
    console.log('tab > '+tab);
	// chrome.tabs.executeScript(tab.ib, {
	// 	file: 'inject.js'
    // });
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
      });
})


// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     console.log(sender.tab ?
//         "from a content script:" + sender.tab.url :
//         "from the extension");

//     if (request.action === "FINISH")
//         sendResponse({farewell: "goodbye"});
// });

console.log('bg run');
// $( function() {
//     // add event listners
//     chrome.webRequest.onBeforeRequest.addListener(
//         function(details) { 
//             console.log('onBeforeRequest', details);
//         },
//         {urls: ["http://www.beibei.com/"]},
//         []
//     );

//     chrome.webRequest.onBeforeSendHeaders.addListener(
//         function(details) {
//             console.log('onBeforeSendHeaders', details);
//         },
//         {urls: ["http://www.beibei.com/"]},
//         ["requestHeaders"]
//     );

//     chrome.webRequest.onCompleted.addListener( 
//         function(details) {
//             console.log('onCompleted', details);
//         },
//         {urls: ["http://www.beibei.com/"]},
//         []
//     );

//     // do a GET request, so that relative events will be fired, need jquery here
//     $.get('http://www.beibei.com/');
// });
// chrome.webRequest.onBeforeRequest.addListener(
//     function(details) {
//         console.log(details);
//       return {cancel: details.url.indexOf("://www.evil.com/") != -1};
//     },
//     {urls: ["<all_urls>"]},
//     ["blocking"]);
// $(document).ready(function() {
    // $(".board_nav").prepend('<input id="TestButton" class="report_label radius" title="메모 목록 공유하기" type="button" name="sync_memo"" value="메모 목록 공유하기"" data-runtime-disabled="runtime.Disabled" data-runtime-aria-label="runtime.ariaLabel" data-runtime-hide="runtime.Hide" aria-label="Test Button">');
// });
    //     console.log("@@@run startup function");
//         console.log(chrome.webRequest);
       
//     //     chrome.webRequest.onHeadersReceived.addListener(function(details){
//     //         console.log(JSON.stringify(details));
//     //         // var headers = details.requestHeaders,
//     //         // blockingResponse = {};
          
//     //         // // Each header parameter is stored in an array. Since Chrome
//     //         // // makes no guarantee about the contents/order of this array,
//     //         // // you'll have to iterate through it to find for the
//     //         // // 'User-Agent' element
//     //         // for( var i = 0, l = headers.length; i < l; ++i ) {
//     //         //   if( headers[i].name == 'User-Agent' ) {
//     //         //     headers[i].value = '>>> Your new user agent string here <<<';
//     //         //     console.log(headers[i].value);
//     //         //     break;
//     //         //   }
//     //         //   // If you want to modify other headers, this is the place to
//     //         //   // do it. Either remove the 'break;' statement and add in more
//     //         //   // conditionals or use a 'switch' statement on 'headers[i].name'
//     //         // }
          
//     //         // blockingResponse.requestHeaders = headers;
//     //         // return blockingResponse;
//     //       },
//     //       {urls: [ "<all_urls>" ]},['requestHeaders','blocking']);
//     //   })

//     //   chrome.webRequest.onHeadersReceived.addListener(
//     //     function(d){console.log(d)}, { urls: [`*://*/*`] }, ["blocking", "responseHeaders"]
//     // );

   
//         });