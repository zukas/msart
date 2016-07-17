"use strict";

var db 			= require("../db"),
	ObjectID 	= require('mongodb').ObjectID,
	check 		= require('./validate');


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
			log(res);
			if(res.insertedIds && res.insertedIds.length == 1) {
				callback({status : true, id: res.insertedIds[0]});
			} else if(res.ops && res.ops.length == 1) {
				callback({status : true, id: res.ops[0]._id});
			} else {
				callback({status: false, error: "Unknown"});
			}
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

exports.swap_gallery = function (data, callback) {
	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			one: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID"
			},
			two: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID"
			}
		}
	});

	if(res.status) {

		data = {
			one: res.data.one.toObjectID(),
			two: res.data.two.toObjectID()
		};

		db.db.gallery.find({ _id : { $in : [ data.one, data.two ] }}, { created : 1 }).toArray(function (err, res) {
			if(err) {
				callback({status: false, error : err});
			} else {

				var bulk = db.db.gallery.initializeUnorderedBulkOp();
				bulk.find({ _id : res[0]._id}).updateOne({ $set: { created : res[1].created }});
				bulk.find({ _id : res[1]._id}).updateOne({ $set: { created : res[0].created }});
				bulk.execute(function (err2, res2) {
					if(err2) {
						callback({status: false, error : err2});
					} else {
						callback({status : true});
					}
				})
			}
		});
		
	} else {
		callback(res);
	}
}