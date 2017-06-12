var util 		=require("util");
	db 			= require("../db"),
	versions 	= [
		1.0, 1.1, 1.2
	];

function check_update(current) {

	var idx = versions.indexOf(current);
	if(idx >= 0) {
		if(idx + 1 < versions.length) {
			return versions[idx + 1];
		}
	}
	return null;
}

function print_success(text) {
	util.log("\x1b[34m" + text + "\x1b[0m");
}

function print_fail (text) {
	util.log("\x1b[31m" + text + "\x1b[0m");
}

function run_update(version, callback) {
	this.complete = function (msg) {
		if(msg) {
			print_success(msg);
		}
		callback(true, version);
	};
	this.status = print_success;
	this.error = function (err) {
		print_fail(err || "Update to " + version + " failed for unknown reasons");
		callback(false, version);
	}
	require("./v" + version).execute();
}

function check_run(version) {
	print_success("Chiking available updates for version " + version);
	var next = check_update(version);
	print_success("Next version: " + (next || "None"));
	if(next) {
		run_update(next, function (status) {
			if(status) {
				print_success("Updated to version " + next);
				db.db.internal.update({_id : 0}, { $set: { _id: 0, version: next } }, { upsert : true }, function (err) {
					if(err) {
						print_fail("Failed to update from " + version + " to " + next);
						process.exit(1);
					} else {
						check_run(next);
					}
				});
			} else {
				print_fail("Failed to update from " + version + " to " + next);
				process.exit(1);
			}
		});
	} else {
		print_success("All done");
		process.exit(0);
	}
}

db.start({
	name: "msart",
	collections: [
		"internal"
	]
}, function () {

	if(db.db.internal) {
		db.db.internal.findOne({_id : 0}, function (err, res) {
			if(err) {
				print_fail(err);
				process.exit(0);
			} else {
				check_run(res ? res.version : 1.0);
			}
		});
	} else {
		check_run(1.0);
	}

});