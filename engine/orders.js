var db 			= require("../db"),
	ObjectID 	= require('mongodb').ObjectID,
	check 		= require('./validate'),
	paypal 		= require('paypal-rest-sdk');

paypal.configure({
	'mode': 'sandbox',
	'client_id': "ARtHghnQoxh5PT7fNjPSNBtJ3fN2JqcNTfJT4Xe3kvHO9Fo_Poz8am6OGUXIj83i_mW8_MIF0k-BOYPM",
	'client_secret': "EH4tc7QSPx_vN3KYLlTEmzQ4RKziQgcjPGTbBuoR-nkdxq1TQhA7OMBrhbS_D9PVkzKltNDsbSRcWz4N"
});


function load_order_totals(sessionID, callback) {
	db.db.orders.find({sessionID : sessionID}).sort({shipping: -1}).toArray(function (err, res) {
		if(err) {
			callback({status:false, error: err});
		} else {
			var total = 0,
				result = [];
			for(var i = 0; i < res.length; ++i) {
				var id 			= res[i]._id,
					item 		= res[i].item,
					price 		= res[i].price,
					quantity	= res[i].quantity,
					shipping 	= res[i].shipping,
					discount 	= i > 0 ? 0.4 : 0;
				total += price + shipping * (1 - discount);
				result.push({
					id : id, 
					item : item,
					quantity : quantity, 
					price : price,
					shipping : shipping,
					discount : discount
				});
			}
			callback({ status : true, total : total, items: result });

		}
	})
}

// {
// 	id : "dsa56d4as6d4as6d4as6das4",
// 	sessionID: "APGFhj9dmHNGIROf0WwpdApf6RrM12Fl",
// 	quantity: 1,
// 	price: 175,
// 	shipping: 45
// }
exports.session_order_add = function (data, callback) {

	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			id: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$ObjectID"
			},
			sessionID: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$sessionID"
			},
			quantity: {
				type: check.TYPE.VALUE,
				class: "Number",
				convert: true
			},
			price: {
				type: check.TYPE.VALUE,
				class: "Number",
				convert: true
			},
			shipping: {
				type: check.TYPE.VALUE,
				class: "Number",
				convert: true
			},
		}
	});

	if(res.status) {
		data = res.data;
		data.id = data.id.toObjectID();
		log(data);
		db.db.shop.findOne({ 
			_id : data.id, 
			"price.values" : { 
				$elemMatch: { 
					quantity: data.quantity, 
					price: data.price,
					shipping: data.shipping 
				} 
			} 
		}, function (err, res) {
			if(err) {
				callback({ status: false, error: err });
			} else if(!res) {
				callback({ status: false, error: "No maching item" });
			} else {
				db.db.orders.update({
					item : data.id, 
					sessionID: data.sessionID
				}, 
				{ 
					item : data.id, 
					sessionID: data.sessionID, 
					quantity: data.quantity, 
					price: data.price, 
					shipping: data.shipping
				}, 
				{ 
					upsert : true 
				},
				function (err2, update) {
					if(err2) {
						callback({ status : false, error: err2 });
					} else {
						log(update.result);
						load_order_totals(data.sessionID, function (result) {
							if(update.result.upserted) {
								result.added = update.result.upserted[0]._id;
							}
							callback(result);
						});
					}
				});
			}
		});
	} else {
		callback(res);
	}
}

exports.session_order_remove = function (data, callback) {
	var res = check.run(data,
	{
		type : check.TYPE.OBJECT,
		properties : {
			sessionID : {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$sessionID"
			},
			id : {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$ObjectID" 
			}
		}
	});

	if(res.status) {
		data = res.data;

		db.db.orders.remove({ _id : data.id.toObjectID(), sessionID : data.sessionID }, function (err) {
			if(err) {
				callback({status : false, error: err});
			} else {
				load_order_totals(data.sessionID, function (result) {
					result.removed = data.id;
					callback(result);
				});
			}
		});
	} else {
		callback(res);
	}
} 

