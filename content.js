// var images = document.getElementsByTagName('img');
// for (var i = 0, l = images.length; i < l; i++) {
//   images[i].src = 'http://placekitten.com/' + images[i].width + '/' + images[i].height;
// }

// board_nav mypage
// chrome.runtime.sendMessage({action: "FINISH"}, function(response) {
//     // alert(response);
//     console.log(response);
// });

function test() {
    alert('test!');
}
// $(".board_nav").prepend('<input id="TestButton" class="report_label radius" title="메모 목록 공유하기" type="button" name="sync_memo"" value="메모 목록 공유하기"" data-runtime-disabled="runtime.Disabled" data-runtime-aria-label="runtime.ariaLabel" data-runtime-hide="runtime.Hide" aria-label="Test Button">');
// $("body").prepend('<input class="sync_memo report_label radius" title="메모 목록 공유하기" type="button" value="메모 목록 공유하기"" data-runtime-disabled="runtime.Disabled" data-runtime-aria-label="runtime.ariaLabel" data-runtime-hide="runtime.Hide" aria-label="Test Button">');


$('.sync_memo').on('click', function (e) {
    e.preventDefault();
    var f = function (a, n, f) {
          var url = "https://www.clien.net/service/mypage/memo?&po=" + n;
        console.log("### count > " + n +"  :  " + url)
        fetch(url).then(r => r.text()).then(result => {
            var html = result;
            if ($("div.list_item.user_memo", result).length > 0) {
                $("div.list_item.user_memo", result).each(function (i,v) {
                    a.push(
                        {
                            "user_id": $(".contact_id", v).text().trim().split(":")[1].trim(),
                            "nick": $(".nickname", v).text().trim(),
                            "memo": $(".scrap_memo", v).text().trim()
                        })
                });
                console.log("@@ 1 size -> "+a.length);
                f(a,n+1,f)
            } else {
                console.log(a);
                return a;
            }
        });
    };
    // 함수에서 채워진 array값을 반환하지 않음, 상태가 함수라서 그런가..
    var ar = [];
    var x = f(ar,0,f);

    $("div.list_item.user_memo").size();

    var a = [];

    if ($("div.list_item.user_memo").slze() > 0) { }

    $("div.list_item.user_memo").each(function () {
        a.push(
            {
                "user_id": $(".contact_id", this).text().trim().split(":")[1].trim(),
                "nick": $(".nickname", this).text().trim(),
                "memo": $(".scrap_memo", this).text()
            })
    })


    console.log('@sync_memo click');
    var x = $("div.list_item.user_memo a.list_author a.nickname").find('span').text();
    $("div.list_item user_memo")
    console.log(x);
    // fetch('https://www.clien.net/service/mypage/memo').then(r => r.text()).then(result => {
    //     console.log(result);
    //     // Result now contains the response text, do what you want...
    // })
});
console.log('content.js start')

