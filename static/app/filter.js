angular.module('app.filter', [])

    .filter('', function () {
        return function (key, value) {
            var doc = {};
            doc['_id'] = key;
            doc['value'] = value;
            return doc;
        };
    })

    .filter('prepareDoc', function () {
        return function (key, value) {
            var doc = {};
            doc['_id'] = key;
            doc['value'] = value;
            return doc;
        };
    })

    .filter('isEmpty', function () {
        return function (val) {
            return (val == undefined || val == null || val.length === 0);// || !val.trim());
        };
    })

    .filter('formatDate', function () {
        return function (date, format) {
            date = date || new Date();
            format = format || 'YYYYMMDD';
            return format == 'YYYYMMDD' ? parseInt(moment('' + date).format(format))
                : moment('' + date).format(format);
        };
    })

    .filter('epoch', function () {
        return function () {
            return moment().valueOf();
        }
    })

    .filter('epochTimeToFormat', function () {
        return function (epochTime) {
            return moment(epochTime).format('YYYY-MM-DD HH:mm:ss');
        }
    })


    .filter('fromDateFormat', function () {
        return function (date,from,format) {
            return moment(date,from).format(format);
            // return moment('2021011405', 'YYYYMMDDhh').format('YYYYMMDD');
        }
    })

    // 'YYYY-MM-DD HH:mm:ss'
    .filter('secondToFormat', function () {
        return function (sec, format) {
            // format = format || 'H시간mm분ss'//'DD일hh시간mm분ss초';
            format = (sec < 60) ? 'ss초' : (sec < 60 * 60) ? 'mm분ss초' : 'H시간mm분';
            return moment().startOf('day').seconds(sec).format(format);
            // moment().startOf('day').seconds(sec).format(format)
            // return moment.utc(sec * 1000).format(format);
        }
    })

    .filter('dayFormatType', function () {
        return function (day, type) {
            moment.locale(window.navigator.language.split('-')[0]);
            return moment(day + '').format('llll').split(' ').filter((_, idx) => { return idx < type }).join(' ');
        }
    })



    .filter('convertSummaryTimeToString', function () {
        return function (summaryTime) {
            var days = Math.floor(summaryTime / 3600 / 24);
            var totalHours = summaryTime % (3600 * 24);
            var hours = Math.floor(totalHours / 3600);
            var totalSeconds = summaryTime % 3600;
            var mins = Math.floor(totalSeconds / 60);
            var seconds = totalSeconds % 60;

            hours = zeroAppend(hours);
            mins = zeroAppend(mins);
            seconds = zeroAppend(seconds);

            if (days > 0)
                return days + '일 ' + hours + '시간 ' + mins + '분' + seconds + '초';
            else return hours + '시간 ' + mins + '분 ' + seconds + '초';
        }
    })

    .filter('moneyFormat', function () {
        return function (number) {
            var SI_SYMBOL = ["", "k", "M", "B", "T", "P", "E"];
            var tier = Math.log10(number) / 3 | 0;
            if (tier == 0) return number;
            var scale = Math.pow(10, tier * 3);
            var scaled = number / scale;
            return scaled.toFixed(1) + SI_SYMBOL[tier];
        };
    })

    .filter('dataSizeToUnit', function () {
        return function (num) {
            if (num >= 1000000000) {
                return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
            }
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
            }
            return num + 'Byte';
        };
    })

    .filter('lengthInUtf8Bytes', function () {
        // JSON.stringify({
        return function (str) {
            const m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0)
        }
    })
    // anguarjs hashkey 데이터 제거
    .filter('clean', function () {
        return function (item) {
            return JSON.parse(angular.toJson(item));
        }
    })

    .filter('hhmmStrToNumber', function () {
        return function (str) {
            return parseInt(str.split(":").join(''));
        }
    })



    // https://stackoverflow.com/questions/26580509/calculate-time-difference-between-two-date-in-hhmmss-javascript
    // "13:47:46-13:48:45"
    // "13:56:37-20:57:2"
    // 13:56:37-14:57:2"
    // 0:59:3-1:1:47
    // 3:59:3-4:1:47
    .filter('hmsToSeconds', function () {
        return function (s) {
            var format = "HH:mm:ss";
            var str = s.split("-");
            var atime = str[0].split(':').map(e => e.padStart(2, 0)).join(':');
            var btime = str[1].split(':').map(e => e.padStart(2, 0)).join(':');
            var ah = atime.split(':')[0];
            var bh = btime.split(':')[0];
            var diff = bh - ah;
            var acc = [];
            if (diff == 0) {
                acc.push({
                    'hour': parseInt(ah), 'value':
                        moment.duration(moment(btime, format).diff(moment(atime, format))).asSeconds()
                });
            } else if (diff == 1) {
                acc.push({
                    'hour': parseInt(ah), 'value':
                        moment.duration(moment(ah + ":59:59", format).diff(moment(atime, format))).asSeconds()
                });
                acc.push({
                    'hour': parseInt(bh), 'value':
                        moment.duration(moment(btime, format).diff(moment(bh + "00:00", format))).asSeconds()
                });
            } else if (diff >= 2) {
                var range = Array(diff - 1).fill(0).map((e, i) => i + (parseInt(ah) + 1));
                acc.push({
                    'hour': parseInt(ah), 'value':
                        moment.duration(moment(ah + ":59:59", format).diff(moment(atime, format))).asSeconds()
                });
                range.forEach(h => {
                    acc.push({ 'hour': h, 'value': 3600 });
                });
                acc.push({
                    'hour': parseInt(bh), 'value':
                        moment.duration(moment(btime, format).diff(moment(bh + "00:00", format))).asSeconds()
                });
            }
            // acc.forEach(e => e ? (e.value < 0 ? console.log(s,e.value):''):'');
            return acc;
        }
    })
    .filter("cut", function () {
        return function (value, wordwise, max, tail) {
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    //Also remove . and , so its gives a cleaner result.
                    if (value.charAt(lastspace - 1) == '.' || value.charAt(lastspace - 1) == ',') {
                        lastspace = lastspace - 1;
                    }
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' …');
        };
    })
    .filter('nl2br', function ($sce) {
        return function (msg, is_xhtml) {
            var is_xhtml = is_xhtml || true;
            var breakTag = (is_xhtml) ? '<br />' : '<br>';
            var msg = (msg + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
            return $sce.trustAsHtml(msg);
        }
    })
    .filter('num_comma', function () {
        return function (num, default_val) {
            default_val = default_val || 0;
            if (num) {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            } else {
                return default_val;
            }
        };
    })

    .filter('percentage', function () {
        return function (val, total) {
            return ((val / total) * 100).toFixed(1);// + ' %';
        }
    })

    .filter('zeroAppend', () => {
        return time => {
            if (time > 0 && time < 10)
                return '0' + time;
            else return time;
        }
    })

    .filter('yyyymmdd_to_format_kr', function () {
        return function (yyyymmdd) {
            if (!yyyymmdd) return '';
            var match;
            if (yyyymmdd.toString().length == 12) {
                match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
                return match[1] + '년 ' + match[2] + '월 ' + match[3] + '일 ' + match[4] + '시' + match[5] + '분'
            } else if (yyyymmdd.toString().length == 10) {
                match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})(\d{2})/);
                return match[1] + '년 ' + match[2] + '월 ' + match[3] + '일 ' + match[4] + '시'
            } else if (yyyymmdd.toString().length == 8) {
                match = yyyymmdd.toString().match(/(\d{4})(\d{2})(\d{2})/);
                return match[1] + '년 ' + match[2] + '월 ' + match[3] + '일'
            } else if (yyyymmdd.toString().length == 6) {
                match = yyyymmdd.toString().match(/(\d{4})(\d{2})/);
                return match[1] + '년 ' + match[2] + '월'
            } else if (yyyymmdd.toString().length == 4) {
                match = yyyymmdd.toString().match(/(\d{4})/);
                return match[1] + '년';
            }
        };
    })
    .filter('md5', function () {
        return function (inputString) {
            var hc = "0123456789abcdef";
            function rh(n) { var j, s = ""; for (j = 0; j <= 3; j++) s += hc.charAt((n >> (j * 8 + 4)) & 0x0F) + hc.charAt((n >> (j * 8)) & 0x0F); return s; }
            function ad(x, y) { var l = (x & 0xFFFF) + (y & 0xFFFF); var m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF); }
            function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
            function cm(q, a, b, x, s, t) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b); }
            function ff(a, b, c, d, x, s, t) { return cm((b & c) | ((~b) & d), a, b, x, s, t); }
            function gg(a, b, c, d, x, s, t) { return cm((b & d) | (c & (~d)), a, b, x, s, t); }
            function hh(a, b, c, d, x, s, t) { return cm(b ^ c ^ d, a, b, x, s, t); }
            function ii(a, b, c, d, x, s, t) { return cm(c ^ (b | (~d)), a, b, x, s, t); }
            function sb(x) {
                var i; var nblk = ((x.length + 8) >> 6) + 1; var blks = new Array(nblk * 16); for (i = 0; i < nblk * 16; i++) blks[i] = 0;
                for (i = 0; i < x.length; i++) blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
                blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[nblk * 16 - 2] = x.length * 8; return blks;
            }
            var i, x = sb(inputString), a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, olda, oldb, oldc, oldd;
            for (i = 0; i < x.length; i += 16) {
                olda = a; oldb = b; oldc = c; oldd = d;
                a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819);
                b = ff(b, c, d, a, x[i + 3], 22, -1044525330); a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
                c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983); a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
                d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
                a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
                b = ff(b, c, d, a, x[i + 15], 22, 1236535329); a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
                c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302); a = gg(a, b, c, d, x[i + 5], 5, -701558691);
                d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
                a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961);
                b = gg(b, c, d, a, x[i + 8], 20, 1163531501); a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784);
                c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734); a = hh(a, b, c, d, x[i + 5], 4, -378558);
                d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
                a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632);
                b = hh(b, c, d, a, x[i + 10], 23, -1094730640); a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222);
                c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189); a = hh(a, b, c, d, x[i + 9], 4, -640364487);
                d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
                a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
                b = ii(b, c, d, a, x[i + 5], 21, -57434055); a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
                c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799); a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
                d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
                a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259);
                b = ii(b, c, d, a, x[i + 9], 21, -343485551); a = ad(a, olda); b = ad(b, oldb); c = ad(c, oldc); d = ad(d, oldd);
            }
            return rh(a) + rh(b) + rh(c) + rh(d);
        }
    })
    .filter('category_code_to_name', function ($rootScope) {
        return function (code, lang) {
            lang = lang || 'ko';
            code = code || '000';
            return $rootScope['category_kv'][code][lang];
        };
    })
    .filter('category_code_to_color', function ($rootScope) {
        return function (code) {
            code = code || '000';
            return $rootScope['category_kv'][code]['color'];
        };
    })
    .filter('country_to_name', function ($rootScope) {
        return function (country_code, field) {
            field = field == 'code' ? 'alpha-3' : 'name';
            if (!$rootScope.hasOwnProperty('countries') || Object.keys($rootScope['countries']).length == 0) {
                return '-';
            } else {
                var find = $rootScope['countries']
                    .filter(a => { return a['country-code'] == country_code });
                // field = field || 'name'; //name, alpha-3
                return find.length > 0 ? find[0][field] : '-';
            }
        };
    })
    .filter('category_to_name', function () {
        return function (n) {
            if (n === undefined) return '-';
            n = n.toLowerCase();
            var kv = {};
            kv['wait_analytic'] = '기타';
            kv['news_and_media'] = '뉴스미디어';
            kv['finance'] = '금융';
            kv['games'] = '게임';
            kv['computers_electronics_and_technology'] = 'IT테크';
            kv['search_engines'] = '검색엔진';
            kv['arts_and_entertainment'] = '엔터테이먼트';
            kv['animation_and_comics'] = '코믹스';
            kv['books_and_literature'] = '문학';
            kv['humor'] = '유머';
            kv['music'] = '음악';
            kv['performing_arts'] = '공연예술';
            kv['tv_movies_and_streaming'] = '스트리밍';
            kv['visual_arts_and_design'] = '시각예술';
            kv['business_and_consumer_services'] = '고객 서비스';
            kv['business_services'] = '비지니스 서비스';
            kv['marketing_and_advertising'] = '마케팅및 광고';
            kv['online_marketing'] = '온라인 마케팅';
            kv['publishing_and_printing'] = '출판및 인쇄';
            kv['real_estate'] = '부동산';
            kv['relocation_and_household_moving'] = '가구 이사';
            kv['shipping_and_logistics'] = '배송및 물류';
            kv['textiles'] = '직물';
            kv['community_and_society'] = '커뮤니티';
            kv['decease'] = '질병';
            kv['faith_and_beliefs'] = '믿음과 신념';
            kv['holidays_and_seasonal_events'] = '시즌 이벤트';
            kv['lgbtq'] = 'LGBTQ';
            kv['philanthropy'] = '박애';
            kv['romance_and_relationships'] = '로멘스';
            kv['advertising_networks'] = '광고';
            kv['computer_hardware'] = '컴퓨터 하드웨어';
            kv['computer_security'] = '컴퓨터 보안';
            kv['consumer_electronics'] = '가전';
            kv['email'] = '이메일';
            kv['file_sharing_and_hosting'] = '파일 공유';
            kv['graphics_multimedia_and_web_design'] = '웹 디자인';
            kv['programming_and_developer_software'] = '프로그래밍';
            kv['social_networks_and_online_communities'] = '소셜네트워크';
            kv['telecommunications'] = '통신';
            kv['web_hosting_and_domain_names'] = '웹 호스팅';
            kv['e_commerce_and_shopping'] = '온라인 쇼핑';
            kv['auctions'] = '옥션';
            kv['classifieds'] = '분류';
            kv['coupons_and_rebates'] = '쿠폰';
            kv['marketplace'] = '마켓';
            kv['price_comparison'] = '가격비교';
            kv['tickets'] = '티켓';
            kv['accounting_and_auditing'] = '회계감사';
            kv['banking_credit_and_lending'] = '신용대출';
            kv['financial_planning_and_management'] = '재무관리';
            kv['insurance'] = '보험';
            kv['investing'] = '투자';
            kv['food_and_drink'] = '음식';
            kv['beverages'] = '음료수';
            kv['cooking_and_recipes'] = 'replace';
            kv['groceries'] = '잡화';
            kv['restaurants_and_delivery'] = '음식및 배달';
            kv['vegetarian_and_vegan'] = '채식주의';
            kv['gambling'] = '도박';
            kv['bingo'] = '빙고';
            kv['casinos'] = '카지노';
            kv['lottery'] = '로또';
            kv['poker'] = '포커';
            kv['sports_betting'] = '배팅';
            kv['board_and_card_games'] = '카드게임';
            kv['puzzles_and_brainteasers'] = '퍼즐게임';
            kv['roleplaying_games'] = '롤플레잉';
            kv['video_games_consoles_and_accessories'] = '콘솔게임';
            kv['health'] = '건강';
            kv['addictions'] = '중독';
            kv['alternative_and_natural_medicine'] = '대체의학';
            kv['biotechnology_and_pharmaceuticals'] = '제약';
            kv['childrens_health'] = '아이들건강';
            kv['dentist_and_dental_services'] = '치과 서비스';
            kv['developmental_and_physical_disabilities'] = '신체장애';
            kv['geriatric_and_aging_care'] = '노화치료';
            kv['health_conditions_and_concerns'] = '건강상태';
            kv['medicine'] = '약';
            kv['mens_health'] = '남성건강';
            kv['mental_health'] = '정신건강';
            kv['nutrition_and_fitness'] = '피트니스';
            kv['nutrition_diets_and_fitness'] = '다이어트';
            kv['pharmacy'] = '조제';
            kv['public_health_and_safety'] = '공중보건';
            kv['womens_health'] = '영성건강';
            kv['heavy_industry_and_engineering'] = '중공업 엔지니어링';
            kv['aerospace_and_defense'] = '항공우주 방위';
            kv['agriculture'] = '농업';
            kv['architecture'] = '건축';
            kv['chemical_industry'] = '화학산업';
            kv['construction_and_maintenance'] = '건설유지보수';
            kv['energy_industry'] = '에너지산업';
            kv['metals_and_mining'] = '금속광업';
            kv['waste_water_and_environmental'] = '폐수 환경';
            kv['hobbies_and_leisure'] = '취미여가';
            kv['ancestry_and_genealogy'] = '조상 계보';
            kv['antiques_and_collectibles'] = '골동품';
            kv['camping_scouting_and_outdoors'] = '캠핑';
            kv['crafts'] = '공예';
            kv['models'] = '모델';
            kv['photography'] = '사진작가';
            kv['home_and_garden'] = '정원';
            kv['furniture'] = '가구';
            kv['gardening'] = '원예';
            kv['home_improvement_and_maintenance'] = '주택 유지관리';
            kv['interior_design'] = '인터리어';
            kv['jobs_and_career'] = '직업과 경력';
            kv['human_resources'] = '인적자원';
            kv['jobs_and_employment'] = '직업과 고용';
            kv['law_and_government'] = '법과 정부';
            kv['government'] = '정부';
            kv['immigration_and_visas'] = '이민 비자';
            kv['law_enforcement_and_protective_services'] = '법집행';
            kv['legal'] = '합법';
            kv['national_security'] = '국가안보';
            kv['lifestyle'] = '라이프스타일';
            kv['beauty_and_cosmetics'] = '뷰티';
            kv['childcare'] = '육아';
            kv['fashion_and_apparel'] = '패션의류';
            kv['gifts_and_flowers'] = '선물';
            kv['jewelry_and_luxury_products'] = '보석';
            kv['tobacco'] = '담배';
            kv['weddings'] = '결혼';
            kv['pets_and_animals'] = '애완동물';
            kv['animals'] = '동물';
            kv['birds'] = '새';
            kv['fish_and_aquaria'] = '물고기';
            kv['horses'] = '말';
            kv['pet_food_and_supplies'] = '사료용품';
            kv['pets'] = '애완동물';
            kv['reference_materials'] = '참고자료';
            kv['dictionaries_and_encyclopedias'] = '백과사전';
            kv['maps'] = '지도';
            kv['public_records_and_directories'] = '공공기록';
            kv['science_and_education'] = '과학교육';
            kv['astronomy'] = '천문학';
            kv['biology'] = '생물학';
            kv['business_training'] = '비지니스 교육';
            kv['chemistry'] = '화학';
            kv['colleges_and_universities'] = '대학교';
            kv['earth_sciences'] = '지구과학';
            kv['education'] = '교육';
            kv['environmental_science'] = '환경학';
            kv['grants_scholarships_and_financial_aid'] = '장학재정';
            kv['history'] = '역사';
            kv['libraries_and_museums'] = '도서관';
            kv['literature'] = '문학';
            kv['math'] = '수학';
            kv['philosophy'] = '철학';
            kv['physics'] = '물리학';
            kv['social_sciences'] = '사회과학';
            kv['universities_and_colleges'] = '대학';
            kv['weather'] = '날씨';
            kv['sports'] = '스포츠';
            kv['american_football'] = '미식축구';
            kv['baseball'] = '야구';
            kv['basketball'] = '농구';
            kv['boxing'] = '권투';
            kv['climbing'] = '등반';
            kv['cycling_and_biking'] = '사이클';
            kv['extreme_sports'] = '익스트림 스포츠';
            kv['fantasy_sports'] = '판타지 스포츠';
            kv['fishing'] = '낚시';
            kv['golf'] = '골프';
            kv['hunting_and_shooting'] = '사냥';
            kv['martial_arts'] = '무술';
            kv['rugby'] = '럭비';
            kv['running'] = '달리기';
            kv['soccer'] = '축구';
            kv['tennis'] = '테니스';
            kv['volleyball'] = '발리볼';
            kv['water_sports'] = '워터 스포츠';
            kv['winter_sports'] = '겨울 스포츠';
            kv['travel_and_tourism'] = '여행';
            kv['accommodation_and_hotels'] = '숙박및 호텔';
            kv['air_travel'] = '비행기여행';
            kv['car_rentals'] = '차랑렌트';
            kv['ground_transportation'] = '지상 교통수단';
            kv['tourist_attractions'] = '관광명소';
            kv['transportation_and_excursions'] = '교통및 여행';
            kv['vehicles'] = '탈것';
            kv['automotive_industry'] = '자동차산업';
            kv['aviation'] = '비행';
            kv['boats'] = '보트';
            kv['makes_and_models'] = '제조사및 모델';
            kv['motorcycles'] = '모터사이클';
            kv['motorsports'] = '포터스포츠';
            kv['adult'] = '성인';
            return kv.hasOwnProperty(n) ? kv[n] : '기타';
        };
    });

function zeroAppend(time) {
    if (time < 10)
        return '0' + time;
    else return time;
}
