"use strict";

const db = require("../db");

exports.setPageData = async (type, data) => {
  console.log("setPageData", type, data);
  return db.generic.updateOne(
    { _id: type },
    { $set: { data: data } },
    { upsert: true }
  );
};

exports.loadPageData = async type => {
  console.log("loadPageData", type);
  const res = await db.generic.findOne({ _id: type }, { data: 1 });
  return res ? res.data : {};
};
