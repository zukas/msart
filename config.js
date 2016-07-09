
var cfg = {
	ssl : false,
	privateKey: "",
	publicKey: "",
	chainKey: "",
	logging: false,
	domain: "https://example.com",
	ses : {
		accessKeyId : "",
		secretAccessKey: "",
		region: "eu-west-1",
		rateLimit: 1
	},
	mailSender : "",
	paypal: {
		mode: "sandbox", //sandbox or live
		client_id: "",
		client_secret: ""
	},
	session: {
		secure: false,
		secret: '4f6faqwec8g5x3v4v4sm1'
	}
}

exports = module.exports = function () {
	return cfg;
}