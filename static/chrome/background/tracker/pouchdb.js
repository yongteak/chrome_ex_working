// https://developer.chrome.com/extensions/storage
/*
[2020-12-05 00:10:43]
 - 동기화
  1. 클라우드 로드
  2. 로컬 관리
  3. 클라우드 로드및 마지막 동기화 시간 flag확인
  4. 로컬 -> 클라우드 복제
*/
'use strict';

class PouchStorage {
    constructor(cb) {
        // var auth_loaded = false;
        // var pouch_loaded = false;
        // [POUCHDB_JS,POUCH_AUTH_DB_JS].forEach(js => {
        var scriptEl = document.createElement('script');
        scriptEl.src = chrome.extension.getURL(POUCHDB_JS);
        scriptEl.addEventListener('load', () => {
            var scriptEl1 = document.createElement('script');
            scriptEl1.src = chrome.extension.getURL(POUCH_AUTH_DB_JS);
            scriptEl1.addEventListener('load', () => {
                cb(PouchDB);
            })
            document.head.appendChild(scriptEl1);
        }, false);
        document.head.appendChild(scriptEl);
        // });
        // var interval = setInterval(() => {
        //     if (this.ready && this.auth_loaded && this.pouch_loaded) {
        //         clearInterval(interval);
        //         cb(PouchDB);
        //     } else {
        //         console.log('wait.. pouch module..');
        //     }
        //     this.ready = true;
        // }, 1000);
    }

    getdoc(db, id) {
        var deferred = $q.defer();
        db.get(id)
            .then(deferred.resolve)
            .catch(deferred.resolve);
        return deferred.promise;
    }

    instance(name) {
        return new PouchDB(name);
    }

    purge() {

    }

