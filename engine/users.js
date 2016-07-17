"use strict";

var db = require("../db"),
	hasher = require('password-hash');

exports.login = function (user, callback) {
	db.db.users.findOne({ _id : user.username }, { password : 1 }, function (err, res) {
		if(err || !res) {
			callback({status : false});
		} else {
			callback({ status : hasher.verify(user.password, res.password) });
		}
	});
}