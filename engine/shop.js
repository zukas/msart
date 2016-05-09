var db = require("../db"),
	ObjectID = require('mongodb').ObjectID,
	check 		= require('./validate');


exports.create_category = function (data, callback) {

	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			id: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID"
			},
			title: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$Other"
			}
		}
	});

	if(res.status) {
		data.id = data.id.toObjectID();
		db.db.category.update(
			{ _id : data.id }, 
			{ _id : data.id, title: data.title, norm: data.title.toLowerCase() }, 
			{ upsert : true }, 
			function (err, update) {
				if(err) {
					callback({status : false, error : err});
				} else {
					callback({status : true, id: data.id});
				}
			});
	} else {
		callback(res);
	}
}

exports.delete_category = function (data, callback) {
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
		data.id = data.id.toObjectID();
		db.db.category.findOne({ _id : data.id }, { items: 1 }, function (err, category) {
			if(err) {
				callback({status : false, error : err});
			} else {
				if(category.items && category.items.length > 0) {
					callback({status : false, error : "Category is not empty" });
				} else {
					db.db.category.remove({ _id : data.id }, function (err2) {
						if(err2) {
							callback({status : false, error : err2});
						} else {
							callback({status : true});
						}
					})
				}
			}
		});
	} else {
		callback(res);
	}
}

exports.categoryies = function (data, callback) {
	db.db.category.find({}).sort({norm : 1}).toArray(function (err, res) {
		if(err) {
			callback({status:false, error: err});
		} else {
			callback({status:true, categoryies : res});
		}
	});
}

exports.category_add_item = function (data, callback) {
	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			item: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID"
			},
			category: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID"
			}
		}
	});

	if(res.status) {
		data.item = data.item.toObjectID();
		data.category = data.category.toObjectID();
		db.db.shop.findOne({_id : data.item }, { _id : 1}, function (err, item) {
			if(err || !item) {
				callback({status : false, error : err || "No such item"});
			} else {
				db.db.category.update({_id : data.category }, { $addToSet: { items: data.item }}, function (err2) {
					if(err2) {
						callback({status : false, error : err2});
					} else {
						callback({status: true});
					}
				})
			}
		});
	} else {
		callback(res);
	}
}

exports.category_remove_item = function (data, callback) {
	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			item: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID"
			},
			category: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID"
			}
		}
	});

	if(res.status) {
		data.item = data.item.toObjectID();
		data.category = data.category.toObjectID();
		db.db.category.update({_id : data.category }, { $pull: { items: data.item }}, function (err) {
			if(err2) {
				callback({status : false, error : err});
			} else {
				callback({status: true});
			}
		});
	} else {
		callback(res);
	}	
}


exports.list = function (data, callback) {
	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			sort: {
				type: check.TYPE.VALUE,
				class: "Number",
				value : "0|1|2|3",
				optional: true,
				convert : true
			},
			filter: {
				type: check.TYPE.VALUE,
				class: "String",
				regex : "$ObjectID",
				optional: true
			}
		}
	});

	var filter 	= null,
		sort 	= null;

	if(res.status) {
		data = res.data;
		if(data.sort) {
			sort = {
				0 : { norm : 1 },
				1 : { norm : -1 },
				2 : { "price.values.0.price" : 1 },
				3 : { "price.values.0.price" : -1 }
			}[data.sort];
		}
	}

	if(!sort) {
		sort = { norm : 1 };
	}


	db.db.shop.find({}, {_id : 1, title: 1, norm: 1, price: 1, preview: 1, category: 1})
	.sort(sort)
	.toArray(function (err, items) {
		if(err) {
			callback({status : false, error: err});
		} else {
			callback({status:true, items: items});
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
			title : {
				type : check.TYPE.VALUE,
				class : "String"
			},
			descrition : {
				type : check.TYPE.VALUE,
				class : "String",
				optional: true
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
			components : {
				type : check.TYPE.VALUE,
				class : "Number",
				convert : true,
				value: "0|1"
			},
			images : {
				type : check.TYPE.ARRAY,
				members : {
					type : check.TYPE.OBJECT,
					properties: {
						id: {
							type: check.TYPE.VALUE,
							class : "String",
							regex : "$ObjectID"
						},
						label : {
							type: check.TYPE.VALUE,
							class : "String",
							regex : "$Name",
							optional : true
						}
					}
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
		data.preview = data.images[0];
		data.labels = [];
		for(var i = 0; i < data.images.length; ++i) {
			if(data.images[i].label) {
				data.images[i].label = data.images[i].label.normalize();
				var idx = data.labels.indexOf(data.images[i].label);
				if(idx < 0) {
					data.labels[i] = data.images[i].label;
				}
			}
		}
		data.norm = data.title.toLowerCase();
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

	log(data);
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

	log(res);

	if(res.status) {
		db.db.shop.findOne({ _id : data.id.toObjectID() }, { 
			title: 1, 
			type: 1, 
			availability: 1, 
			action: 1, 
			components: 1, 
			price: 1, 
			descrition: 1, 
			images: 1, 
			labels: 1
		}, function (err, res) {
			if(err) {
				callback({status : false, error : err});
			} else {
				callback({status : true, item : res});
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