    join(remote, callback) {
        console.log('db join');
        remote.signUp(id, pw)
            .then(res => {
                if (res.ok) {
                    this.login(callback);
                }
            }).catch(err => {
                console.error(err);
                callback('err');
            });
    }
    login(callback) {
        // var url = 'http://34.83.116.28:5984' + '/g114916629141904173371';
        var url = COUCHDB_REMOTE_URI + '/g' + USER_ID;
        var remote = new PouchDB(url);
        console.log('db login');
        var id = '114916629141904173371';
        var pw = '114916629141904173371'.split("").reverse().join("");
        remote.login(id, pw)
            .then(res => {
                console.log('login > ', res);
                this.sync(callback);
            }).catch(err => {
                console.error(err);
                if (err.name == 'unauthorized') {
                    this.join(remote, callback)
                }
            })
    }
    async sync(callback) {
        if (performance.measureMemory) {
            try {
                const result = await performance.measureMemory();
                // console.log('measureMemory', result);
            } catch (err) {
                // console.error('measureMemory', err);
            }
        }

        if (typeof process != 'undefined') {
            console.log(`Node: ${process.memoryUsage().heapUsed / Math.pow(1000, 2)} MB`);
        } else if (performance) {
            console.log(`Browser: ${performance.memory.usedJSHeapSize / Math.pow(1000, 2)} MB`);
        } else {
            // throw ('Where d-heck are you trying to run me?');
        }
        // console.log('sync..classification > ', classification);
        // diff_tabs
        // console.log('1111', new Date().valueOf());
        var db = new PouchDB('tabs');
        var url = COUCHDB_REMOTE_URI + '/g' + USER_ID;
        // console.log('start sync!', url);
        // var opts = { live: false, retry: true };
        db.replicate.from(url).on('complete', info => {
            console.log('from sync ok', info);
            console.log('2', new Date().valueOf());
            this.merge(db, res => {
                callback(res);
                // callback(res);
                // db.sync(url, opts)
                //     .on('complete', info1 => {
                //         // console.log('sync complete!', info1);
                //         callback('complete');
                //     }).on('error', err => {
                //         console.error(err);
                //         callback('error');
                //     });
            })
        }).on('error', callback);
    }
    // new PouchDB('tabs').destroy();
    merge(db, callback) {
        // pull, merge, push, purge
        // pull -> diff_tabs 병합 -> push
        const diff_db = new PouchDB('diff_tabs', { revs_limit: 5, auto_compaction: true });

        const clearDiffDocs = function (doc) {
            diff_db.get(doc._id)
                .then(doc1 => {
                    //     doc._deleted = true;
                    //     return db.put(doc);
                    // }).then(function (result) {
                    doc1._deleted = true;
                    diff_db.put(doc1)
                        .then(res => {
                            console.log('remove put >', res, doc._id);
                            // doc._delete = true;
                            // return diff_db.put(doc);

                            // remove이후 _delete 는 아래와 같은 오류 발생함, 하나만 선택할것
                            // docId: "www.google.com"
                            // error: true
                            // message: "Bad special document member: _delete"
                            // name: "doc_validation"
                            // reason: "_delete"
                            // status: 500
                        })
                        // .then(res => {
                        //     console.log('delete doc >', res, doc);
                        // })
                        .catch(err => console.error(err))
                })
                .catch(err1 => 1);


            // 왜 무한 loop에 빠지는가?
            // var db1 = new PouchDB('diff_tabs');
            // console.log('[clearDiffDocs] > ', doc._id, doc._rev);
            // db1.remove(doc)
            //     .then(_r => {
            //         // console.log('[pouchdb] removed doc id =>', doc._id, doc._rev);
            //         db1.get(doc._id)
            //             .then(doc1 => {
            //                 // console.log('get',doc1._id, doc1._rev);
            //                 return clearDiffDocs(doc1);
            //             })
            //             .catch(err1 => 1);
            //     })
            //     .catch(err2 => 1);
        }

        diff_db.allDocs({
            include_docs: true
        }).then(local_docs => {
            var diff = {};
            var bulkdocs = [];
            var new_push_docs = [];
            var removeDocs = [];
            if (local_docs.total_rows > 0) {
                local_docs.rows.forEach(e => {
                    bulkdocs.push({ id: e.doc._id });
                    diff[[e.id]] = e.doc.value;
                    removeDocs.push(e.doc);
                });
                db.bulkGet({ docs: bulkdocs })
                    .then(docs => {
                        docs.results.forEach((res, loop) => {
                            if (res.docs[0].ok) {
                                var odoc = res.docs[0]['ok'].value;
                                var rev = res.docs[0]['ok']._rev;
                                var ddoc = diff[res.id];

                                if (res.id.match(/^bucket\_/) == null) {
                                    // check migraion
                                    // var migraion = false;
                                    if (odoc.hasOwnProperty('category') && (odoc.category.length != 3 || odoc.category == '000')) {
                                        var arr = odoc.url.split('.');
                                        var split_name = arr.slice(arr.length - 2, arr.length).join('.');
                                        var split_dot_name = arr[0] + '.';
                                        if (classification[split_name]) {
                                            odoc.category = classification[split_name];
                                        } else if (classification[split_dot_name]) {
                                            odoc.category = classification[split_dot_name];
                                        }
                                        // console.log('update classification', odoc.url, '>', odoc.category);
                                    }

                                    if (odoc.summaryTime != ddoc.summaryTime) {
                                        odoc.summaryTime += Math.abs(odoc.summaryTime - ddoc.summaryTime);
                                        ddoc.days.forEach((day, index) => {
                                            if (odoc.days[index]) {
                                                // todo
                                                // second에서 집계
                                                // 24시간 초과 데이터 보정
                                                ['counter', 'dataUsage', 'summary'].forEach(field => {
                                                    var num1 = Number.isInteger(day[field]) ? day[field] : 0;
                                                    var num2 = Number.isInteger(odoc.days[index][field]) ? odoc.days[index][field] : 0;
                                                    odoc.days[index][field] += Math.abs(num1 - num2);
                                                });
                                                // todo
                                                // 1시간 초과 데이터 보정
                                                day.hours.forEach((h, idx) => {
                                                    ['counter', 'dataUsage', 'second'].forEach(field => {
                                                        odoc.days[index].hours[idx][field] +=
                                                            Math.abs(h[field] - odoc.days[index].hours[idx][field])
                                                    })
                                                });
                                            }
                                        })
                                    }
                                } else if (res.id == 'bucket_event') {
                                    ddoc.forEach((e, index) => {
                                        var find = odoc.find(x => x.epoch == e.epoch);
                                        if (find) ddoc.push(e);
                                    })
                                } else {
                                    //
                                }
                                new_push_docs.push({ _id: res.id, _rev: rev, value: odoc });
                            } else {
                                new_push_docs.push({ _id: res.id, value: diff[res.id] });
                            }
                            if (loop == docs.results.length - 1) {
                                if (new_push_docs.length > 0) {
                                    /\s*/g.exec(''); // clear regex cache to prevent memory leak
                                    fetch("http://localhost:8080/api/v1/push/114916629141904173371",
                                        {
                                            method: "PUT",
                                            headers: {
                                                'Accept': 'application/json, text/plain, */*',
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ payload: new_push_docs })
                                        })
                                        .then(res1 => res1.json())
                                        .then(res2 => {
                                            // console.log(res2);
                                            // 정상적으로 통신됐을때만 diff내용을 삭제한다.
                                            // removeDocs.forEach(target => {
                                            //     clearDiffDocs(target);
                                            // });
                                            diff_db.destroy()
                                                .then(response => {
                                                    console.log('clear diff_db completed!', response);
                                                    callback({ instnace: new PouchDB('diff_tabs'), error: false, message: null });
                                                }).catch(err => {
                                                    // callback({ error: true, message: err });
                                                    callback({ instnace: new PouchDB('diff_tabs'), error: false, message: null });
                                                    console.error('diff_db error', err);
                                                });
                                        })
                                        .catch(err => {
                                            console.error(err);
                                            callback({ error: true, message: err });
                                        });
                                    // 서버 push
                                    // 완료후 pull, 충돌시?
                                    // [
                                    //     {
                                    //         "ok": true,
                                    //         "id": "gist.github.com",
                                    //         "rev": "3472-ee847d86935aa748579fe32ecd02f528"
                                    //     },
                                    //     {
                                    //         "id": "www.clien.net",
                                    //         "error": "conflict",
                                    //         "reason": "Document update conflict."
                                    //     }
                                    // ]
                                    // console.log(JSON.stringify(details)new_push_docs));

                                    // db.bulkDocs(new_push_docs)
                                    //     .then(bulk => {
                                    //         // console.log('bulk update completed!', bulk);
                                    //         callback();
                                    //         // diff_db.destroy()
                                    //         //     .then(response => {
                                    //         //         console.log('clear diff_db completed!', response);
                                    //         //         // chrome.extension.getBackgroundPage().reload();
                                    //         //         callback();
                                    //         //     }).catch(err => {
                                    //         //         callback();
                                    //         //         console.err('diff_db error', err);
                                    //         //     });
                                    //     }).catch(err => {
                                    //         callback();
                                    //         // console.err('bulk update error', err);
                                    //     });
                                } else {
                                    callback({ error: false, message: 'diff nothing..' });
                                }
                                return;
                            }
                        })
                    })
                    .catch(err => console.error(err));
            } else {
                callback({ error: false, message: 'diff nothing..' });
            }
        });
    }

}

// tabs