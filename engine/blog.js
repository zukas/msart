const db = require("../db");
const ObjectID = require("mongodb").ObjectID;

exports.getItem = async id => {
  let item = db.blog.findOne({ _id: ObjectID(id) });
  item["id"] = item["_id"];
  delete item["_id"];
  return item;
};

exports.getItems = async (category, admin) => {
  let query = {};
  query["categories"] = category == "none" ? { $size: 0 } : { $in: [category] };
  if (!admin) {
    query["published"] = true;
  }

  const items = await db.blog
    .find(query, {
      _id: 1,
      thumb: 1,
      caption: 1,
      description: 1,
      updated: 1,
      published: 1
    })
    .toArray();

  console.log("getItems", items);
  return items.map(item => {
    return {
      id: item._id,
      thumb: ObjectID(item.thumb),
      caption: item.caption,
      description: item.description,
      updated: item.updated,
      published: item.published
    };
  });
};

exports.addItem = async data => {
  console.log("addItem", data);
  return db.blog.insertOne({
    thumb: ObjectID(data.thumb),
    caption: data.caption,
    description: data.description,
    sections: data.sections || [],
    categories: data.categories || [],
    published: data.published,
    updated: Date.now()
  });
};

exports.updateItem = async data => {
  return db.blog.updateOne(
    { _id: ObjectID(data.id) },
    {
      $set: {
        thumb: ObjectID(data.thumb),
        caption: data.caption,
        description: data.description,
        sections: data.sections || [],
        categories: data.categories || [],
        published: data.published,
        updated: Date.now()
      }
    }
  );
};

exports.deleteItem = async data => {
  return db.blog.deleteOne({ _id: ObjectID(data.id) });
};
