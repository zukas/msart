"use strict";

var check 	= require("./validate"),
	images 	= require("./images"),
	users 	= require("./users"),
	about 	= require("./about"),
	shop 	= require("./shop"),
	orders 	= require("./orders"),
	gallery = require("./gallery"),
	contact = require("./contact"),
	config 	= require("../config")(),
	url 	= require('url'),
	gm		= require("gm"),
	store 	= [];

check.installRegex("ObjectID", /^[\w\d]{24}$/);
check.installRegex("sessionID", /^.{32}$/);
check.installRegex("Name", /^.{2,20}$/);
check.installRegex("Surname", /^.{2,30}$/);
check.installRegex("Address", /^.{5,100}$/);
check.installRegex("Other", /^.{2,50}$/);
check.installRegex("Phone", /^\d{5,14}$/);
check.installRegex("CVV", /^\d{3,4}$/);
check.installRegex("Year", /^\d{4}$/);
check.installRegex("Month", /^\d{1,2}$/);
check.installRegex("Email", /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i);
check.installConverter("String", "Number", function (value) {
	var res = Number(value);
	if(res == value) {
		return res;
	} else {
		return null;
	}
});

check.installValidator("CardNumber", (function (arr) {
    return function (ccNum) {
        var 
            len = ccNum.length,
            bit = 1,
            sum = 0,
            val;

        while (len) {
            val = parseInt(ccNum.charAt(--len), 10);
            sum += (bit ^= 1) ? arr[val] : val;
        }

        return sum && sum % 10 === 0;
    };
}([0, 2, 4, 6, 8, 1, 3, 5, 7, 9])));

check.installMod("firstCap", function (data) {
	if(check.classOf(data) == "String" && data.length > 0) {
		data = data.charAt(0).toUpperCase() + data.slice(1);
	}
	return data;
})

exports.index = function(req, res){
	prof("index", function (end) {
		var renderFile = req.session.render || (req.device.type == "desktop" ? "desktop.html" : "mobile.html");
		var renderData = req.session.renderData || { admin: req.session.admin };
		req.session.render = null;
		req.session.renderData = null;

		if(renderData && config.debug) {
			renderData.debug = true;
		} 
		res.render(renderFile, renderData);
		if (req.session.end) {
			req.session.end = null;
			req.session.destroy();
		}
		end();
	});
};

exports.login = function (req, res) {
	prof("login", function(end){
		if(req.session.admin) {
			res.redirect('/');
		} else {
			res.render("login.html", config.debug ? { debug : true } : null);
		}
		end();
	});
}

exports.do_login = function (req, res) {
	prof("do_login", function(end){
		users.login(req.body, function (login_res) {
			if(login_res.status) {
				req.session.username = req.body.username;
				req.session.admin = true;
			}
			res.send(login_res);
			end();
		});
	});
}

exports.do_logout = function (req, res) {
	prof("do_logout", function(end){
		req.session.destroy();
		req.session = null;
		res.redirect('/');
		end();
	});
}

