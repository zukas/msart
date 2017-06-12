

exports.execute = function () {
	var db 		= require("../db");
	db.start({
		name: "msart",
		collections: [
			"gallery"
		]
	}, function () {
		status("Database initiated")
		db.db.gallery.find().sort({created : -1}).toArray(function (err, results) {
			if(err || !results) {
				error(err);
			} else if (results.length > 0) {

				var all = true;
				for(var i = 0; i < results.length && all; i++) {
					all = results[i].hasOwnProperty("index");
				}
				if(all) {
					complete("Nothing to do");
					return;
				}

				var bulk = db.db.gallery.initializeUnorderedBulkOp();			
				for(var i = 0; i < results.length; i++) {
					bulk.find({ _id : results[i]._id}).updateOne({ $set: { index : i }});
				}
				bulk.execute(function (err2, res2) {
					if(err2) {
						error(err2);
					}
					complete();
				});
			} else {
				complete("Nothing to do");
			}
		});
	});
}
