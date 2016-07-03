var mailer 		= require('nodemailer'),
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
	sender		= "julius.zukauskas@gmx.com";

var transport = mailer.createTransport(ses({
    accessKeyId: "AKIAIL7SHXCBZ3W4PEMA",
    secretAccessKey: "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",
    region: "eu-west-1",	
    rateLimit: 1 // do not send more than 5 messages in a second
}));

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
			    from: sender,
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