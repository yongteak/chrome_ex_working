angular.module('app.controller.data', [])
    .controller('dataController', function ($scope,$log, $filter, pounch, pouchDB, storage, CONFIG, COLLECTIONS) {
        $scope.model = {
            collections: COLLECTIONS
        };
        $scope.run = {
            clear: () => {
                pounch.clear(CONFIG.STORAGE_TABS).then(res => {
                    $log.log('distory',res);
                    chrome.extension.getBackgroundPage().tabs = [];
                }).catch(_err => { });
                // chrome.storage.local.set({ 'tabs': null });
                // chrome.storage.local.remove('tabs', () => {
                //     $log.log('remove tabs');
                // });
                // chrome.storage.local.remove(Object.keys(COLLECTIONS), () => {
                //     $log.log('remove all');
                //     chrome.storage.local.clear(function () {
                //         $log.log('clear all');
                //         $log.log(chrome.runtime.lastError);
                //         chrome.extension.getBackgroundPage().tabs = [];
                //         chrome.extension.getBackgroundPage().loadAddDataFromStorage();
                //     })
                // })
            },
            backup: () => {
                var c = $scope.model.collections;
                // top과 bucket합
                var round = 1;
                for (var p in c) {
                    if (c[p].top) round++;
                }
                var result = {};
                for (var p in c) {
                    var variable = p;
                    (function (x) {
                        if (!c[x].hidden) {
                            if (c[x].top) {
                                pounch.alldocs(CONFIG.STORAGE_TABS).then(items => {
                                    result[CONFIG.STORAGE_TABS] = items.rows.reduce((a, b) => {
                                        a.push(b.doc.value);
                                        return a;
                                    }, []);
                                    if (Object.keys(result).length == round) {
                                        createFile(JSON.stringify(result), "application/json");
                                    }
                                }).catch(err => {
                                    $log.error(err);
                                });
                            } else {
                                pounch.getdoc(CONFIG.BUCKET, p).then(items => {
                                    result[CONFIG.BUCKET] = {key:p,value:items.value};
                                    if (Object.keys(result).length == round) {
                                        createFile(JSON.stringify(result), "application/json");
                                    }
                                }).catch(_err => {})
                            }
                        };
                    })(variable);
                }

                function createFile(data, type, fileName) {
                    fileName = fileName || 'WEB-SCREEN-TIME-BACKUP_' + moment().format('YYYY-MM-DD');
                    var file = new Blob([data], { type: type });
                    var downloadLink;
                    downloadLink = document.createElement("a");
                    downloadLink.download = fileName;
                    downloadLink.href = window.URL.createObjectURL(file);
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                }
            },
            restore_from_file: (e) => {
                let file = e.target.files[0];
                if (file.type === "application/json") {
                    var reader = new FileReader();
                    reader.readAsText(file, 'UTF-8');
                    reader.onload = readerEvent => {
                        let content = readerEvent.target.result;
                        let collections = JSON.parse(content);
                        for (var p in collections) {
                            storage.saveValue(p, collections[p]);
                            if (p == 'tabs') {
                                chrome.extension.getBackgroundPage().tabs = collections[p];
                            }
                        }
                    }
                } else {
                    // error
                }
            },
            restore: () => {
                document.getElementById('file-input-backup').click();
            },
            getCollections: () => {
                var c = $scope.model.collections;
                for (var p in c) {
                    var variable = p;
                    (function (x) {
                        if (!c[x].hidden) {
                            if (c[x].top) {
                                pounch.alldocs(CONFIG.STORAGE_TABS).then(items => {
                                    c[x].rows = items.rows.length;
                                    c[x].size = JSON.stringify(items.rows).length;
                                }).catch(err => {
                                    c[x].rows = 0;
                                    c[x].size = 0;
                                });
                            } else {
                                pounch.getdoc(CONFIG.BUCKET, p).then(items => {
                                    c[x].rows = items.value.length == undefined ? 1 : items.value.length;
                                    c[x].size = JSON.stringify(items).length
                                }).catch(err => {
                                    c[x].rows = 0;
                                    c[x].size = 0;
                                })
                            }
                        };
                    })(variable);
                }
            }
        }
        $scope.run.getCollections();
    })