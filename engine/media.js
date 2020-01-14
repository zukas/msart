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
    videoUrls.map(video => ({
      updateOne: {
        filter: {
          url: video.url,
          caption: video.caption
        },
        upsert: true,
        update: {
          $set: {
            url: video.url,
            caption: video.caption
          }
        }
      }
    }))
  );
};

exports.fetchStoredMedia = async elems => {
  let imageQuery = {};
  let videoQuery = {};
  if (elems) {
    elems.forEach(elem => {
      if (elem.type == "image") {
        if ("_id" in imageQuery) {
          imageQuery["_id"]["$in"].push(ObjectID(elem.id));
        } else {
          imageQuery = { _id: { $in: [ObjectID(elem.id)] } };
        }
      } else if (elem.type == "video") {
        if ("_id" in videoQuery) {
          videoQuery["_id"]["$in"].push(ObjectID(elem.id));
        } else {
          videoQuery = { _id: { $in: [ObjectID(elem.id)] } };
        }
      }
    });
  }

  console.log("imageQuery", imageQuery);
  console.log("videoQuery", videoQuery);

  const images = db.images.files
    .find(imageQuery, { filename: 1, caption: 1 })
    .toArray();
  const videos = db.videos.find(videoQuery, { url: 1, caption: 1 }).toArray();

  const resolve = await Promise.all([images, videos]);

  if (elems) {
    let query = {
      images: {},
      videos: {}
    };
    console.log(resolve);
    resolve[0].forEach(elem => {
      query.images[elem._id] = {
        filename: elem.filename,
        caption: elem.caption
      };
    });
    resolve[1].forEach(elem => {
      query.videos[elem._id] = {
        url: elem.url,
        caption: elem.caption
      };
    });

    elems.forEach(elem => {
      if (elem.type == "image" && query.images[elem.id]) {
        elem.filename = query.images[elem.id].filename;
        elem.caption = query.images[elem.id].caption;
      } else if (elem.type == "video" && query.videos[elem.id]) {
        elem.url = query.videos[elem.id].url;
        elem.caption = query.videos[elem.id].caption;
      }
    });
    return elems;
  } else {
    let res = { images: [], videos: [] };
    resolve[0].forEach(elem => {
      res.images.push({
        id: elem._id,
        filename: elem.filename,
        caption: elem.caption
      });
    });

    resolve[1].forEach(elem => {
      res.videos.push({ id: elem._id, url: elem.url, caption: elem.caption });
    });
    return res;
  }
};

exports.updateMediaMetadata = async data => {
  let imageWrites = [];
  let videoWrites = [];
  data.forEach(elem => {
    if (elem.type == "image") {
      imageWrites.push({
        updateOne: {
          filter: { _id: ObjectID(elem.id) },
          update: { $set: { caption: elem.caption } }
        }
      });
    } else if (elem.type == "video") {
      videoWrites.push({
        updateOne: {
          filter: { _id: ObjectID(elem.id) },
          update: { $set: { caption: elem.caption } }
        }
      });
    }
  });

  let promises = [];
  if (imageWrites.length > 0) {
    promises.push(db.images.files.bulkWrite(imageWrites, { ordered: false }));
  }
  if (videoWrites.length > 0) {
    promises.push(db.videos.bulkWrite(videoWrites, { ordered: false }));
  }

  return Promise.all(promises);
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

exports.loadImage = async (id, toPng, width, height) => {
  const objId = new ObjectID(id);
  width = width ? parseInt(width) : null;
  height = height ? parseInt(height) : null;

  const bucket = new GridFSBucket(db.__native_handle, {
    bucketName: "images"
  });
  const readStream = bucket.openDownloadStream(objId);
  const sharpPipeline = toPng
    ? sharp()
        .resize(width, height)
        .png()
    : sharp()
        .resize(width, height)
        .webp();
  return readStream.pipe(sharpPipeline);
};
