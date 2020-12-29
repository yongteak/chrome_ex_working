var Body = $("body");
var TemplateSidebar = $('.sidebar');
var TemplateHeader = $('.t-header');
var PageContentWrapper = $(".page-content-wrapper");
var DesktopToggler = $(".t-header-desk-toggler");
var MobileToggler = $(".t-header-mobile-toggler");

$(".t-header-toggler").click(function () {
    $(".t-header-toggler").toggleClass("arrow");
});

$(".sidebar .navigation-menu > li > a[data-toggle='collapse']").on("click", function () {
    console.log('navigation - menu..');
    $(".sidebar .navigation-menu > li").find('.collapse.show').collapse('hide');
    $(".sidebar .sidebar_footer").removeClass("opened");
});

DesktopToggler.on("click", function () {
    $(Body).toggleClass("sidebar-minimized");
});

// SIDEBAR TOGGLE FUNCTION FOR MOBILE (SCREEN "MD" AND DOWN)
MobileToggler.on("click", function () {
    $(".page-body").toggleClass("sidebar-collpased");
});