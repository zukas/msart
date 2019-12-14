"use strict";

const db = require("../db");
const ObjectID = require("mongodb").ObjectID;
const GridFSBucket = require("mongodb").GridFSBucket;
const sharp = require("sharp");
const stream = require("stream");
const util = require("util");

exports.storeImages = async files => {
  let promises = [];
  promises.length = files.length;

  const pipeline = util.promisify(stream.pipeline);
  const bucket = new GridFSBucket(db.__native_handle, { bucketName: "images" });

  files.forEach(file => {
    const uploadStream = bucket.openUploadStreamWithId(
      new ObjectID(),
      file.originalname
    );
    promises.push(
      pipeline(
        sharp(file.buffer)
          .resize({ width: 1600 })
          .webp({ lossless: true }),
        uploadStream
      )
    );
  });
  return Promise.all(promises);
};

exports.storeVideos = async videoUrls => {
  console.log(videoUrls);
  db.videos.bulkWrite(
    videoUrls.map(url => ({
      updateOne: {
        filter: { url: url },
        upsert: true,
        update: { $set: { url: url } }
      }
    }))
  );
};

exports.fetchStoredMedia = async () => {
  const bucket = new GridFSBucket(db.__native_handle, { bucketName: "images" });
  let res = { images: [], videos: [] };
  const images = bucket.find().toArray();
  const videos = db.videos.find({}, { url: 1 }).toArray();

  const resolve = await Promise.all([images, videos]);

  resolve[0].forEach(elem => {
    res.images.push({
      id: elem._id,
      filename: elem.filename,
      uploadDate: elem.uploadDate
    });
  });

  resolve[1].forEach(elem => {
    res.videos.push({ id: elem._id, url: elem.url });
  });
  return res;
};

exports.removeStoredMedia = async data => {
  const bucket = new GridFSBucket(db.__native_handle, { bucketName: "images" });
  console.log("removeStoredMedia", data);
  let promisses = data.images.map(id => {
    return bucket.delete(ObjectID(id));
  });
  promisses.push(
    db.videos.deleteMany({ _id: { $in: data.videos.map(id => ObjectID(id)) } })
  );
  await Promise.all(promisses);
};

exports.loadImage = async (outStream, id, toPng, width, height) => {
  const objId = new ObjectID(id);
  width = width ? parseInt(width) : null;
  height = height ? parseInt(height) : null;

  const bucket = new GridFSBucket(db.__native_handle, {
    bucketName: "images"
  });
  const readStream = bucket.openDownloadStream(objId);
  const pipeline = util.promisify(stream.pipeline);

  const sharpPipeline = toPng
    ? sharp()
        .resize(width, height)
        .png()
    : sharp()
        .resize(width, height)
        .webp();
  return pipeline(readStream, sharpPipeline, outStream);
};
