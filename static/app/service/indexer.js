angular.module('app.indexer', [])
    .factory('indexer', ['$q','pounch','CONFIG',function ($q, pounch, CONFIG) {
        return {
            domain_by_day: callback => {
                return chrome.storage.local.get('summary', function (item) {
                    var empty = Object.keys(item).length === 0 && item.constructor === Object;
                    if (empty || moment().valueOf() - item.summary.last > 5000) {
                        pounch.alldocs('tabs').then(docs => {
                            if (docs.total_rows > 0) {
                                var days = [];
                                docs.rows.forEach((d, index) => {
                                    pounch.getdoc(d.key).then(doc => {
                                        if (doc.value) {  // check bucket
                                            doc.value.days.forEach(day => {
                                                var find = days.find(x => x.day == day.date);
                                                if (find) {
                                                    find.url.push(doc.value.url);
                                                    find.counter += day.counter;
                                                    find.summary += day.summary;
                                                    find.dataUsage += day.dataUsage;
                                                } else {
                                                    days.push({
                                                        day: day.date,
                                                        url: [doc.value.url],
                                                        counter: doc.value.counter,
                                                        summary: doc.value.summaryTime,
                                                        dataUsage: doc.value.dataUsage
                                                    })
                                                }
                                            })
                                        }

                                        if (index == docs.total_rows - 1) {
                                            console.log('end of loop, ready!');
                                            chrome.storage.local.set({
                                                ['summary']: { 'last': moment().valueOf(), 'rows': days }
                                            });
                                            callback(days);
                                        }
                                    });
                                });
                            } else {
                                callback('tabs_not_found');
                            }
                        }).catch(console.error)
                    } else {
                        console.log('old epoc', moment().valueOf(), item.summary.last, moment().valueOf() - item.summary.last);
                        callback(item.summary.rows);
                    }
                })
            }
        }
    }])