

exports.execute = function () {
	var db 		= require("../db");
	db.start({
		name: "msart",
		collections: [
			"users",
			"images",
			"about",
			"shop",
			"category",
			"orders",
			"order_details",
			"gallery",
			"history",
			"access",
			"internal"
		]
	}, function () {
		status("Database initiated")
		db.db.shop.find().toArray(function (err, results) {
			if(err) {
				error(err);
			} else {
				var total = 0;
				if(results.length > 0) {
					for(var i = 0; i < results.length; ++i) {
						var images = [];
						for(var j = 0; j < results[i].images.length; ++j) {
							var tmp = results[i].images[j];
							if(tmp.hasOwnProperty("id")) {
								status("Database is in partial state: Shop item image " + tmp.id + " is in valid state");
								images[images.length] = tmp;
							} else {
								images[images.length] = { id: tmp };
							}
						}
						db.db.shop.update({_id : results[i]._id }, { $set: { images : images, preview: images[0] }}, function (err2) {
							if(err2) {
								error(err2);
							} 
							++total;
							status("Updated " + total + " of " + results.length);
							if(total == results.length) {
								complete();
							} else {
								error("Not all images have been updated");
							}
						});
					}
				} else {
					complete("Nothing to do");
				}
			}
		});
	});
}
