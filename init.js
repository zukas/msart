
require("./utils")

var db = require("./db"),
	hasher = require('password-hash');

if(process.argv.length != 4) {
	console.log("usage init.js [username] [password]");
} else {
	db.start({
	name: "msart",
	collections: [
		"users",
		"images",
		"about",
		"shop",
		"category",
		"orders",
		"gallery",
		"history",
		"access"
	]
	}, function () {
		db.db.users.insert({_id : process.argv[2], password: hasher.generate(process.argv[3])}, function (err) {
			if(err) {
				console.log(err);
			} else {
				console.log("user " + process.argv[2] + "successfully created");
			}
			process.exit(0);
		})
	});
}