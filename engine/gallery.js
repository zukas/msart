var db = require("../db"),
	ObjectID = require('mongodb').ObjectID;


exports.load = function (callback) {
	db.db.gallery.find({}).sort({created : -1}).toArray(function (err, res) {
		if(err) {
			callback({status: false, error: err});
		} else {
			for(var i = 0; i < res.length; ++i) {
				res[i].id = res[i]._id;
				delete res[i]._id;
			}
			callback({status: true, result: res});
		}
	})
}

exports.save = function (data, callback) {
	log("save", data);
	var _id = null;
	if(typeof data.id === 'string' || data.id instanceof String) {
		_id = ObjectID(data.id);
	} else if(data.id instanceof ObjectID) {
		_id = data.id;
	} else {
		callback({status: false, error: "Unknown image id"});
		return;
	}
	log(_id);
	db.db.gallery.insert({ _id : _id, created : new Date() }, function (err, res) {
		if(err) {
			callback({status: false, error: err});
		} else {	
			callback({status : true, id: res[0]._id});
		}
	});
}

exports.delete = function (data, callback) {
	log(data);
	var _id = null;
	if(typeof data.id === 'string' || data.id instanceof String) {
		_id = ObjectID(data.id);
	} else if(data.id instanceof ObjectID) {
		_id = data.id;
	} else {
		callback({status: false, error: "Unknown image id"});
		return;
	}
	db.db.gallery.remove({_id : _id}, function (err) {
		if(err) {
			callback({status: false, error: err});
		} else {
			callback({status : true});
		}
	});
}