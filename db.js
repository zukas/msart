"use strict";

var mongo 		= require("mongodb"),
	events 		= {},
	db_instance = null;

require("./utils");

exports.db = null;

exports.start = function (info, callback) {
	function updateCollections(db) {
		var create = function (index, list, done) {
			if (index < list.length) {
				db.createCollection(list[index], {}, function (err2, collection) {
					if(err2) throw err2;
					exports.db[ list[index] ] = collection;
					async(create, index + 1, list, done);
				});	
			} else {
				async(done);
			}	
		};
		async(create, 0, info.collections, function () {
			async(callback);
			callback = null;
			for(var i in events['started'] || [])
			{
				async(events.started[i]);
			}
		});
	}
	if(exports.db == null)
		exports.db = new mongo.Db(info.name, new mongo.Server("localhost", 27017, { auto_reconnect : true, poolSize: 20, socketOptions: { noDelay : true, } }), { safe : true });

	if(db_instance == null) {
		exports.db.open(function (err, db) {
			if(err) throw err;
			db_instance = db;
			updateCollections(db);
		});
	} else {
		updateCollections(db_instance);
	}
};

exports.on = function (event, callback) {
	if(typeof event === 'string' && typeof callback === 'function')
	{
		events[event] = events[event] || [];
		events[event].push(callback);
	} else {
		throw 'Event and/or callback missmatch - event type: ' + (typeof event) + ', value: ' + event + ', callback type: ' + (typeof callback);
	}
};
