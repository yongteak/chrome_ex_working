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
            var db = new PouchDB(name,{revs_limit: 1, auto_compaction: true});

            if (full_sync) {
                // [2021-01-04 14:03:46]
                // 기존 데이터 제거 필요
                db.destroy().then(_res => {
                    console.log(name, 'db removed!');
                }).then(_res => {
                    db = new PouchDB(name,{revs_limit: 1, auto_compaction: true});
                    console.log('remove next');
                    var docs = [];
                    value.forEach(t => docs.push(prepareDoc(t.url, t)));
                    console.log(docs);
                    db.bulkDocs(docs).then(res => {
                        deferred.resolve(res);
                    }).catch(err => {
                        deferred.resolve(err);
                    });
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
                }).then(res => {
                    deferred.resolve(res);
                }).catch(err => {
                    db.put(prepDocs).then(res => {
                        deferred.resolve(res);
                    }).catch(err => {
                        deferred.resolve(err);
                    });
                });
            }
            return deferred.promise;
        },
        alldocs: (name, include_docs) => {
            include_docs = include_docs || false
            // console.log('alldocs > ', name);
            var deferred = $q.defer();
            new PouchDB(name,{revs_limit: 1, auto_compaction: true}).allDocs({
                include_docs: include_docs
            }).then(res => {
                console.log(res);
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        getdocs: (name, keys) => {
            keys = keys.reduce((acc, cur) => {
                acc.push({ 'id': cur });
                return acc;
            },[]);
            var deferred = $q.defer();
            new PouchDB(name,{revs_limit: 1, auto_compaction: true}).bulkGet({docs:keys}).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        getdoc: (name, key) => {
            var deferred = $q.defer();
            new PouchDB(name,{revs_limit: 1, auto_compaction: true}).get(key).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        setdoc: (name, key, value) => {
            var prepDoc = prepareDoc(key, value);
            var deferred = $q.defer();
            var db = new PouchDB(name,{revs_limit: 1, auto_compaction: true});
            db.get(prepDoc._id).then(doc => {
                return db.put({
                    _id: doc._id,
                    _rev: doc._rev,
                    value: value
                }, { force: true });
            }).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                db.put(prepDoc).then(res => {deferred.resolve(res);
                }).catch(err => {
                    deferred.resolve(err);
                });
            });
            return deferred.promise;
        },
        removeData: function (key) {
            console.log("Get");
            var deferred = $q.defer();
            var db = new PouchDB('test',{revs_limit: 1, auto_compaction: true});
            db.get(key)
            .then(doc => {return db.remove(doc)})
            .then(res => {deferred.resolve(res)})
            .catch(err => {deferred.reject(err)});
            return deferred.promise;
        },
        clear: name => {
            var db = new PouchDB(name,{revs_limit: 1, auto_compaction: true});
            var deferred = $q.defer();
            db.destroy()
            .then(res => {deferred.resolve(res)})
            .catch(err => {deferred.reject(err)});
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
                                pounch.getdoc(CONFIG.STORAGE_TABS, d.key).then(doc => {
                                    doc.value.days.forEach(d => {
                                        var find = days.find(x => x.day == d.date);
                                        if (find) {
                                            find.url.push(doc.value.url);
                                            find.counter += d.counter;
                                            find.summary += d.summary;
                                            find.dataUsage += d.dataUsage;
                                        } else {
                                            days.push({
                                                day: d.date,
                                                url: [doc.value.url],
                                                counter: doc.value.counter,
                                                summary: doc.value.summaryTime,
                                                dataUsage: doc.value.dataUsage
                                            })
                                        }
                                        if (index == docs.total_rows - 1) {
                                            console.log('end of loop, ready!');
                                            chrome.storage.local.set({
                                                ['summary']: { 'last': moment().valueOf(), 'rows': days }
                                            });
                                            console.log('new epoc', moment().valueOf());
                                            callback(days);
                                        }
                                    })
                                });
                            });
                        } else {
                            callback('tabs_not_found');
                        }
                    }).catch(err => {
                        console.error(err);
                    })
                } else {
                    console.log('old epoc', moment().valueOf(), item.summary.last, moment().valueOf() - item.summary.last);
                    callback(item.summary.rows);
                }
            })
        }
    };
    return pounch;
}
