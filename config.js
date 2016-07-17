
var cfg = {
	ssl : false,
	privateKey: "",
	publicKey: "",
	chainKey: "",
	logging: false,
	domain: "",
	master: "",
	ses : {
		accessKeyId : "",
		secretAccessKey: "",
		region: "",
		rateLimit: 1
	},
	mailSender : "",
	paypal: {
		mode: "", //sandbox or live
		client_id: "",
		client_secret: ""
	},
	session: {
		secure: false	,
		secret: ''
	}
}

exports = module.exports = function () {
	return cfg;
}