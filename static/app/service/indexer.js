angular.module('app.indexer', [])
    .factory('indexer', ['$q', 'pounch', 'CONFIG', function ($q, pounch, CONFIG) {
        return {
            dashboard: (callback, data) => {
                if (data) {
                    console.log(data);
                    pounch.setdoc('indexer', 'dashboard',
                        { 'last': moment().valueOf(), 'rows': data })
                        // .then(console.log)
                        .then(res => console.log(res))
                        // .catch(console.error)
                        .catch(e => console.error(e))
                    callback('ok');
                } else {
                    pounch.getdoc('dashboard', 'indexer').then(doc => {
                        console.log('getdoc>', doc.value.last, moment().valueOf() - doc.value.last);
                        var next = moment().valueOf() - doc.value.last > 10000;// * 60;
                        if (!next) {
                            callback(doc.value.rows)
                        } else {
                            callback('not_found');
                        }
                    }).catch(error => {
                        console.error(error)
                        callback('not_found');
                    })
                }
            },
            domain_by_day: callback => {
                return pounch.getdoc('domain_by_day', 'indexer')
                    .then(doc => {
                        var ready = doc.value && doc.value.hasOwnProperty('rows');
                        ready = moment().valueOf() - doc.value.last > 10000;// * 60 * 60;
                        if (ready) {
                            callback(doc.value.rows);
                        } else {
                            build(callback);
                        }
                    })
                    .catch(err => {
                        if (err.name == "not_found") {
                            build(callback);
                        } else {
                            callback('tabs_not_found');
                        }
                    });
                function build(callback) {
                    pounch.alldocs('tabs').then(docs => {
                        // check bucket rows
                        if (docs.total_rows > 0) {
                            var days = [];
                            docs.rows
                                .forEach((d, index) => {
                                    if (d.id.indexOf(CONFIG.BUCKET_PREFIX) == -1) {
                                        pounch.getdoc(d.key).then(doc => {
                                            if (doc.value && doc.value.days) {  // check bucket
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
                                                pounch.setdoc('indexer', 'domain_by_day',
                                                    { 'last': moment().valueOf(), 'rows': days })
                                                    .then(console.log)
                                                    .catch(console.error)
                                                callback(days);
                                            }
                                        });
                                    }
                                });
                        } else {
                            callback('tabs_not_found');
                        }
                    }).catch(console.error)
                }
            }
        }
    }])