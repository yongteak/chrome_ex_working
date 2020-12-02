'use strict';

class Tab {
    constructor(url, favicon, days, dataUsage, summary, counter) {
        this.url = url;
        this.favicon = favicon;
        if (summary !== undefined)
            this.summaryTime = summary;
        else
            this.summaryTime = 0;
        if (counter !== undefined)
            this.counter = counter;
        else
            this.counter = 0;

        if (dataUsage !== undefined)
            this.dataUsage = dataUsage;
        else
            this.dataUsage = 0;

        if (days !== undefined)
            this.days = days;
        else
            this.days = [];
    }

    incSummaryTime() {
        this.summaryTime += 1;

        var today = formatDate();
        var day = this.days.find(x => x.date == today);
        if (day === undefined) {
            this.addNewDay(today);
        }
        else {
            day['summary'] += 1;
        }
    }

    getTodayTime() {
        var today = formatDate();
        return this.days.find(x => x.date == today).summary;
    }

    getDataUsaged() {
        var today = formatDate();
        try {
            var data = this.days.find(x => x.date == today).dataUsage;
            if (isNaN(data)) {
                this.incDataUsaged(true);
                return 0;
            } else {
                return data;
            }    
        } catch (_error) {
            this.incDataUsaged(true);
            return 0;
        }
        
    }

    incDataUsaged(init,increasedSize) {
        init = init || false;
        increasedSize = increasedSize || 1;

        this.dataUsage += increasedSize;
        var today = formatDate();
        var day = this.days.find(x => x.date == today);

        if (day === undefined) {
            this.addNewDay(today);
        }
        else {
            if (init) {
                day['dataUsage'] = 0;
                this.dataUsage = 0;
            } else {
                day['dataUsage'] += increasedSize;
            }
        };
        // 순환참조?
        // this.getDataUsaged();
    }

    incCounter() {
        this.counter += 1;
        console.log('this.counter > ',this.counter);
        var today = formatDate();
        var day = this.days.find(x => x.date == today);
        if (day === undefined) {
            this.addNewDay(today);
        }
        else {
            day['counter'] += 1;
        }
    }

    addNewDay(today) {
        this.days.push(
            {
                'date': today,
                'summary': 1,
                'dataUsage': 0,
                'counter': 1
            }
        );
    }
};