var mail = require("./email/email");


mail.createFile("purchase", { 
	_id: "576e7565fb359054ae59d79b",
	shipping: { 
		"company" : null,
		"forename" : "Any",
		"surname" : "Loot",
		"email" : "anyloot@yahoo.com",
		"phone" : "6448231795",
		"address" : "Torra 95",
		"address2" : null,
		"city" : "Lodz",
		"county" : "dolnośląskie",
		"postCode" : "07-578",
		"country" : "Polska"
	},
	billing: {
		"company" : null,
		"vat" : null,
		"address" : "Torra 95",
		"address2" : null,
		"city" : "Lodz",
		"county" : "dolnośląskie",
		"postCode" : "07-578",
		"country" : "Polska",
		"paymentType" : 0
	},
	payment: {
		type: "paypal"
	},
	items: [ { title: "Some item", quantity: 1, price: 185, shipping: 30 },
			{ title: "Other great item", quantity: 1, price: 275, shipping: 30 } ],
	price: 500
}, function (res) {
	console.log(res);
	process.exit(0);
});