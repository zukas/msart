"use strict";

var db 			= require("../db"),
	ObjectID 	= require('mongodb').ObjectID,
    GridStore 	= require('mongodb').GridStore,
    sharp 		= require('sharp');


exports.list_images = function (callback) {
	db.db.images.find({}).toArray(function (err, result) {
		if (err) {
			callback({status : false, error: err });
		} else {
			callback({status : true, result: result });
		}
	});
}

exports.save_image = function (data, callback) {
	var object_id = new ObjectID();
	var gridStore = new GridStore(db.db, object_id, "w");
	gridStore.open(function (open_err, open_store) {
		if(open_err) {
			callback({ status : false, error: open_err });
			return;
		}
		sharp(data.file.buffer)
		.resize(1200, null)
		.quality(100)
		.withMetadata()
		.toFormat(sharp.format.jpeg)
		.toBuffer(function (err, buffer) {
			open_store.write(buffer, function (write_err, write_store) {
				if(write_err) {
					callback({ status : false, error: write_err });
					return;
				}
				write_store.close(function (close_err) {
					if(close_err) {
						callback({ status : false, error: close_err });
					} else {
						db.db.images.save({ _id: object_id, name: data.file.originalname, type : "image/jpeg", size: data.file.size, date : new Date() }, function (save_err, save_res) {
							if(save_err) {
								callback({ status : false, error: save_err });
							} else {
								callback({ status : true, id: object_id });
							}
						});
					}
				});
			});
		});
	});
}

exports.delete_image = function (data, callback) {
	var id = ObjectID(data.id);
	var gridStore = new GridStore(db.db, id, "r");
	gridStore.open(function (open_err, open_store) {
		if(open_err) {
			callback({ status : false, error: open_err });
			return;
		}

		open_store.unlink(function (del_err) {
			if(del_err) {
				callback({ status : false, error: del_err });
			} else {
				db.db.images.remove({_id : id }, function (rem_err) {
					if(rem_err) {
						callback({ status : false, error: rem_err });
					} else {
						callback({ status : true });
					}
				});
			}
		});
	});	
}

exports.load_image = function (data, callback) {
	prof("load_raw_image", function (end) {
		var id = ObjectID(data.id);
		var gridStore = new GridStore(db.db, id, "r");
		gridStore.open(function (open_err, open_store) {
			if(open_err) {
				callback({ status : false, error: open_err });
				end();
				return;
			}
			open_store.seek(0, function (seek_err, seek_store) {

				if(seek_err) {
					callback({ status : false, error: seek_err });
					end();
					return;
				}

				seek_store.read(function (read_err, read_data) {
					seek_store.close();

					if(read_err) {
						callback({ status : false, error: read_err });
						end();
					} else {

						db.db.images.findOne({_id : id }, { name: 1, type : 1 }, function (find_err, find_data) {
							if(find_err) {
								callback({ status : false, error: find_err });
							} else {
								callback({ status : true, buffer: read_data, mimetype: find_data.type });
							}
							end();
						});
					}
				});
			});
		});
	});
}