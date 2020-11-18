function Alarm() {
	var _this = this;

	_this.env = {};

	/**
	 * 새로운 알람 정보 확인하기
	 */
	_this.geAlarm = function() {
		$.ajax({
			url: API_HOST+'/alarm',
			type: 'GET',
			success: function(result) {
				// 새로운 알람이 있는지 체크
				if(result.alarmYn){
					$('#newAlramInfo').addClass("alram");
				} else {
					$('#newAlramInfo').removeClass("alram");
				}
				// 새로운 메세지가 있는지 체크
				if(result.messageYn){
					$('#newMessageInfo').addClass("alram");
				} else {
					$('#newMessageInfo').removeClass("alram");
				}
			},
			error: function(result) {
				console.log("Comment Alarm Error");
			}
		});
	};

	// 알람 보내기 -> 이제 사용하지 않는다.
	_this.commentAlarmSend = function(type, targetUserId, comment, commentFocus) {
		var sessionUserId = app.env.loginId;
		comment = util.stripTags(comment);
		comment = util.stripTagsForComment(comment);
		comment = util.replaceAll(comment, '@님', '');
		comment = util.cutByte(comment, 100);
		var params = {
			boardCd : $('#boardCd').val(),
			boardSn : $('#boardSn').val(),
			userId : targetUserId,
			title : comment,
			divFocus : commentFocus
		}
		// 작성자와 댓글을 쓴 사람이 같으면 알림을 보내지 않는다.
		if(targetUserId != sessionUserId) {
			var url = API_HOST + '/alarm/send';
			$.ajax({
				url: url,
				type: 'POST',
				data: params,
				success: function(result) {
					console.log(result);
				},
				error: function(request) {
					console.log(request);
				}
			});
		};
	}

	_this.init = function() {
		if (IS_LOGIN) {
			_this.geAlarm();
		}
	}();
};
var alarm = new Alarm();