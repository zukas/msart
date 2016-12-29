"use strict";

process.env.NODE_ENV 		= "production";
process.env.EXPRESS_ENV 	= "production";

var config 		= require('./mailer_config')(),
	mailer 		= require('nodemailer'),
	path 		= require('path'),
	fs 			= require('fs'),
	ses 		= require('nodemailer-ses-transport'),
	swig 		= require('swig'),
	db 			= require("./db"),
	cron 		= require('cron').CronJob,
	template 	= path.join(__dirname, 'email/templates', config.mailTemplate),
	transport 	= mailer.createTransport(ses(config.ses)),
	offset 		= config.mailRepeatDays * 24 * 60 * 60 * 1000;


function sendMail (locals, to, callback) {

	swig.renderFile(template, locals, function (err, res) {
		if(err) {
			callback({status:false});
		} else {
			var mailOptions = {
			    from: config.mailSender,
			    to: to,
			    subject: "Materiały reklamowe i pamiątkowe.",
			    html: res
			};
			transport.sendMail(mailOptions, function(err2, info){
			    if(err2){
			    	console.log("Failed to send email to", to , "Error:", err2);
			        callback({status: false});
			    } else {
			    	console.log("Sent email to", to);
				    callback({status: true});
			    }
			});
		}
	});
}

function runner () {
	var current = (new Date()).getTime(),
		exire 	= current - offset;

	db.db.mails.find({ $or: [ { lastSent : { $lte : exire } }, { lastSent : { $exists: false } }] }).limit(5).toArray(function (err, mails) {
		if(mails) {
			for(var i in mails) {
				(function (mail) {
					sendMail({ company : mail.company, fullName : mail.fullName }, mail.address, function (res) {
						if(res.status) {
							db.db.mails.update({ _id : mail._id}, { $set: { lastSent : current } }, function (err) { });
						}
					});
				})(mails[i]);
			}
		}
	});
}



db.start({
	name: "mailer",
	collections: [
		"mails"
	]
}, function () {

	if(process.argv.length == 4 && process.argv[2] == "-i") {
		var file = process.argv[3];
		file = fs.realpathSync(file);
		console.log(file);
		var data = fs.readFileSync(file, "utf8").toString();
		data = data.replace(/[\n\r]/g,"").split(",");


		var bulk = db.db.mails.initializeUnorderedBulkOp();
		for(var i in data) {
			bulk.find({ address : data[i] }).upsert().updateOne({
				$setOnInsert: { address: data[i] },
			});
		}
		bulk.execute(function(err) {
			if(err) console.log(err);
			process.exit(0);
		});
	} else {
		// 0 10 * * 1-5
		var task = new cron("0 10 * * 1-5", function () {
			runner();
		});

		task.start();
	}
});
