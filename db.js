"use strict";

const MongoClient = require("mongodb").MongoClient;

let client = null;
let db = null;
let local_exports = {
  init: async info => {
    client = await MongoClient.connect(info.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    db = client.db(info.name);

    let collection_promisses = [];
    collection_promisses.length = info.collections.length;
    for (let i in info.collections) {
      collection_promisses[i] = db.createCollection(info.collections[i]);
    }

    let collections = await Promise.all(collection_promisses);
    for (let i in info.collections) {
      const sections = info.collections[i].split(".");
      let curr = local_exports;
      for (let j = 0; j < sections.length; ++j) {
        const key = sections[j];
        if (j + 1 < sections.length) {
          if (!(key in curr)) {
            curr[key] = {};
          }
          curr = curr[key];
        } else {
          curr[key] = collections[i];
        }
      }
    }
    local_exports.__native_handle = db;
  }
};

exports = module.exports = local_exports;
