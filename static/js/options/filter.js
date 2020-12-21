angular.module('app.filter', [])

    .filter('isEmpty', function () {
        return function (val) {
            return (val == undefined || val.length === 0 || !val.trim());
        };
    })

    .filter('formatDate', function () {
        return function () {
            var date = new Date();
            var year = date.getFullYear();
            var month = (1 + date.getMonth());
            month = month >= 10 ? month : '0' + month;
            var day = date.getDate();
            day = day >= 10 ? day : '0' + day;
            return parseInt(year + '' + month + '' + day);
        };
    })

    .filter('epochTimeToFormat', function () {
        return function (epochTime) {
            return moment(epochTime).format('YYYY-MM-DD HH:mm:ss');
        }
    })

    // 'YYYY-MM-DD HH:mm:ss'
    .filter('secondToFormat', function () {
        return function (sec,format) {
            format = format || 'DD일hh시간mm분ss초';
            // return moment(time).format(format);
            // moment.utc(sec*1000).format('DD일hh시간mm분ss초')
            // console.log(sec,format);
            return moment.utc(sec*1000).format(format);
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
    .filter('hmsToSeconds', function () {
        return function (s) {
            // console.log(s);
            var format = "HH:mm:ss";
            var str = s.split("-");
            var ah = parseInt(str[0].split(':')[0]);
            var bh = parseInt(str[1].split(':')[0]);
            var diff = bh - ah;
            var acc = [];
            if (diff == 0) {
                acc.push({
                    'hour': ah, 'value':
                        moment.duration(moment(str[1], format).diff(moment(str[0], format))).asSeconds()
                });
            } else if (diff == 1) {
                acc.push({
                    'hour': ah, 'value':
                        moment.duration(moment(ah + ":59:59", format).diff(moment(str[0], format))).asSeconds()
                });
                acc.push({
                    'hour': bh, 'value':
                        moment.duration(moment(str[1], format).diff(moment(bh + "00:00", format))).asSeconds()
                });
            } else if (diff >= 2) {
                var range = Array(diff - 1).fill(0).map((e, i) => i + (ah + 1));
                acc.push({
                    'hour': ah, 'value':
                        moment.duration(moment(ah + ":59:59", format).diff(moment(str[0], format))).asSeconds()
                });
                range.forEach(h => {
                    acc.push({ 'hour': h, 'value': 3600 });
                });
                acc.push({
                    'hour': bh, 'value':
                        moment.duration(moment(str[1], format).diff(moment(bh + "00:00", format))).asSeconds()
                });
            }
            return acc;
        }
    })


    .filter('num_comma', function () {
        return function (num) {
            if (num) {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            } else {
                return num;
            }
        };
    })

    .filter('percentage', function () {
        return function (val, total) {
            return ((val / total) * 100).toFixed(1);// + ' %';
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
    .filter('category_to_name', function () {
        return function (n) {
            n = n.toLowerCase();
            var kv = {};
            console.log(n);
            kv['wait_analytic'] = '기타';
            kv['news_and_media'] = '뉴스미디어';
            kv['finance'] = '금융';
            kv['games'] = '게임';
            kv['computers_electronics_and_technology'] = 'IT기술';
            kv['search_engines'] = '검색엔진';
            kv['arts_and_entertainment'] = '엔터테이먼트';
            kv['animation_and_comics'] = '코믹스';
            kv['books_and_literature'] = '문학';
            kv['humor'] = '유머';
            kv['music'] = '음악';
            kv['performing_arts'] = '공연예술';
            kv['tv_movies_and_streaming'] = '스트리밍';
            kv['visual_arts_and_design'] = '시각예술';
            kv['business_and_consumer_services'] = '비즈니스 및 소비자 서비스';
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
            kv['gambling'] = '겜플링';
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