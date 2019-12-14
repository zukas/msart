const db = require("../db");
const ObjectID = require("mongodb").ObjectID;

exports.getItem = async id => {
  let item = await db.shop.findOne({ _id: ObjectID(id) });
  item["id"] = item["_id"];
  delete item["_id"];
  console.log("getItem", item);
  return item;
};

exports.getItems = async (category, admin) => {
  let query = {};
  query["categories"] =
    category == "none" ? { $size: 0 } : { $in: [ObjectID(category)] };
  if (!admin) {
    query["published"] = true;
  }

  const items = await db.shop
    .find(query, {
      _id: 1,
      thumb: 1,
      caption: 1,
      price: 1,
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
      price: item.price,
      updated: item.updated,
      published: item.published
    };
  });
};

exports.addItem = async data => {
  console.log("addItem", data);
  return db.shop.insertOne({
    thumb: ObjectID(data.thumb),
    caption: data.caption,
    description: data.description,
    price: data.price,
    gallery: data.gallery || [],
    categories: (data.categories || []).map(c => ObjectID(c)),
    published: data.published,
    updated: Date.now()
  });
};

exports.updateItem = async data => {
  return db.shop.updateOne(
    { _id: ObjectID(data.id) },
    {
      $set: {
        thumb: ObjectID(data.thumb),
        caption: data.caption,
        description: data.description,
        price: data.price,
        gallery: data.gallery || [],
        categories: (data.categories || []).map(c => ObjectID(c)),
        published: data.published,
        updated: Date.now()
      }
    }
  );
};

exports.deleteItem = async id => {
  return db.shop.deleteOne({ _id: ObjectID(id) });
};

exports.removeCategory = async id => {
  return db.shop.update(
    {},
    { $pullAll: { categories: [ObjectID(id)] } },
    { multi: true }
  );
};
