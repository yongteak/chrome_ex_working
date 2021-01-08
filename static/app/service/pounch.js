angular.module('app.pounch', []).factory("pounch", pounch);

function pounch($q, CONFIG) {
    var pounch;

    function prepareDoc(key, value) {
        var doc = {};
        doc['_id'] = key;
        doc['value'] = value;
        return doc;
    }

    pounch = {
        // tabs, domain, data, true
        setTabs: (name, key, value, full_sync) => {
            var deferred = $q.defer();
            var db = new PouchDB(name, { revs_limit: 1, auto_compaction: true });

            if (full_sync) {
                // [2021-01-04 14:03:46]
                // 기존 데이터 제거 필요
                db.destroy().then(_res => {
                    console.log(name, 'db removed!');
                }).then(_res => {
                    db = new PouchDB(name, { revs_limit: 1, auto_compaction: true });
                    console.log('remove next');
                    var docs = [];
                    value.forEach(t => docs.push(prepareDoc(t.url, t)));
                    console.log(docs);
                    db.bulkDocs(docs)
                        .then(deferred.resolve)
                        .catch(deferred.resolve);
                }).catch(_err => { });
            } else {
                var prepDoc = prepareDoc(key, value)
                db.get(prepDoc._id).then(doc => {
                    return db.put({
                        _id: doc._id,
                        _rev: doc._rev,
                        // add epoc time
                        value: value
                    }, { force: true });
                })
                    .then(deferred.resolve)
                    .catch(err => {
                        db.put(prepDocs)
                            .then(deferred.resolve)
                            .catch(deferred.resolve)
                    });
            }
            return deferred.promise;
        },
        alldocs: (name, include_docs) => {
            include_docs = include_docs || false
            // console.log('alldocs > ', name);
            var deferred = $q.defer();
            new PouchDB(name, { revs_limit: 1, auto_compaction: true }).allDocs({
                include_docs: include_docs
            })
                .then(deferred.resolve)
                .catch(deferred.reject);
            return deferred.promise;
        },
        getdocs: (keys) => {
            keys = keys.reduce((acc, cur) => {
                acc.push({ 'id': cur });
                return acc;
            }, []);
            var deferred = $q.defer();
            new PouchDB(CONFIG.STORAGE_TABS, { revs_limit: 1, auto_compaction: true }).bulkGet({ docs: keys })
                .then(deferred.resolve)
                .catch(deferred.reject);
            return deferred.promise;
        },
        // check!
        create_bucket: () => {
            var deferred = $q.defer();
            new PouchDB(CONFIG.STORAGE_TABS, { revs_limit: 1, auto_compaction: true })
                .put({
                    _id: CONFIG.BUCKET,
                    "setting_view_time_in_badge": null,
                    "black_list": [],
                    "restriction_list": [],
                    "restriction_access_list": [],
                    "alarm_list": [],
                    "sync_history": [],
                    "notification_list": []
                }, { force: false })
                .then(deferred.resolve)
                .catch(deferred.resolve);
            return deferred.promise;
        },
        getbucket: (key) => {
            var deferred = $q.defer();
            new PouchDB(CONFIG.STORAGE_TABS, { revs_limit: 1, auto_compaction: true }).get(CONFIG.BUCKET)
                .then(items => {
                    deferred.resolve(items[key])
                })
                .catch(deferred.reject);
            return deferred.promise;
        },
        setbucket: (key, value) => {
            var prepDoc = prepareDoc(key, value);
            var deferred = $q.defer();
            var db = new PouchDB(CONFIG.STORAGE_TABS, { revs_limit: 1, auto_compaction: true });
            db.get(CONFIG.BUCKET)
                .then(doc => {
                    doc[key] = value;
                    return db.put(doc, { force: true });
                })
                .catch(deferred.reject)
            return deferred.promise;
        },
        getdoc: (key) => {
            var deferred = $q.defer();
            new PouchDB(CONFIG.STORAGE_TABS, { revs_limit: 1, auto_compaction: true }).get(key)
                .then(deferred.resolve)
                .catch(deferred.reject);
            return deferred.promise;
        },
        setdoc: (name, key, value) => {
            var prepDoc = prepareDoc(key, value);
            var deferred = $q.defer();
            var db = new PouchDB(name, { revs_limit: 1, auto_compaction: true });
            db.get(prepDoc._id).then(doc => {
                return db.put({
                    _id: doc._id,
                    _rev: doc._rev,
                    value: value
                }, { force: true });
            }).then(deferred.resolve)
                .catch(err => {
                    db.put(prepDoc)
                        .then(deferred.resolve)
                        .catch(deferred.resolve);
                });
            return deferred.promise;
        },
        removeData: function (key) {
            console.log("Get");
            var deferred = $q.defer();
            var db = new PouchDB('test', { revs_limit: 1, auto_compaction: true });
            db.get(key)
                .then(doc => { return db.remove(doc) })
                .then(deferred.resolve)
                .catch(deferred.resolve);
            return deferred.promise;
        },
        clear: name => {
            var db = new PouchDB(name, { revs_limit: 1, auto_compaction: true });
            var deferred = $q.defer();
            db.destroy()
                .then(deferred.resolve)
                .catch(deferred.resolve);
            return deferred.promise;
        },
        summaryBuild: callback => {
            return chrome.storage.local.get('summary', function (item) {
                var empty = Object.keys(item).length === 0 && item.constructor === Object;
                if (empty || moment().valueOf() - item.summary.last > 5000) {
                    pounch.alldocs(CONFIG.STORAGE_TABS).then(docs => {
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
    };
    return pounch;
}