exports.list_images = function (req, res) {
	prof("list_images", function(end){
		if(req.session.admin) {
			images.list_images(function (data) {
				res.send(data);
				end();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}

exports.load_image = function (req, res) {
	prof("load_image", function(end){
		images.load_image({ id : req.params.id }, function (data) {
			gm(data.buffer, data.name) 
			.resize(req.query.width, req.query.height)
			.toBuffer("JPEG", function (err, buffer) {
				
				res.writeHead(200, {'Content-Type': data.mimetype, "Cache-Control" : "no-transform,public,max-age=86400" });
				res.end(buffer, 'binary');
				end();
			});	
		});
	});
}

exports.load_small_image = function (req, res) {
	prof("load_small_image", function(end){
		images.load_image({ id : req.params.id }, function (data) {
			gm(data.buffer, data.name)
			.resize(null, 600)
			.toBuffer("JPEG", function (err, buffer) {
				
				res.writeHead(200, {'Content-Type': data.mimetype, "Cache-Control" : "no-transform,public,max-age=86400" });
				res.end(buffer, 'binary');
				end();
			});
		});
	});
}

exports.load_thumb_image = function (req, res) {
	prof("load_thumb_image", function(end){
		images.load_image({ id : req.params.id }, function (data) {
			gm(data.buffer, data.name)
			.resize(200, null)
			.toBuffer("JPEG", function (err, buffer) {
				
				res.writeHead(200, {'Content-Type': data.mimetype, "Cache-Control" : "no-transform,public,max-age=86400" });
				res.end(buffer, 'binary');
				end();
			});
		});
	});
}


exports.save_image = function (req, res) {
	prof("save_image", function(end){
		if(req.session.admin) {
			images.save_image({ file: req.files.file }, function (data) {
				res.send(data);
				prof();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}

exports.delete_image = function (req, res) {
	prof("delete_image", function(end){
		if(req.session.admin) {
			images.delete_image(req.body, function (data) {
				res.send(data);
				end();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}


exports.save_about = function (req, res) {
	prof("save_about", function(end){
		if(req.session.admin) {
			about.save(req.body, function (data) {
				res.send(data);
				end();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}

exports.load_about = function (req, res) {
	prof("load_about", function(end){
		about.load(function (data) {
			res.send(data);
			end();
		});
	});
}


exports.list_shop_item = function (req, res) {
	prof("list_shop_item", function(end){
		shop.list(req.body, function (data) {
			if(req.session.admin) {
				shop.access_count(function (counts) {
					if(data.status && counts.status) {
						for(var i = 0; i < data.items.length; ++i) {
							data.items[i].counts = counts.result[data.items[i]._id];
						}
					}
					res.send(data);
					end();
				});
			} else {
				res.send(data);
				end();
			}
		});
	});
}

exports.categories = function (req, res) {
	prof("categories", function(end){
		shop.categories(req.body, function (data) {
			res.send(data);
			end();
		});
	});
}

exports.save_category = function (req, res) {
	prof("save_category", function(end){
		if(req.session.admin) {
			shop.create_category(req.body, function (data) {
				res.send(data);
				end();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}

exports.delete_category = function (req, res) {
	prof("delete_category", function(end){
		if(req.session.admin) {
			shop.delete_category(req.body, function (data) {
				res.send(data);
				end();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}

exports.save_shop_item = function (req, res) {
	prof("save_shop_item", function(end){
		if(req.session.admin) {
			shop.save(req.body, function (data) {
				res.send(data);
				end();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}

exports.load_shop_item = function (req, res) {
	prof("load_shop_item", function(end){
		shop.load(req.body, function (data) {
			if(!req.session.admin && data.status) {
				var other = req.body;
				other.address = req.connection.remoteAddress;
				shop.access(other);
			}
			res.send(data);
			end();
		});
	});
}

exports.delete_shop_item = function (req, res) {
	prof("delete_shop_item", function(end){
		if(req.session.admin) {
			shop.delete(req.body, function (data) {
				res.send(data);
				end();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}	
	});
}

exports.create_order = function (req, res) {
	prof("create_order", function(end){
		shop.create_order(req.body, function (data) {
			res.send(data);
			end();
		});
	});
}

exports.load_gallery = function (req, res) {
	prof("load_gallery", function(end){
		gallery.load(function (data) {
			res.send(data);
			end();
		});
	});
}

exports.save_gallery_item = function (req, res) {
	prof("save_gallery_item", function(end){
		if(req.session.admin) {
			images.save_image({ file: req.files.file }, function (data) {
				
				if(data.status) {
					gallery.save(data, function (response) {
						res.send(response);
						end();
					});
				} else {
					res.send(data);
					end();
				}
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}

exports.delete_gallery_item = function (req, res) {
	prof("delete_gallery_item", function(end){
		if(req.session.admin) {
			images.delete_image(req.body, function (data) {
				
				if(data.status) {
					gallery.delete(req.body, function (response) {
						res.send(response);
						end();
					});
				} else {
					res.send(data);
					end();
				}
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}
	});
}

exports.swap_gallery = function (req, res) {
	prof("swap_gallery", function(end){
		if(req.session.admin) {
			gallery.swap_gallery(req.body, function (response) {
				res.send(response);
				end();
			});
		} else {
			res.send({ status: false, error: "Not allowed"});
			end();
		}	
	});
}

exports.track_sessions = function (session_store) {
	setInterval(function () {
		for(var i = 0; i < store.length; ++i) {
			(function (session_id) {
				session_store.get(session_id, function (err, session) {
					if(session){
						if(session.valid && !	session.admin) {
							var current 	= new Date(),
								valid 		= new Date(session.valid.getTime() + 15 * 60000);
							if(valid < current) {
								session_store.destroy(session_id);
								
							}
						}
					} else if(!err) {
						var idx = store.indexOf(session_id);
						if(idx >= 0) {
							store.splice(idx, 1);
						}
							
					}
				});
			})(store[i])
		}
	}, 30000);
}

exports.session_update = function (req, res, next) {
	if(req.session) {
		if(!req.session.created) {
			req.session.created = new Date();
			store.push(req.sessionID);
		}
		req.session.valid = new Date();
	}
	next();
}

exports.order_add = function (req, res) {
	prof("order_add", function(end){
		var data = req.body;
		data.sessionID = req.sessionID;
		orders.session_order_add(data, function (result) {
			
			res.send(result);
			end();
		});
	});
}

exports.order_remove = function (req, res) {
	prof("order_remove", function(end){
		var data = req.body;
		data.sessionID = req.sessionID;
		orders.session_order_remove(data, function (result) {
			
			res.send(result);
			end();
		});
	});
}

exports.order_session = function (req, res) {
	prof("order_session", function(end){
		orders.session_order_load(req.sessionID, function (result) {
			res.send(result);
			end();
		});
	});
}


exports.order_shipping = function (req, res) {
	prof("order_shipping", function(end){
		var data = req.body;
		data.sessionID = req.sessionID;
		orders.shipping(data, function (result) {
			res.send(result);
			end();
		});
	});
}

exports.payment_types = function (req, res) {
	prof("payment_types", function(end){
		res.send({ 
			status : true, 
			types : [
				"paypal"//, "visa", "mastercard", "discover", "amex"
			],
			options: {
				paypal : {}
				// card : { expand : true }
			}
		});
		end();
	});
}

exports.order_pay_paypal = function (req, res) {
	prof("order_pay_paypal", function(end){
		var data = req.body || {};
		data.sessionID = req.sessionID;
		orders.payment_paypal(data, function (result) {
			res.send(result);
			end()
		});
	});
}

exports.order_pay_card = function (req, res) {
	prof("order_pay_card", function(end){
		var data = req.body;
		data.sessionID = req.sessionID;
		orders.payment_card(data, function (result) {
			res.send(result);
			end();
		});
	});
}

exports.order_process = function (req, res) {
	prof("order_process", function(end){
		var data = {
			sessionID : req.sessionID,
			accept: config.domain + "/async/paypal/accept",
			cancel: config.domain + "/async/paypal/cancel"
		};
		orders.approve(data, function (result) {
			if(result.status) {
				res.redirect(result.link);
			} else {
				res.send(result);
			}
			end()
		});
	});
}

exports.paypal_return = function (req, res) {
	prof("paypal_return", function(end){
		var data = req.query;
		data.sessionID = req.sessionID;
		orders.execute(data, function (result) {
			req.session.render = "purchase.html";
			req.session.renderData = result;
			req.session.end = true;
			res.redirect("/");
			end();
		});
	});
}

exports.paypal_cancel = function (req, res) {
	prof("paypal_cancel", function(){
		req.session.render = "purchase.html";
		res.redirect("/");
		end();
	});
	
}

exports.contact = function (req, res) {
	prof("contact", function(end){
		var data = req.body;
		data.sessionID = req.sessionID;
		contact.send(data, function (result) {
			res.send(result);
			end();
		});
	});
}
