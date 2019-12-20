"use strict";

var db = require("../db"),
  ObjectID = require("mongodb").ObjectID,
  check = require("./validate");

exports.load = function(callback) {
  db.db.gallery
    .find({})
    .sort({ index: 1 })
    .toArray(function(err, res) {
      if (err) {
        callback({ status: false, error: err });
      } else {
        for (var i = 0; i < res.length; ++i) {
          res[i].id = res[i]._id;
          delete res[i]._id;
        }
        callback({ status: true, result: res });
      }
    });
};

exports.save = function(data, callback) {
  var res = check.run(data, {
    type: check.TYPE.OBJECT,
    properties: {
      id: {
        type: check.TYPE.VALUE,
        class: "String",
        regex: "$ObjectID"
      }
    }
  });

  if (res.status) {
    data = res.data;

    db.db.gallery.count(function(err, count) {
      if (err) {
        callback({ status: false, error: err2 });
      } else {
        db.db.gallery.insert(
          { _id: data.id.toObjectID(), index: count },
          function(err2, res) {
            if (err) {
              callback({ status: false, error: err2 });
            } else {
              callback({ status: true, id: data.id });
            }
          }
        );
      }
    });
  } else {
    callback(res);
  }
};

exports.delete = function(data, callback) {
  var res = check.run(data, {
    type: check.TYPE.OBJECT,
    properties: {
      id: {
        type: check.TYPE.VALUE,
        class: "String",
        regex: "$ObjectID"
      }
    }
  });

  if (res.status) {
    data = res.data;
    db.db.gallery.remove({ _id: data.id.toObjectID() }, function(err) {
      if (err) {
        callback({ status: false, error: err });
      } else {
        callback({ status: true });
      }
    });
  } else {
    callback(res);
  }
};

exports.move = function(data, callback) {
  var res = check.run(data, {
    type: check.TYPE.OBJECT,
    properties: {
      source: {
        type: check.TYPE.VALUE,
        class: "String",
        regex: "$ObjectID"
      },
      target: {
        type: check.TYPE.VALUE,
        class: "String",
        regex: "$ObjectID"
      },
      offset: {
        type: check.TYPE.VALUE,
        class: "Number",
        value: "0|1",
        convert: true
      }
    }
  });

  if (res.status) {
    data = {
      source: res.data.source.toObjectID(),
      target: res.data.target.toObjectID(),
      offset: res.data.offset
    };

    exports.load(function(res) {
      if (res.status && res.result.length > 0) {
        var items = res.result;

        var src_idx = null,
          trg_idx = null;
        for (var i = 0; i < items.length; i++) {
          if (items[i].id.equals(data.source)) {
            src_idx = i;
            if (trg_idx != null) {
              break;
            }
            continue;
          }
          if (items[i].id.equals(data.target)) {
            trg_idx = i;
            if (src_idx != null) {
              break;
            }
          }
        }

        var src = items[src_idx];
        items.splice(src_idx, 1);

        if (src_idx < trg_idx) {
          trg_idx--;
        }
        items.splice(trg_idx + data.offset, 0, src);

        var bulk = db.db.gallery.initializeUnorderedBulkOp();
        for (var i = 0; i < items.length; i++) {
          bulk.find({ _id: items[i].id }).updateOne({ $set: { index: i } });
        }
        bulk.execute(function(err2, res2) {
          if (err2) {
            callback({ status: false, error: err2 });
          } else {
            callback({ status: true });
          }
        });
      } else {
        callback(res);
      }
    });
  } else {
    callback(res);
  }
};
