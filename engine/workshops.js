"use strict";

var db 			= require("../db"),
	ObjectID 	= require('mongodb').ObjectID,
	check 		= require('./validate');



exports.perform_cleanup = function () {

	db.db.workshops.find({ timetable : { $not : { $size: 0 } } }, { _id : 1, timetable: 1})
		.toArray(function (err, res) {
		if(err) {
			console.log(err);
		} else {
			var 	l 	= res.length,
					l2 	= 0,
					i 	= 0,
					j 	= 0,
					n 	= new Date().valueOf(),
					t 	= 0,
					op 	= db.db.workshops.initializeUnorderedBulkOp();

			for(; i < l; i++) {
				var item 	= res[i],
					rem 	= [];
				l2 = item.timetable.length;
				for(j = 0; j < l2; j++) {
					if(item.timetable[j] < n) {
						rem[rem.length] = item.timetable[j];
					}
				}
				if(rem.length > 0) {
					op.find({ _id : item._id}).update({ $pull: { timetable: { $in: rem } } });
					t++;
				}
			}
			if(t > 0) {
				op.execute();
			}
		}
	});
} 

exports.list = function (data, callback) {

	db.db.workshops.find({ timetable : { $not : { $size: 0 } } }, { _id : 1, title: 1, price: 1, preview: 1 })
		.sort({ "timetable.0" : 1 })
		.toArray(function (err, items) {

			if(err) {
				callback({status : false, error: err});
			} else {
				db.db.workshops.find({ timetable : { $size: 0 } }, 
					{ _id : 1, title: 1, price: 1, preview: 1 })
					.toArray(function (err2, items2) {
						if(err2) {
							callback({status : false, error: err2});
						} else {
							var all = items.concat(items2);
							callback({status : true, workshops: all });
						}

					});
			}
		});
}


exports.save = function (data, callback) {
	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			id : {
				type : check.TYPE.VALUE,
				class : "String",
				regex : "$ObjectID",
				optional : true
			},
			title : {
				type : check.TYPE.VALUE,
				class : "String",
				mod: "$firstCap"
			},
			descrition : {
				type : check.TYPE.VALUE,
				class : "String"
			},
			timetable : {
				type : check.TYPE.ARRAY,
				members : {
					type : check.TYPE.VALUE,
					class : "Number",
					convert : true
				},
				minLength : 0
			},
			location : {
				type : check.TYPE.VALUE,
				class : "String"
			},
			images : {
				type : check.TYPE.ARRAY,
				members : {
					type : check.TYPE.VALUE,
					class : "String",
					regex : "$ObjectID"
				},
				minLength : 1
			},
			price: {
				type : check.TYPE.OBJECT,
				optional: true,
				properties : {
					duration : {
						type : check.TYPE.VALUE,
						class : "Number",
						convert : true
					},
					price: {
						type : check.TYPE.VALUE,
						class : "Number",
						convert : true
					}
				}
			}
		}
	});

	if(res.status) {
		data = res.data;
		var _id = null;
		if(data.id) {
			_id = data.id.toObjectID();
			delete data.id;
		} else {
			_id = new ObjectID();
			data._id = _id;
		}
		data.preview = data.images[0];
		data.timetable.sort();
		db.db.workshops.update({ _id : _id }, 
			{ 
				$set : data,
				$setOnInsert : { created : data.updated }
			}, 
			{ upsert : true }, function (err, res) {
			if(err) {
				callback({status: false, error: err});
			} else {
				callback({status : true, _id : _id });
			}
		});
	} else {
		callback(res);
	}
}


exports.load = function (data, callback) {
		var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			id: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID"
			}
		}
	});

	

	if(res.status) {
		db.db.workshops.findOne({ _id : data.id.toObjectID() }, { 
			title: 1, 
			price: 1, 
			timetable : 1,
			descrition: 1, 
			location: 1,
			images: 1, 
		}, function (err, res) {
			if(err) {
				callback({status : false, error : err});
			} else {
				callback({status : true, workshop : res});
			}
		});
	} else {
		callback(res);
	}
}

exports.delete = function (data, callback) {

	var res = check.run(data,
	{
		type : check.TYPE.OBJECT,
		properties: {
			id : {
				type : check.TYPE.VALUE,
				class : "String",
				regex : "$ObjectID"
			}
		}
	});


	if(res.status) {
		data = res.data;
		db.db.workshops.remove({ _id : data.id.toObjectID() }, function (err, res) {
			if(err) {
				callback({status : false, error : err});
			} else {
				callback({status : true});
			}
		});
	} else {
		callback(res);
	}
}