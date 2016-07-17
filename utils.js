"use strict";

var util 		= require('util'),
	path 		= require('path'),
	ObjectID 	= require('mongodb').ObjectID,
	logging 	= false;

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
	logging = true;
}

global.log = function () {
	if(logging) {
		util.log(util.inspect(arguments, { showHidden: false, depth: null, colors : true }));
	}
};

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