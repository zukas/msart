var db 			= require("../db"),
	ObjectID 	= require('mongodb').ObjectID,
	check 		= require('./validate'),
	id 			= new ObjectID("566f29ef9a2880fb27ef96d1");

// {
// 	fields: [
// 		"This is paragraph one",
// 		"This is paragraph two",
// 		"This is paragraph three",
// 		"This is paragraph four",
// 	]
// }

exports.save = function (data, callback) {

	var res = check.run(data,
	{
		type: check.TYPE.OBJECT,
		properties: {
			fields: {
				type: check.TYPE.ARRAY,
				members: {
					type: check.TYPE.VALUE,
					class: "String"
				}
			}
		}
	});

	if(res.status) {
		db.db.about.update(
			{ _id : id }, 
			{ $set : 
				{ _id : id, fields : data.fields } 
			}, 
			{ upsert : true },
			function (err, res) {
			 if(err) {
			 	callback({status : false, error: err});
			 } else {
			 	callback({status : true});
			 }
		});
	} else {
		callback(res);
	}


}

exports.load = function (callback) {
	db.db.about.findOne({ _id : id }, function (err, result) {
		 if(err) {
		 	callback({status : false, error: err});
		 } else {
		 	callback({status : true, fields: result ? result.fields : [] });
		 }
	});
}