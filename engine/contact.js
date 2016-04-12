var check 		= require('./validate');

exports.send = function (data, callback) {
	var res = check.run(data, {
		type : check.TYPE.OBJECT,
		properties: {
			sessionID: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$sessionID"
			},
			name: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			email: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Email"
			},
			message: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: /^.{1,1000}$/
			}
		}
	});

	callback(res);
}