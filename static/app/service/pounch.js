angular.module('app.pounch', []).factory("pounch", pounch);

function pounch($q) {
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
            var db = new PouchDB(name);

            if (full_sync) {
                // [2021-01-04 14:03:46]
                // 기존 데이터 제거 필요
                db.destroy().then(_res => {
                    console.log(name, 'db removed!');
                }).then(_res => {
                    db = new PouchDB(name);
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


            /*db.destroy('login').then(function (destroyError, destroyResponse) {
                alert(1);
                if(destroyError!=null){
                    var db = new PouchDB('login');
                    db.put(prepDoc).then(function (response) {
                      // handle response
                        deferred.resolve(response);
                    }).catch(function (err) {
                      console.log(err);
                        deferred.reject(err);
                    });
                }
                else{
                    console.log(destroyError);
                    deferred.reject(destroyError);
                }
            },function() {
                alert(2);
                db.put(prepDoc).then(function (response) {
                      // handle response
                        deferred.resolve(response);
                    }).catch(function (err) {
                      console.log(err);
                        deferred.reject(err);
                    });
            });*/

            return deferred.promise;
        },
        alldocs: name => {
            console.log('alldocs > ', name);
            var deferred = $q.defer();
            new PouchDB(name).allDocs({
                include_docs: true
            }).then(res => {
                console.log(res);
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        getdoc: (name, key) => {
            console.log('getdoc > ', name, key);
            // bucket, setting, blacklist, ..
            var deferred = $q.defer();
            new PouchDB(name).get(key).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        setdoc: (name, key, value) => {
            var prepDoc = prepareDoc(key, value);
            var deferred = $q.defer();
            var db = new PouchDB(name);
            db.get(prepDoc._id).then(doc => {
                return db.put({
                    _id: doc._id,
                    _rev: doc._rev,
                    value: value
                }, { force: true });
            }).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                db.put(prepDoc).then(res => {
                    deferred.resolve(res);
                }).catch(err => {
                    deferred.resolve(err);
                });
            });
            return deferred.promise;
        },
        removeData: function (key) {
            console.log("Get");
            var deferred = $q.defer();
            var db = new PouchDB('test');
            db.get(key).then(function (doc) {
                return db.remove(doc);
            }).then(function (res) {
                deferred.resolve(res);
            }).catch(function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        clear: name => {
            var db = new PouchDB(name);
            var deferred = $q.defer();

            db.destroy().then(res => {
            }).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        deleteLoginData: function () {
            var db = new PouchDB('login');
            var deferred = $q.defer();

            db.destroy('login').then(function (destroyError, destroyResponse) {
                console.log(destroyError);
                if (destroyError != null) {
                    deferred.resolve(destroyResponse);
                }
                else {
                    deferred.reject(destroyError);
                }
            });
            return deferred.promise;
        }
        //      setConsentForm: function(consentFormData){
        //				var deferred = $q.defer();
        //				var db = new PouchDB('consentForm');
        //				var prepDoc = prepareDoc('consentForm', consentFormData);
        //				db.destroy('consentForm').then(function (destroyError, destroyResponse) {
        //					if(destroyError!=null){
        //						var db = new PouchDB('consentForm');
        //						db.put(prepDoc).then(function (response) {
        //						  // handle response
        //							deferred.resolve(response);
        //						}).catch(function (err) {
        //						  console.log(err);
        //							deferred.reject(err);
        //						});
        //					}
        //					else{
        //						deferred.reject(destroyError);
        //					}
        //				});
        //				return deferred.promise;
        //      },
        //			getConsentForm: function(){
        //                console.log("Get");
        //				var deferred = $q.defer();
        //				var db = new PouchDB('consentForm');
        //				db.get('consentForm').then(function (response) {
        //				  // handle response
        //                    console.log("Get1");
        //                    var responseData = angular.fromJson(EncryptionService.decrypt('consentForm',response.data));
        //                    console.log(responseData);
        //					deferred.resolve(responseData);
        //				}).catch(function (err) {
        //				  console.log(err);
        //					deferred.reject(err);
        //				});
        //				return deferred.promise;
        //      },
        //			deleteConsentForm: function(){
        //				var db = new PouchDB('consentForm');
        //				var deferred = $q.defer();
        //
        //				db.destroy('consentForm').then(function (destroyError, destroyResponse) {
        //					console.log(destroyError);
        //					if(destroyError!=null){
        //						deferred.resolve(destroyResponse);
        //					}
        //					else{
        //						deferred.reject(destroyError);
        //					}
        //				});
        //				return deferred.promise;
        //			}
    };
    return pounch;
}