exports.session_order_load = function (sessionID, callback) {
	var res = check.run(sessionID,
	{
		type: check.TYPE.VALUE,
		class: "String",
		regex: "$sessionID"
	});

	if(res.status) {
		load_order_totals(sessionID, function (totals) {
			if(totals.status && totals.items.length > 0) {
				var ids = [];
				for(var i = 0; i < totals.items.length; ++i) {
					ids.push(totals.items[i].item);
				}
				db.db.shop.find({ 
					_id : { 
						$in : ids 
					}}, { 
						_id : 1, 
						title: 1, 
						preview: 1, 
						availability : 1 
					}).toArray(function (err, result) {
						if(err) {
							callback({status : false, error: err});
						} else {
							log(result);
							for(var i = 0; i < result.length; ++i) {
								for(var j = 0; j < totals.items.length; ++j) {
									log(totals.items[j].item.equals(result[i]._id));	
									if(totals.items[j].item.equals(result[i]._id)) {
										totals.items[j].title = result[i].title;
										totals.items[j].preview = result[i].preview;
										totals.items[j].availability = result[i].availability;
										break;
									}
								}
							}
							callback(totals);
						}
					});
			} else {	
				callback(totals);
			}
		});
	}
}

exports.shipping = function (data, callback) {
	var res = check.run(data,{
		type: check.TYPE.OBJECT,
		properties: {
			sessionID: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$sessionID"
			},
			company: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other",
				optional: true
			},
			forename: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Name",
				mod: "$firstCap"
			},
			surname: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Surname",
				mod: "$firstCap"
			},
			email: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Email"
			},
			phone: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Phone"
			},
			address : {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Address"
			},
			address2 : {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Address",
				optional: true
			},
			city: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			county: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			postCode: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			country: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			}
		}
	});

	if(res.status) {
		data = res.data;
		var sessionID = data.sessionID;
		delete data.sessionID;
		db.db.order_details.update({sessionID: sessionID}, { $set: { shipping: data } }, { upsert : true }, function (err, result) {
			if(err) {
				callback({status : false, error: err});
			} else {
				callback({status : true, data : data});
			}
		});
	} else {
		callback(res);
	}

}

exports.payment_paypal = function (data, callback) {
	var res = check.run(data,{
		type: check.TYPE.OBJECT,
		properties: {
			sessionID: {
				type : check.TYPE.VALUE,
				class: "String",
				regex: "$sessionID"
			},
			company: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other",
				optional: true
			},
			vat: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other",
				optional: true
			},
			address : {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Address"
			},
			address2 : {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Address",
				optional: true
			},
			city: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			county: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			postCode: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			country: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			}
		}
	});

	if(res.status) {
		data = res.data;
		var sessionID = data.sessionID;
		delete data.sessionID;
		data.paymentType = 0;
		db.db.order_details.update({sessionID: sessionID}, { $set: { billing: data } }, { upsert : false }, function (err, result) {
			if(err) {
				callback({status : false, error: err});
			} else {
				delete data.paymentType;
				callback({status : true, data : data});
			}
		});
	} else {
		callback(res);
	}
}

exports.payment_card = function (data, callback) {
	var res = check.run(data,{
		type: check.TYPE.OBJECT,
		properties: {
			sessionID: {
				type : check.TYPE.VALUE,
				class: "String",
				regex: "$sessionID"
			},
			forename: {
				type : check.TYPE.VALUE,
				class: "String",
				regex: "$Name"
			},
			surname: {
				type : check.TYPE.VALUE,
				class: "String",
				regex: "$Surname"
			},
			card: {
				type: check.TYPE.OBJECT,
				properties: {
					type : {
						type: check.TYPE.VALUE,
						class: "String",
						value: "visa|mastercard|discover|amex"
					},
					number: {
						type: check.TYPE.VALUE,
						class: "String",
						custom: "$CardNumber"
					}
				}
			},
			cvv: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$CVV"
			},
			expiryYear: {
				type: check.TYPE.VALUE,
				class: "Number",
				convert: true,
				regex: "$Year"
			},
			expiryMonth: {
				type: check.TYPE.VALUE,
				class: "Number",
				convert: true,
				regex: "$Month"
			},
			company: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other",
				optional: true
			},
			vat: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other",
				optional: true
			},
			address : {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Address"
			},
			address2 : {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Address",
				optional: true
			},
			city: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			county: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			postCode: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			},
			country: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$Other"
			}
		}
	});
	if(res.status) {
		data = res.data;
		var sessionID = data.sessionID;
		delete data.sessionID;
		data.paymentType = 1;
		db.db.order_details.update({sessionID: sessionID}, { $set: { billing: data } }, { upsert : false }, function (err, result) {
			if(err) {
				callback({status : false, error: err});
			} else {
				delete data.paymentType;
				callback({status : true, data : data});
			}
		});
	} else {
		callback(res);
	}

}

