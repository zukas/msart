var db = require("../db"),
	ObjectID = require('mongodb').ObjectID,
	check 		= require('./validate');


exports.create_category = function (data, callback) {

	data.id = data.id ? ObjectID(data.id) : new ObjectID();
	if(data.title && data.title.length > 0) {

		db.db.category.update(
			{ _id : data.id }, 
			{ _id : data.id, title: data.title, norm: data.title.toLowerCase() }, 
			{ upsert : true }, 
			function (err, res) {
				if(err) {
					callback({status : false, error : err});
				} else {
					callback({status : true, id: data.id});
				}
			});
	} else {
		callback({status : false, error: "Missing title"});
	}
}

exports.delete_category = function (data, callback) {
	if(data.id) {
		data.id = ObjectID(data.id);
		db.db.shop.find({category : data.id}, { _id : 1 })
		.toArray(function (err, res) {
			if(err) {
				callback({status:false, error: err});
			} else if(res.length > 0) {
				callback({status:false, error: "Category is not empty"});
			} else {
				db.db.category.remove({_id : data.id }, function (err2) {
					if(err2) {
						callback({status: false, error : err2});
					} else {
						callback({status: true});
					}
				});
			}
		});
	} else {
		callback({status : false, error: "Missing id"});
	}
}

exports.list = function (data, callback) {

	db.db.category.find({},{ _id: 1, title: 1, norm: 1})
	.sort({norm : 1})
	.toArray(function (err, res) {
		if(err) {
			callback({status : false, error: err});
		} else {
			db.db.shop.find({}, { _id : 1, title: 1, price: 1, preview: 1, category : 1 })
			.sort({category : 1, created : -1})
			.toArray(function (err2, items) {
				if(err) {
					callback({status : false, error: err2});
				} else {
					var result = res;
					for(var i in result) {
						result[i].id = result[i]._id;
						delete result[i]._id;
						result[i].items = [];
					}

					for(var i in items) {
						items[i].id = items[i]._id;
						delete items[i]._id;
						for(var j in result) {
							if(result[j].id.equals(items[i].category)) {
								result[j].items.push(items[i]);
							}
						}
					}
					log(result);
					callback({status: true, items: result});
				}
			});
		}
	});
}

exports.save = function (data, callback) {

	var res = check.run(data,
	{
		type : check.TYPE.OBJECT,
		properties: {
			id : {
				type : check.TYPE.VALUE,
				class : "String",
				regex : "$ObjectID",
				optional : true
			},
			category : {
				type : check.TYPE.VALUE,
				class : "String",
				regex : "$ObjectID"
			},
			title : {
				type : check.TYPE.VALUE,
				class : "String"
			},
			descrition : {
				type : check.TYPE.VALUE,
				class : "String"
			},
			availability : {
				type : check.TYPE.VALUE,
				class : "Number",
				convert : true,
				value: "0|1"
			},
			action : {
				type : check.TYPE.VALUE,
				class : "Number",
				convert : true,
				value: "0|1|2"
			},
			type : {
				type : check.TYPE.VALUE,
				class : "Number",
				convert : true,
				value: "0|1"
			},
			images : {
				type : check.TYPE.ARRAY,
				members : {
					type: check.TYPE.VALUE,
					class : "String",
					regex : "$ObjectID"
				},
				minLength : 1
			},
			price: {
				type : check.TYPE.OBJECT,
				properties : {
					type : {
						type : check.TYPE.VALUE,
						class : "Number",
						convert : true,
						value : "0|1"
					},
					values: {
						type : check.TYPE.ARRAY,
						members : {
							type: check.TYPE.OBJECT,
							properties : {
								quantity: {
									type : check.TYPE.VALUE,
									class : "Number",
									convert : true
								},
								price: {
									type : check.TYPE.VALUE,
									class : "Number",
									convert : true
								},
								shipping: {
									type : check.TYPE.VALUE,
									class : "Number",
									convert : true
								}
							}
						},
						minLength : 1
					}
				}
			}

		}
	});
	log(data);
	log(res);
	if(res.status) {
		data = res.data;
		if(data.id) {
			data._id = data.id.toObjectID();
			delete data.id;
		} else {
			data._id = new ObjectID();
		}
		data.category = data.category.toObjectID();
		data.preview = data.images[0];
		data.updated = new Date();
		db.db.shop.update({ _id : data._id }, 
			{ 
				$set : data,
				$setOnInsert : { created : data.updated }
			}, 
			{ upsert : true }, function (err, res) {
			if(err) {
				callback({status: false, error: err});
			} else {
				callback({status : true, id : data._id});
			}
		});
	} else {
		callback(res);
	}
}

