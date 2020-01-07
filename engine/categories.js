"use strict";

const db = require("../db");
const ObjectID = require("mongodb").ObjectID;

exports.getCategories = async (type, all) => {
  const query = (() => {
    let temp = { type: type };
    if (!all) {
      temp.published = true;
    }
    return temp;
  })();

  const categories = await db.categories
    .find(query, { _id: 1, thumb: 1, caption: 1, description: 1, updated: 1 })
    .toArray();

  console.log("getCategories", categories);
  return categories.map(item => {
    return {
      id: item._id,
      thumb: item.thumb,
      caption: item.caption,
      description: item.description,
      updated: item.updated
    };
  });
};

exports.getCategory = async (id, type, all) => {
  if (id == "none") {
    return { id: "none" };
  }
  const query = (() => {
    let temp = { _id: ObjectID(id), type: type };
    if (!all) {
      temp.published = true;
    }
    return temp;
  })();
  console.log(query);
  let category = await db.categories.findOne(query, {
    _id: 1,
    thumb: 1,
    caption: 1,
    description: 1,
    gallery: 1,
    updated: 1
  });

  category["id"] = category["_id"];
  delete category["_id"];

  console.log("getCategory", category);
  return category;
};

exports.addCategory = async data => {
  console.log("addCategory", data);
  return db.categories.insertOne({
    type: data.type,
    thumb: ObjectID(data.thumb),
    caption: data.caption,
    description: data.description,
    gallery: data.gallery,
    published: data.published,
    updated: Date.now()
  });
};

exports.updateCategory = async data => {
  console.log("updateCategory", data);
  return db.categories.updateOne(
    { _id: ObjectID(data.id) },
    {
      $set: {
        thumb: ObjectID(data.thumb),
        caption: data.caption,
        description: data.description,
        gallery: data.gallery,
        published: data.published,
        updated: Date.now()
      }
    }
  );
};

exports.deleteCatagory = async id => {
  return db.categories.deleteOne({ _id: ObjectID(id) });
};
