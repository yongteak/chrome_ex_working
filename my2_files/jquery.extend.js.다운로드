/**
 * 글자수 자르기
 * 사용법 : $(selector).maxlength(80)
 */
$.fn.extend({
	maxLength: function(max) {
		return this.each(function(){
			$(this).on('keyup keypress keydown', function(e){
				var ls_str = $(this).val(); 
                var li_str_len = ls_str.length; //전체길이
                //변수초기화
                var li_max = max; // 제한할 글자수 크기
                var i = 0;
                var li_byte = 0; // 한글일경우 2, 그외글자는 1을 더함
                var li_len = 0; // substring하기 위해 사용
                var ls_one_char = ''; // 한글자씩 검사
                var ls_str2 = ''; // 글자수를 초과하면 제한한 글자전까지만 보여줌.
                
                for (i=0; i<li_str_len; i++) {
					ls_one_char = ls_str.charAt(i);   //한글자 추출
					if (escape(ls_one_char).length > 4) { 
						li_byte += 2; //한글이면 2를 더한다
					} else {
						li_byte++; //한글아니면 1을 다한다
                  	}
                    
                  	if(li_byte <= li_max){
                    	li_len = i + 1;
                  	}
                }
                
                if (li_byte > li_max) {
                  	//alert!( li_max + "글자를 초과 입력할수 업습니다.");
                  	ls_str2 = ls_str.substr(0, li_len);
                  	$(this).val(ls_str2);
                  	e.preventDefault();
                  	return false;
                }
			});
		});
	}
});