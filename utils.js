"use strict";

var util 		= require('util'),
	path 		= require('path'),
	ObjectID 	= require('mongodb').ObjectID,
	winston 	= require('winston'),
	logger 		= new (winston.Logger)({
				    transports: [
						new (winston.transports.File)({ filename: __dirname + '/msart.log', level: 'error' })
					    ]
					});



global.async = function () {
	if(arguments.length === 0 && typeof arguments[0] !== "function") throw "Bad argument to async";
	var _args = [],
		i;
	for(i in arguments) _args.push(arguments[i]);
	process.nextTick(function () {
		var func = _args.splice(0, 1)[0];
		func.apply(this, _args);
	});
};

global.makePath = function () {
	var _args = [process.cwd()],
		i;
	for(i in arguments) _args.push(arguments[i]);

	return path.join.apply(this, _args);
};

global.enableLog = function () {
	logger.transports.file.level = 'info';
}

global.logger = {
	log: logger.info,
	error: logger.error
}

global.prof = function (name, func) {
	var start = process.hrtime();
	func(function(){
		var diff = process.hrtime(start);
		logger.info("Task profile: %s spent %d(ms)", name, (diff[0] * 1e3 + diff[1] / 1e6));
	});
}

String.prototype.normalize = function () {
	var str = this.valueOf().toLowerCase();
	str = str.charAt(0).toUpperCase().concat(str.substring(1));
	return str;
}


global.String.prototype.toObjectID = function() {
	if(/[\w\d]{24}/.test(this.valueOf())) {
		return new ObjectID(this.valueOf());
	} else {
		return null;
	}
};