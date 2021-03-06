'use strict';

class Activity {
    addTab(tab) {
        if (this.isValidPage(tab) === true) {
            if (tab.id && (tab.id != 0)) {
                tabs = tabs || [];
                var domain = this.extractHostname(tab.url);
                if (domain == 'data.similarweb.com') return;
                var isDifferentUrl = false;
                if (currentTab !== tab.url) {
                    isDifferentUrl = true;
                }

                if (this.isNewUrl(domain) && !this.isInBlackList(domain)) {
                    var favicon = tab.favIconUrl;
                    if (favicon === undefined) {
                        favicon = 'chrome://favicon/' + domain;
                    }
                    var newTab = new Tab(domain, 'none', 'none', 'none', favicon,[],0,0,0);
                    tabs.push(newTab);
                }

                if (isDifferentUrl && !this.isInBlackList(domain)) {
                    this.setCurrentActiveTab(domain);
                    var tabUrl = this.getTab(domain);
                    if (tabUrl !== undefined)
                        tabUrl.incCounter();
                    // this.addTimeInterval(domain);
                }
            }
        } else this.closeIntervalForCurrentTab();
    }

    incDataUsaged(tab, increasedSize) {
        var domain = this.extractHostname(tab.url);
        var tabUrl = this.getTab(domain);
        if (tabUrl !== undefined)
            tabUrl.incDataUsaged(false, increasedSize);
    }

    getDataUsaged(tab) {
        var domain = this.extractHostname(tab.url);
        var tabUrl = this.getTab(domain);
        if (tabUrl !== undefined) {
            return tabUrl.getDataUsaged()
        } else {
            return 0;
        }
    }

    isValidPage(tab) {
        if (!tab || !tab.url || (tab.url.indexOf('http:') == -1 && tab.url.indexOf('https:') == -1)
            || tab.url.indexOf('chrome://') !== -1
            || tab.url.indexOf('//127.0.0.1') !== -1
            || tab.url.indexOf('//localhost') !== -1
            || tab.url.indexOf('chrome-extension://') !== -1)
            return false;
        return true;
    }

    // 추적 금지
    isInBlackList(domain) {
        var find = false;
        if (setting_black_list !== undefined && setting_black_list.length > 0) {
            // console.log('isInBlackList', domain, setting_black_list);
            // match == null : black대상 아님
            setting_black_list.forEach(e => {
                if (!find) {
                    find = this.extractHostname(domain).match(e) != null;
                }
            });
        }
        // console.log('FIND > isInBlackList',find);
        return find;
    }
    // 접근 제한
    isLimitExceeded(domain) {
        if (setting_restriction_list !== undefined && setting_restriction_list.length > 0) {
            var item = setting_restriction_list.find(o =>
                o.enabled && isDomainEquals(this.extractHostname(o.domain), this.extractHostname(domain))
            );
            if (item !== undefined) {
                var startHm = hhmmStrToNumber(item.time_start);
                var endHm = hhmmStrToNumber(item.time_end);
                var curHm = new Date().toTimeString().split(' ')[0].split(':');
                new Date().toTimeString().split(' ')[0].split(':').splice(1, 1)
                curHm.splice(2, 1);
                curHm = parseInt(curHm.join(''));
                var isAllow = startHm < curHm && curHm < endHm;
                return !isAllow;
            }
        }
        return false;
    }

    isNewUrl(domain) {
        if (tabs.length > 0)
            return tabs.find(o => o.url === domain) === undefined;
        else return true;
    }

    getTab(domain) {
        if (tabs !== undefined) {
            return tabs.find(o => o.url === domain);
        }
    }

    extractHostname(url) {
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

    updateFavicon(tab) {
        try {
            var domain = this.extractHostname(tab.url);
            var currentTab = this.getTab(domain);
            if (currentTab !== null && currentTab !== undefined) {
                if (tab.favIconUrl !== undefined && tab.favIconUrl !== currentTab.favicon) {
                    currentTab.favicon = tab.favIconUrl;
                }
            }
        } catch (err) {
            console.error('tab',tab,'error',err);
        }

    }

    setCurrentActiveTab(domain) {
        // this.closeIntervalForCurrentTab();
        currentTab = domain;
        // this.addTimeInterval(domain);
    }

    clearCurrentActiveTab() {
        // this.closeIntervalForCurrentTab();
        currentTab = '';
    }

    // addTimeInterval(domain) {
    //     var today = formatDate();
    //     var item = timeIntervalList.find(o => o.domain === domain && o.day == today);
    //     if (item != undefined) {
    //         if (item.day == today)
    //             item.addInterval();
    //         else {
    //             var newInterval = new TimeInterval(today, domain);
    //             newInterval.addInterval();
    //             timeIntervalList.push(newInterval);
    //         }
    //     } else {
    //         var newInterval = new TimeInterval(today, domain);
    //         newInterval.addInterval();
    //         timeIntervalList.push(newInterval);
    //     }
    // }

    closeIntervalForCurrentTab() {
        if (currentTab !== '') {// && timeIntervalList) {
            // var item = timeIntervalList.find(o => o.domain === currentTab && o.day == formatDate());
            // if (item != undefined)
            //     item.closeInterval();
        }
        currentTab = '';
    }

    isNeedNotifyView(domain, tab) {
        if (setting_notification_list !== undefined && setting_notification_list.length > 0) {
            var item = setting_notification_list.find(o => isDomainEquals(this.extractHostname(o.domain), this.extractHostname(domain)));
            if (item !== undefined) {
                var today = formatDate();
                var data = tab.days.find(x => x.date == today);
                if (data !== undefined) {
                    var todayTimeUse = data.summary;
                    if (todayTimeUse == item.time || todayTimeUse % item.time == 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
};