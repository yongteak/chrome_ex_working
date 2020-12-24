// 
// function open(e, viewName) {
//     // Declare all variables
//     var i, tabcontent, tablinks;

//     // Get all elements with class="tabcontent" and hide them
//     tabcontent = document.getElementsByClassName("tabcontent");
//     for (i = 0; i < tabcontent.length; i++) {
//         tabcontent[i].style.display = tabcontent[i].id == viewName ? "block" : "none";
//     }

//     tablinks = document.getElementsByClassName("tablink");
//     for (i = 0; i < tablinks.length; i++) {
//         tablinks[i].className = tablinks[i].className.replace("active", "");
//     }

//     // Get all elements with class="tablinks" and remove the class "active"
//     // tablinks = document.getElementsByClassName("tablinks");
//     // for (i = 0; i < tablinks.length; i++) {
//     //     tablinks[i].className = tablinks[i].className.replace(" active", "");
//     // }

//     // Show the current tab, and add an "active" class to the button that opened the tab
//     // document.getElementById(viewName).style.display = "block";
//     e.currentTarget.className = "active";
// }

// document.addEventListener("DOMContentLoaded", function () {
//     document.getElementById("view1").addEventListener("click", (e) => open(e, "view1"));
//     document.getElementById("view2").addEventListener("click", (e) => open(e, "view2"));
//     document.getElementById("view3").addEventListener("click", (e) => open(e, "view3"));

//     document.getElementById("clear").addEventListener("click", (e) => {
//         console.log('모든 데이터 삭제')
//     });
    

//     var tabcontent = document.getElementsByClassName("tabcontent");
//     for (var i = 1; i < tabcontent.length; i++) {
//         tabcontent[i].style.display =  "none";
//     };
//     // tabcontent[0].style.display =  "block";
//     // document.getElementById("view4").addEventListener("click", (e) => open(e, view4));
// });

