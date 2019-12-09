const db = require("../db");
const ObjectID = require("mongodb").ObjectID;

exports.getCategories = async type => {
  const categories = await db.categories
    .find(
      { type: type, published: true },
      { _id: 1, thumb: 1, caption: 1, description: 1, updated: 1 }
    )
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

exports.addCategory = async data => {
  console.log("addCategory", data);
  return db.categories.insertOne({
    type: data.type,
    thumb: ObjectID(data.thumb),
    caption: data.caption,
    description: data.description,
    published: data.published,
    updated: Date.now()
  });
};

exports.updateCategory = async data => {
  return db.categories.updateOne(
    { _id: ObjectID(data.id) },
    {
      $set: {
        thumb: ObjectID(data.thumb),
        caption: data.caption,
        description: data.description,
        published: data.published,
        updated: Date.now()
      }
    }
  );
};

exports.deleteCatagory = async data => {
  return db.categories.deleteOne({ _id: ObjectID(data.id) });
};
