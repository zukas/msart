var check 		= require('./validate'),
	config 		= require("../config"),
	mailer		= require('../email/email');

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
				regex: /^(.|[\n\r]){5,1000}$/
			},
			data: {
				type: check.TYPE.OBJECT,
				optional: true,
				properties: {
					id : {
						type: check.TYPE.VALUE,
						class: "String",
						regex: "$ObjectID"
					},
					preview : {
						type: check.TYPE.VALUE,
						class: "String",
						regex: "$ObjectID"
					},
					title : {
						type: check.TYPE.VALUE,
						class: "String"
					},
					component : {
						type: check.TYPE.VALUE,
						class: "String",
						optional: true
					}
				}
			}

		}
	});

	if(res.status) {
		if(res.data.data) {
			mailer.sendMail("info", res.data, config.master, callback);
		} else {
			mailer.sendMail("contact", res.data, config.master	, callback);
		}
	} else {
		callback(res);
	}

}