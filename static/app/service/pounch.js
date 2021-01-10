angular.module('app.pounch', [])
    .factory('pounch', ['$q','$filter','CONFIG', function ($q, $filter, CONFIG) {
        return {
            // tabs, domain, data, true
            setTabs: (key, value, full_sync) => {
                var deferred = $q.defer();
                var db = new PouchDB('tabs', { revs_limit: 1, auto_compaction: true });

                if (full_sync) {
                    // [2021-01-04 14:03:46]
                    // 기존 데이터 제거 필요
                    db.destroy().then(_res => {
                        console.log('tabs', 'db removed!');
                    }).then(_res => {
                        db = new PouchDB('tabs', { revs_limit: 1, auto_compaction: true });
                        console.log('remove next');
                        var docs = [];
                        value.forEach(t =>
                            docs.push($filter('prepareDoc')(t.url, t))
                        );
                        db.bulkDocs(docs)
                            .then(deferred.resolve)
                            .catch(deferred.resolve);
                    }).catch(_err => { });
                } else {
                    var prepDoc = $filter('prepareDoc')(key, value)
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
                new PouchDB('tabs', { revs_limit: 1, auto_compaction: true }).bulkGet({ docs: keys })
                    .then(deferred.resolve)
                    .catch(deferred.reject);
                return deferred.promise;
            },
            // check!
            create_bucket: () => {
                // var deferred = $q.defer();
                // var db = new PouchDB('tabs', { revs_limit: 1, auto_compaction: true });
                // db.get('bucket_$$$')
                //     .then(deferred.resolve)
                //     .catch(e=>{
                //         db.put({
                //             _id: 'bucket_$$$',
                //             "setting_view_time_in_badge": null,
                //             "black_list": [],
                //             "restriction_list": [],
                //             "restriction_access_list": [],
                //             "alarm_list": [],
                //             "sync_history": [],
                //             "notification_list": []
                //         }, { force: false })
                //     })
                // return deferred.promise;
            },
            cleanbucket: () => {
                var deferred = $q.defer();
                var db = new PouchDB('tabs', { revs_limit: 1, auto_compaction: true });
                db.get('bucket_$$$')
                    .then(doc => {return db.remove(doc)})
                    .then(deferred.resolve)
                    .catch(deferred.reject);
                return deferred.promise;
            },
            getbucket: (key) => {
                var deferred = $q.defer();
                new PouchDB('tabs', { revs_limit: 1, auto_compaction: true }).get('bucket_$$$')
                    .then(items => {
                        deferred.resolve(items[key])
                    })
                    .catch(deferred.reject);
                return deferred.promise;
            },
            setbucket: (key, value) => {
                // var prepDoc = $filter('prepareDoc')(key, value);
                var deferred = $q.defer();
                var db = new PouchDB('tabs', { revs_limit: 1, auto_compaction: true });
                db.get('bucket_$$$')
                    .then(doc => {
                        doc[key] = value;
                        return db.put(doc, { force: true });
                    })
                    .catch(deferred.reject)
                return deferred.promise;
            },
            getdoc: (key) => {
                var deferred = $q.defer();
                new PouchDB('tabs', { revs_limit: 1, auto_compaction: true }).get(key)
                    .then(deferred.resolve)
                    .catch(deferred.reject);
                return deferred.promise;
            },
            setdoc: (name, key, value) => {
                var prepDoc = $filter('prepareDoc')(key, value);
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
            setdocs: (docs) => {
                var deferred = $q.defer();
                new PouchDB('tabs', { revs_limit: 1, auto_compaction: true })
                    .bulkDocs(docs)
                    .then(deferred.resolve)
                    .catch(deferred.resolve);
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
            }
        }
    }])