exports.pay = function (data, callback) {
	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			sessionID: {
				type: check.TYPE.VALUE,
				class: "String",
				regex: "$sessionID"
			},
			accept: {
				type: check.TYPE.VALUE,
				class: "String"
			},
			cancel: {
				type: check.TYPE.VALUE,
				class: "String"
			}
		}
	});

	if(res.status) {
		data = res.data;
		log(data);
		load_order_totals(data.sessionID, function (orders) {
			if(orders.status) {
				var total = orders.total,
					items = [];

				orders = orders.items;
				for(var i = 0; i < orders.length; ++i) {
					items[items.length] = orders[i].item;
				}

				db.db.shop.find({ _id : { $in : items }}, { title: 1 }).toArray(function (err, titles) {
					if(err) {
						callback({status:false, error: err});
					} else {
						for(var i = 0; i < orders.length; ++i) {
							for(var j = 0; j < titles.length; ++j) {
								if(titles[j]._id.equals(orders[i].item)) {
									orders[i].title = titles[j].title;
									break;
								}
							}
						}

						db.db.order_details.findOne({sessionID : data.sessionID}, function(err2, details) {
							if(err2) {
								callback({status : false, error: err2});
							} else if(details) {
 								
 								var payment 		= {
	 									"intent": "sale",
	 									"payer": { "payment_method": "paypal" },
	 									"redirect_urls": {
									        "return_url": data.accept,
									        "cancel_url": data.cancel
									    },
									    "transactions": []
	 								},
 									transaction 	= {
	 									"item_list": { "items" : [] },
	 									"amount": { "currency" : "PLN", "total": Number(total).toFixed(2) },
	 									"description": "Order at MS Craftshop."
	 								};

 								for(var i = 0; i <orders.length; ++i) {
 									transaction.item_list.items[transaction.item_list.items.length] = 
 									{
 										"name" : orders[i].title,
 										"price": Number(orders[i].price + orders[i].shipping * (1 - orders[i].discount)).toFixed(2),
 										"currency": "PLN",
 										"quantity": orders[i].quantity
 									};
 								}
 								payment.transactions[0] = transaction;
 								if(details.billing.paymentType == 1) {
 									var funding 	= {
 										credit_card: {
 											number : details.billing.card.number,
 											type : details.billing.card.type,
 											expire_month : details.billing.expiryMonth,
 											expire_year : details.billing.expiryYear,
 											cvv2 : details.billing.cvv,
 											first_name : details.billing.forename,
 											last_name : details.billing.surname,
 											billing_address : {
 												line1 : details.billing.address,
 												line2 : details.billing.address2,
 												city : details.billing.city,
 												postal_code : details.billing.postCode,
 												country_code : "PL"
 											}
 										}
 									};
 									payment.payer.payment_method = "credit_card";
 									payment.payer.funding_instruments = [ funding ];
 								} 
 	
 								log(payment);
								paypal.payment.create(payment, function (err3, payment) {
								    if (err3) {
								        log(err3);
								    } else {
								        log("Create Payment Response", payment);
								    }
								});

 								callback({status: false});
							} else {
								callback({status : false, error: "Invalid shipping and billling information"});
							}
						});
					}
				});

			} else {
				callback(orders);
			}
		});

	} else {
		callback(res);
	}
}