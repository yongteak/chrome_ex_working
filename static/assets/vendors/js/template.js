'use strict';


// THEME COLORS
var style = getComputedStyle(document.body);
var chartColors = ["#696ffb", "#7db8f9", "#05478f", "#00cccc", "#6CA5E0", "#1A76CA"];
var primaryColor = style.getPropertyValue('--primary');
var secondaryColor = style.getPropertyValue('--secondary');
var successColor = style.getPropertyValue('--success');
var warningColor = style.getPropertyValue('--warning');
var dangerColor = style.getPropertyValue('--danger');
var infoColor = style.getPropertyValue('--info');
var darkColor = style.getPropertyValue('--dark');


// BODY ELEMENTS
var Body = $("body");
var TemplateSidebar = $('.sidebar');
var TemplateHeader = $('.t-header');
var PageContentWrapper = $(".page-content-wrapper");
var DesktopToggler = $(".t-header-desk-toggler");
var MobileToggler = $(".t-header-mobile-toggler");


if ($('body').hasClass("dark-theme")) {
  var chartFontcolor = '#b9c0d3';
  var chartGridLineColor = '#383e5d';

} else {
  var chartFontcolor = '#6c757d';
  var chartGridLineColor = 'rgba(0,0,0,0.08)';
}


// SIDEBAR TOGGLE FUNCTION FOR LARGE SCREENS (SCREEN "LG" AND UP)
DesktopToggler.on("click", function () {
  $(Body).toggleClass("sidebar-minimized");
});

// SIDEBAR TOGGLE FUNCTION FOR MOBILE (SCREEN "MD" AND DOWN)
MobileToggler.on("click", function () {
  $(".page-body").toggleClass("sidebar-collpased");
});


// CHECK FOR CURRENT PAGE AND ADDS AN ACTIVE CLASS FOR TO THE ACTIVE LINK
var current = location.pathname.split("/").slice(-1)[0].replace(/^\/|\/$/g, '');
$('.navigation-menu li a', TemplateSidebar).each(function () {
  var $this = $(this);
  if (current === "") {
    //FOR ROOT URL
    if ($this.attr('href').indexOf("index.html") !== -1) {
      $(this).parents('li').last().addClass('active');
      if ($(this).parents('.navigation-submenu').length) {
        $(this).addClass('active');
      }
    }
  } else {
    //FOR OTHER URL
    if ($this.attr('href').indexOf(current) !== -1) {
      $(this).parents('li').last().addClass('active');
      if ($(this).parents('.navigation-submenu').length) {
        $(this).addClass('active');
      }
      if (current !== "index.html") {
        $(this).parents('li').last().find("a").attr("aria-expanded", "true");
        if ($(this).parents('.navigation-submenu').length) {
          $(this).closest('.collapse').addClass('show');
        }
      }
    }
  }
});


// THEME SWITCH FUNCTION
function themeSwitch(url) {
  var currentURL = window.location.href;
  var res = currentURL.split("/");
  var abs_url = currentURL.replace(/demo_.\d*/, url);
  window.location.href = abs_url;
}
$("#light-theme-active").on("click", function (e) {
  e.preventDefault();
  themeSwitch('demo_1');
});
$("#dark-theme-active").on("click", function (e) {
  e.preventDefault();
  themeSwitch('demo_2');
});


$(".t-header-toggler").click(function () {
  $(".t-header-toggler").toggleClass("arrow");
});


// SIDEBAR COLLAPSE FUNCTION
$(".sidebar .navigation-menu > li > a[data-toggle='collapse']").on("click", function () {
  $(".sidebar .navigation-menu > li").find('.collapse.show').collapse('hide');
  $(".sidebar .sidebar_footer").removeClass("opened");
});


$(".email-header .email-aside-list-toggler").on("click", function () {
  $(".email-wrapper .email-aside-list").toggleClass("open");
});


$(".btn.btn-refresh").on("click", function () {
  $(this).addClass("clicked");
  setTimeout(function () {
    $(".btn.btn-refresh").removeClass("clicked");
  }, 3000);
});


$(".btn.btn-like").on("click", function () {
  $(this).toggleClass("clicked");
  $(this).find("i").toggleClass("mdi-heart-outline clicked").toggleClass("mdi-heart");
});

$(".right-sidebar-toggler").on("click", function () {
  $(".right-sidebar").toggleClass("right-sidebar-opened");
});


$(".email-compose-toolbar .toolbar-menu .delete-draft").on("click", function () {
  $(".email-compose-wrapper").removeClass("open");
  $("#email-compose")[0].reset()
});


$(".email-composer").on("click", function () {
  $(".email-compose-wrapper").addClass("open");
});


$(".email-compose-wrapper .email-compose-header .header-controls .compose-minimize").on("click", function () {
  $(this).addClass("minimized");
  $(".email-compose-wrapper").addClass("compose-minimized");
  $(this).parentsUntil(".email-compose-header").append('<div class="header-ovelay"></div>');
  $(".email-compose-wrapper .header-ovelay").on("click", function () {
    $(".email-compose-wrapper").removeClass("compose-minimized");
    this.remove(".header-ovelay");
    $(".email-compose-wrapper .email-compose-header .header-controls .compose-minimize").removeClass("minimized");
  });
});


if ($('.animated-count').length) {
  $('.animated-count').counterUp({
    delay: 50,
    time: 800
  });
}

$('[data-toggle="tooltip"]').tooltip({
  animation: true,
  delay: 100,
});