exports.load = function (data, callback) {
	if(data.id) {
		db.db.shop.findOne({ _id : ObjectID(data.id) }, { title: 1, type: 1, availability: 1, action: 1, price: 1, descrition: 1, images: 1 }, function (err, res) {
			if(err) {
				callback({status : false, error : err});
			} else {
				callback({status : true, item : res});
			}
		});
	} else {
		callback({status : false, error : "Missing id"});
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
		db.db.shop.remove({ _id : data.id.toObjectID() }, function (err, res) {
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

exports.access = function (data) {
	if(data.id && data.address) {
		data.id = ObjectID(data.id);
		var d = new Date();
		d.setHours(0, 0, 0, 0, 0);
		d = d.getTime();
		db.db.access.update(
			{ shop_id: data.id, address: data.address, date: d }, 
			{ shop_id: data.id, address: data.address, date: d }, 
			{ upsert: true }, 
			function () {}
		);
	}
}

exports.access_count = function (callback) {
	var d = new Date();
	d.setHours(0, 0, 0, 0, 0);

	var d1 = parseInt(d - new Date(86400000)),
		d3 = parseInt(d - new Date(86400000 * 3)),
		d7 = parseInt(d - new Date(86400000 * 7)),
		d28 = parseInt(d - new Date(86400000 * 28));

	db.db.access.aggregate([
		{ 
			$group: { 
				"_id" : "$shop_id", 
				"day_1" : { 
					$sum: { 
						$cond: [ { $gt: [ "$date", d1 ] }, 1, 0  ] 
					} 
				},
				"day_3" : { 
					$sum: { 
						$cond: [ { $gt: [ "$date", d3 ] }, 1, 0  ] 
					} 
				},
				"day_7" : { 
					$sum: { 
						$cond: [ { $gt: [ "$date", d7 ] }, 1, 0  ] 
					} 
				},
				"day_28" : { 
					$sum: { 
						$cond: [ { $gt: [ "$date", d28 ] }, 1, 0  ] 
					} 
				},
				"all" : { $sum : 1 }
			}
		}
	], function (err, res) {
		if(err || !res) {
			callback({status: false, error: err ? err : "No results" })
		} else {
			var result = {};
			for(var i in res) {
				result[res[i]._id] = { 
					day_1: res[i].day_1, 
					day_3: res[i].day_3, 
					day_7: res[i].day_7, 
					day_28: res[i].day_28, 
					all: res[i].all
				};
			}
			callback({status: true, result : result });
		}
	});
}

function check_email(email) {
	var regex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
	return regex.test(email);
}

exports.list_orders = function (data, callback) {

	data.status = data.status || 0;
	db.db.orders.find({ status: 0 }).toArray(function (err, orders) {
		if(err) {
			callback({status: false, error: err});
		} else {
			var ids = [];
			for(var i in orders) {
				ids.push(orders.shop_id);
			}
			db.db.shop.find({ _id : { $in : ids }}, { _id : 1, title: 1, price: 1, preview: 1}).toArray(function (err2, items) {
				if(err2) {
					callback({status: false, error: err2});
				} else {
					
				}
			});
		}
	});
}

exports.create_order = function (data, callback) {
	var res = null;
	if(!data.id) {
		res = { status : false, error: "Missing id" };
	}
	if(!data.email || !check_email(data.email)) {
		res = { status : false, error: "Invalid email" };
	} 

	if(res) {
		callback(res);
	} else {
		db.db.orders.insert(
		{ 
			shop_id : ObjectID(data.id), 
			date: new Date().getTime(), 
			email : data.email,
			status: 0
		}, 
		function (err, result) {
			log(result);
			if(err) {
				callback({status: false, error: err});
			} else {
				callback({ status : true, result: result[0]._id});
			}
		});
	}
}