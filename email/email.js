"use strict";

var mailer 		= require('nodemailer'),
	config 		= require('../config')(),
	ses 		= require('nodemailer-ses-transport'),
	path 		= require('path'),
	fs 			= require('fs'),
	swig 		= require('swig'),
	base 		= path.join(__dirname, 'templates'),
	templates 	= {
		contact : path.join(base, "contact.html"),
		info : path.join(base, "info.html"),
		purchase: path.join(base, "purchase.html")
	},
	subject 	= {
		contact : "User contact",
		info : "Item inquiry",
		purchase : "Order details"
	},
	transport = mailer.createTransport(ses(config.ses));

function renderTemplate(template, locals, callback) {
	var file = templates[template];
	if(file) {
		swig.renderFile(file, locals, callback);
	} else {
		callback("No matching template", null);
	}
}


exports.createFile = function(template, locals, callback) {
	renderTemplate(template, locals, function (err, out) {
		if(err) {
			callback({status: false, error: err});
		} else {
			fs.writeFile(path.join(__dirname, 'tmp.html'), out, function (err2) {
				if(err2) {
					callback({status: false, error: err2});
				} else {
					callback({status:true});
				}
			})
		}
	});
}

exports.sendMail = function (template, locals, to, callback) {

	renderTemplate(template, locals, function (err, res) {
		if(err) {
			log(err);
			callback({status:false});
		} else {
			var mailOptions = {
			    from: config.mailSender,
			    to: to,
			    subject: subject[template],
			    html: res
			};
			transport.sendMail(mailOptions, function(err2, info){
			    if(err2){
			        log(err2);
			        callback({status: false});
			    } else {
				    callback({status: true});
			    }
			});
		}
	})
}