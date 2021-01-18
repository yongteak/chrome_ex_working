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
        var scriptEl = document.createElement('script');
        scriptEl.src = chrome.extension.getURL(POUNCHDB_JS);
        scriptEl.addEventListener('load', function () {
            cb(PouchDB);
            // this.is_ready = true;
        }, false);
        document.head.appendChild(scriptEl);
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

    join(db) {
        db.signUp(id, pw)
            .then(res => {
                if (res.ok) {
                    this.login();
                }
            }).catch(err => console.error(err));
    }
    login() {
        var id = '114916629141904173371';
        var pw = '114916629141904173371'.split("").reverse().join("");
        var db = new PouchDB('http://34.83.116.28:5984' + '/g114916629141904173371',
            { skip_setup: true, revs_limit: 5, auto_compaction: true });
        db.login(id, pw)
            .then(res => {
                // console.log('login > ', res);
                this.sync();
            }).catch(err => {
                if (err.name == 'unauthorized') {
                    this.join(db)
                }
            })
    }
    sync(callback) {
        // console.log('sync..classification > ', classification);
        // diff_tabs
        var db = new PouchDB('tabs');
        var url = 'http://34.83.116.28:5984' + '/g114916629141904173371';
        // console.log('start sync!', url);
        var opts = { live: false, retry: true };
        db.replicate.from(url).on('complete', info => {
            console.log('from sync ok', info);
            this.merge(() => {
                db.sync(url, opts)
                    .on('complete', info1 => {
                        console.log('sync complete!', info1);
                        callback('complete');
                    }).on('error', err => {
                        console.error(err);
                        callback('error');
                    });
            })
        }).on('error', callback);
    }

    merge(callback) {
        // pull, merge, push, purge
        const diff_db = new PouchDB('diff_tabs');
        const db = new PouchDB('tabs');
        diff_db.allDocs({
            include_docs: true
        }).then(local_docs => {
            var diff = {};
            var bulkdocs = [];
            var new_push_docs = [];
            if (local_docs.total_rows > 0) {
                local_docs.rows.forEach(e => {
                    bulkdocs.push({ id: e.doc._id });
                    diff[[e.id]] = e.doc.value;
                    diff_db.remove(e.doc)
                        .then(res => console.log('remove doc!', res))
                        .catch(err => console.err('remove doc!', err))
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
                                        console.log('update classification', odoc.url, '>', odoc.category );
                                    }

                                    if (odoc.summaryTime != ddoc.summaryTime) {
                                        odoc.summaryTime += Math.abs(odoc.summaryTime - ddoc.summaryTime);
                                        ddoc.days.forEach((day, index) => {
                                            if (odoc.days[index]) {
                                                ['counter', 'dataUsage', 'summary'].forEach(field => {
                                                    var num1 = Number.isInteger(day[field]) ? day[field] : 0;
                                                    var num2 = Number.isInteger(odoc.days[index][field]) ? odoc.days[index][field] : 0;
                                                    odoc.days[index][field] += Math.abs(num1 - num2);
                                                });
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
                                    db.bulkDocs(new_push_docs)
                                        .then(bulk => {
                                            // console.log('bulk update completed!', bulk);
                                            callback();
                                            // diff_db.destroy()
                                            //     .then(response => {
                                            //         console.log('clear diff_db completed!', response);
                                            //         // chrome.extension.getBackgroundPage().reload();
                                            //         callback();
                                            //     }).catch(err => {
                                            //         callback();
                                            //         console.err('diff_db error', err);
                                            //     });
                                        }).catch(err => {
                                            callback();
                                            // console.err('bulk update error', err);
                                        });
                                } else {
                                    // console.log('no update..');
                                    callback();
                                }
                                return;
                            }
                        })
                    })
                    .catch(err => console.error(err));
            } else {
                console.log('diff nothing..');
                callback();
            }
        });
    }

}

// tabs