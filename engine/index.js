var check 	= require("./validate"),
	images 	= require("./images"),
	users 	= require("./users"),
	about 	= require("./about"),
	shop 	= require("./shop"),
	orders 	= require("./orders"),
	gallery = require("./gallery"),
	contact = require("./contact"),
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
	log(req.device);

	res.render(req.device.type == "desktop" ? "desktop.html" : "mobile.html", { admin: req.session.admin, username : req.session.username });
	log("sessionID: " + req.sessionID);
};

exports.login = function (req, res) {
	if(req.session.admin) {
		res.redirect('/');
	} else {
		res.render("login.html");
	}
}

exports.do_login = function (req, res) {

	users.login(req.body, function (login_res) {
		if(login_res.status) {
			req.session.username = req.body.username;
			req.session.admin = true;
		}
		res.send(login_res);
	});
}

exports.do_logout = function (req, res) {
	req.session.destroy();
	req.session = null;
	res.redirect('/');
}

exports.list_images = function (req, res) {
	if(req.session.admin) {
		images.list_images(function (data) {
			res.send(data);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}

exports.load_image = function (req, res) {
	log(req.query);
	images.load_image({ id : req.params.id }, function (data) {
		gm(data.buffer, data.name) 
		.resize(req.query.width, req.query.height)
		.toBuffer("JPEG", function (err, buffer) {
			log("loaded small image: " + req.params.id + " " + data.mimetype);
			res.writeHead(200, {'Content-Type': data.mimetype });
			res.end(buffer, 'binary');
		});	
	});
}

exports.load_small_image = function (req, res) {
	images.load_image({ id : req.params.id }, function (data) {
		gm(data.buffer, data.name)
		.resize(null, 600)
		.toBuffer("JPEG", function (err, buffer) {
			log("loaded small image: " + req.params.id + " " + data.mimetype);
			res.writeHead(200, {'Content-Type': data.mimetype });
			res.end(buffer, 'binary');
		});
	});
}

exports.load_thumb_image = function (req, res) {
	images.load_image({ id : req.params.id }, function (data) {
		gm(data.buffer, data.name)
		.resize(200, null)
		.toBuffer("JPEG", function (err, buffer) {
			log("loaded thumb image: " + req.params.id + " " + data.mimetype);
			res.writeHead(200, {'Content-Type': data.mimetype });
			res.end(buffer, 'binary');
		});
	});
}


exports.save_image = function (req, res) {

	if(req.session.admin) {
		images.save_image({ file: req.files.file }, function (data) {
			res.send(data);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}

}

exports.delete_image = function (req, res) {

	if(req.session.admin) {
		images.delete_image(req.body, function (data) {
			res.send(data);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}


exports.save_about = function (req, res) {
	if(req.session.admin) {
		about.save(req.body, function (data) {
			res.send(data);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}

exports.load_about = function (req, res) {
	about.load(function (data) {
		res.send(data);
	});
}


exports.list_shop_item = function (req, res) {
	shop.list(req.body, function (data) {
		if(req.session.admin) {
			shop.access_count(function (counts) {
				if(data.status && counts.status) {
					for(var i = 0; i < data.items.length; ++i) {
						data.items[i].counts = counts.result[data.items[i]._id];
					}
				}
				res.send(data);
			});
		} else {
			res.send(data);
		}
	});
}

exports.categories = function (req, res) {
	shop.categories(req.body, function (data) {
		res.send(data);
	});
}

exports.save_category = function (req, res) {
	if(req.session.admin) {
		shop.create_category(req.body, function (data) {
			res.send(data);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}

exports.delete_category = function (req, res) {
	if(req.session.admin) {
		shop.delete_category(req.body, function (data) {
			res.send(data);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}

exports.save_shop_item = function (req, res) {
	if(req.session.admin) {
		shop.save(req.body, function (data) {
			res.send(data);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}

exports.load_shop_item = function (req, res) {
	shop.load(req.body, function (data) {
		if(!req.session.admin && data.status) {
			var other = req.body;
			other.address = req.connection.remoteAddress;
			shop.access(other);
		}
		res.send(data);
	});
}

exports.delete_shop_item = function (req, res) {
	if(req.session.admin) {
		shop.delete(req.body, function (data) {
			res.send(data);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}

exports.create_order = function (req, res) {
	shop.create_order(req.body, function (data) {
		res.send(data);
	});
}

exports.load_gallery = function (req, res) {
	gallery.load(function (data) {
		res.send(data);
	});
}

exports.save_gallery_item = function (req, res) {
	if(req.session.admin) {
		images.save_image({ file: req.files.file }, function (data) {
			log("save_gallery_item data", data);
			if(data.status) {
				gallery.save(data, function (response) {
					log("save_gallery_item result", response);
					res.send(response);
				});
			} else {
				res.send(data);
			}
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}

exports.delete_gallery_item = function (req, res) {
	if(req.session.admin) {
		images.delete_image(req.body, function (data) {
			log(data);
			if(data.status) {
				gallery.delete(req.body, function (response) {
					res.send(response);
				});
			} else {
				res.send(data);
			}
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}
}

exports.swap_gallery = function (req, res) {
	if(req.session.admin) {
		gallery.swap_gallery(req.body, function (response) {
			res.send(response);
		});
	} else {
		res.send({ status: false, error: "Not allowed"});
	}	
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
								log("session " + session_id + " has expired");
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
	if(!req.session.created) {
		req.session.created = new Date();
		store.push(req.sessionID);
	}
	req.session.valid = new Date();
	next();
}

exports.order_add = function (req, res) {
	var data = req.body;
	data.sessionID = req.sessionID;
	orders.session_order_add(data, function (result) {
		log(result);
		res.send(result);
	});
}

exports.order_remove = function (req, res) {
	var data = req.body;
	data.sessionID = req.sessionID;
	orders.session_order_remove(data, function (result) {
		log(result);
		res.send(result);
	});
}

exports.order_session = function (req, res) {
	orders.session_order_load(req.sessionID, function (result) {
		log(result);
		res.send(result);
	});
}


exports.order_shipping = function (req, res) {
	var data = req.body;
	data.sessionID = req.sessionID;
	orders.shipping(data, function (result) {
		res.send(result);
	});
}

exports.payment_types = function (req, res) {
	log("payment_types");
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
}

exports.order_pay_paypal = function (req, res) {
	var data = req.body || {};
	data.sessionID = req.sessionID;
	orders.payment_paypal(data, function (result) {
		res.send(result);
	});
}

exports.order_pay_card = function (req, res) {
	var data = req.body;
	data.sessionID = req.sessionID;
	orders.payment_card(data, function (result) {
		res.send(result);
	});
}

exports.order_process = function (req, res) {
	var data = {
		sessionID : req.sessionID,
		accept: req.protocol + '://' + req.get('host') + "/async/paypal/accept",
		cancel: req.protocol + '://' + req.get('host') + "/async/paypal/cancel"
	};
	orders.approve(data, function (result) {
		if(result.status) {
			res.redirect(result.link);
		} else {
			res.send(result);
		}
	});
}

exports.paypal_return = function (req, res) {
	var data = req.query;
	data.sessionID = req.sessionID;
	orders.execute(data, function (result) {
		req.session.destroy();
		res.redirect("/");
	});
}

exports.paypal_cancel = function (req, res) {
	req.session.destroy();
	res.redirect("/");
}


exports.contact = function (req, res) {
	var data = req.body;
	data.sessionID = req.sessionID;
	contact.send(data, function (result) {
		res.send(result);
	});
}