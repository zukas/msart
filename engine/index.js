"use strict";

const config = require("../config")();
const media = require("./media");
const categories = require("./categories");
const shop = require("./shop");
const blog = require("./blog");
const gallery = require("./gallery");
const user = require("./user");

const target = {
  shop: shop,
  blog: blog,
  gallery: gallery
};

const deafultData = req => {
  console.log(config);
  return {
    admin: req.session.admin || false,
    lenguage: req.session.lang || "en",
    ua: req.useragent,
    debug: config.debug || false,
    map_key: config.google_maps || null
  };
};

exports.index = async (req, res) => {
  let renderData = deafultData(req);
  if (renderData.admin) {
    this.manager(req, res);
  } else {
    this.about(req, res);
  }
};

exports.login = async (req, res) => {
  let renderData = deafultData(req);
  if (renderData.admin) {
    res.redirect("/manager");
  } else if (renderData.username) {
    res.redirect("/");
  } else {
    res.render("login.html", renderData);
  }
};

exports.logout = async (req, res) => {
  req.session.destroy();
  req.session = null;
  res.redirect("/");
};

exports.doLogin = async (req, res) => {
  console.log("doLogin", req.body);
  user
    .doLogin(req.body)
    .then(u => {
      console.log(u);
      if (u) {
        req.session.username = u._id;
        req.session.forename = u.forename;
        req.session.surname = u.surname;
        req.session.admin = u.admin;
        res.send({ msg: "Success", success: true });
      } else {
        res.send({ msg: "Error", success: false });
      }
    })
    .catch(e => {
      console.log(e);
      res.send({ msg: "Error", success: false });
    });
};

exports.manager = async (req, res) => {
  media
    .fetchStoredMedia()
    .then(media => {
      console.log(media);
      let renderData = deafultData(req);
      renderData.images = media.images;
      renderData.videos = media.videos;
      res.render("manager.html", renderData);
    })
    .catch(e => {
      console.log("manager load error =", e);
      let renderData = deafultData(req);
      renderData.images = [];
      renderData.videos = [];
      res.render("manager.html", renderData);
    });
};

exports.about = async (req, res) => {
  res.render("about.html", deafultData(req));
};

exports.contact = async (req, res) => {
  res.render("contact.html", deafultData(req));
};

exports.categories = async (req, res) => {
  const type = req.params[0];
  console.log("categories", type);
  categories
    .getCategories(type, true)
    .then(items => {
      console.log(items);
      let renderData = deafultData(req);
      renderData.target = type;
      renderData.categories = items;
      res.render("categories.html", renderData);
    })
    .catch(e => {
      console.log("categories load error =", e);
      let renderData = deafultData(req);
      renderData.target = type;
      renderData.categories = [];
      res.render("categories.html", renderData);
    });
};

exports.newCategory = async (req, res) => {
  const type = req.params[0];
  console.log("newCategory", type);
  media
    .fetchStoredMedia()
    .then(media => {
      console.log(media);
      let renderData = deafultData(req);
      renderData.images = media.images;
      renderData.videos = media.videos;
      renderData.target = type;
      res.render("categoryNew.html", renderData);
    })
    .catch(e => {
      console.log("manager load error =", e);
      let renderData = deafultData(req);
      renderData.images = [];
      renderData.videos = [];
      renderData.target = type;
      res.render("categoryNew.html", renderData);
    });
};

exports.editCategory = async (req, res) => {
  const type = req.params[0];
  const id = req.params[1];
  console.log("editCategory", type);
  Promise.all([
    media.fetchStoredMedia(),
    categories.getCategory(id, type, true)
  ])
    .then(data => {
      console.log(data);
      let renderData = deafultData(req);
      renderData.category = data[1];
      renderData.images = data[0].images;
      renderData.videos = data[0].videos;
      renderData.target = type;
      res.render("categoryNew.html", renderData);
    })
    .catch(e => {
      console.log("manager load error =", e);
      let renderData = deafultData(req);
      renderData.images = [];
      renderData.videos = [];
      renderData.target = type;
      res.render("categoryNew.html", renderData);
    });
};

exports.deleteCategory = async (req, res) => {
  const type = req.params[0];
  const id = req.params[1];
  target[type]
    .removeCategory(id)
    .then(() => {
      categories
        .deleteCatagory(id)
        .then(() => res.redirect(`/${type}`))
        .catch(() => res.redirect(`/${type}`));
    })
    .catch(() => res.redirect(`/${type}`));
};

exports.createCategory = async (req, res) => {
  let data = req.body;
  data.type = req.params[0];
  categories
    .addCategory(data)
    .then(() => res.send({ msg: "Done" }))
    .catch(() => res.send({ msg: "Error" }));
};

exports.updateCategory = async (req, res) => {
  let data = req.body;
  data.type = req.params[0];
  categories
    .updateCategory(data)
    .then(() => res.send({ msg: "Done" }))
    .catch(() => res.send({ msg: "Error" }));
};

exports.newItem = async (req, res) => {
  const type = req.params[0];
  Promise.all([media.fetchStoredMedia(), categories.getCategories(type)])
    .then(data => {
      console.log(data);
      let renderData = deafultData(req);
      renderData.images = data[0].images;
      renderData.videos = data[0].videos;
      renderData.categories = data[1];
      res.render(`${type}NewItem.html`, renderData);
      console.log(renderData);
    })
    .catch(e => {
      console.log("manager load error =", e);
      let renderData = deafultData(req);
      renderData.images = [];
      renderData.videos = [];
      renderData.categories = [];
      res.render(`${type}NewItem.html`, renderData);
    });
};

exports.createItem = async (req, res) => {
  const type = req.params[0];
  console.log("createItem", type, req.body);
  target[type]
    .addItem(req.body)
    .then(() => res.send({ msg: "Done" }))
    .catch(() => res.send({ msg: "Error" }));
};

exports.updateItem = async (req, res) => {
  const type = req.params[0];
  console.log("updateItem", type, req.body);
  target[type]
    .updateItem(req.body)
    .then(() => res.send({ msg: "Done" }))
    .catch(() => res.send({ msg: "Error" }));
};

exports.categoryItems = async (req, res) => {
  const type = req.params[0];
  const category = req.params[1];
  console.log("categoryItems", type, category);
  target[type]
    .getItems(category, true)
    .then(items => {
      console.log(items);
      let renderData = deafultData(req);
      renderData.id = category;
      renderData.items = items;
      res.render(`${type}CategoryItems.html`, renderData);
    })
    .catch(e => {
      console.log(e);
      let renderData = deafultData(req);
      renderData.id = null;
      renderData.items = [];
      res.render(`${type}CategoryItems.html`, renderData);
    });
};

exports.galleryCategoryItems = async (req, res) => {
  const id = req.params[0];
  categories
    .getCategory(id, "gallery", true)
    .then(data => {
      console.log(data);
      let renderData = deafultData(req);
      renderData.id = data.id;
      renderData.gallery = data.gallery;
      res.render(`galleryCategoryItems.html`, renderData);
    })
    .catch(e => {
      console.log(e);
      let renderData = deafultData(req);
      renderData.id = null;
      renderData.gallery = [];
      res.render(`galleryCategoryItems.html`, renderData);
    });
};

exports.item = async (req, res) => {
  const type = req.params[0];
  const id = req.params[1];

  console.log("item", type, id);
  target[type]
    .getItem(id)
    .then(data => {
      console.log(data);
      let renderData = deafultData(req);
      renderData.item = data;
      res.render(`${type}Item.html`, renderData);
    })
    .catch(() => {
      res.send({ msg: "Error" });
    });
};

exports.editItem = async (req, res) => {
  const type = req.params[0];
  const id = req.params[1];

  Promise.all([
    media.fetchStoredMedia(),
    categories.getCategories(type),
    target[type].getItem(id)
  ])
    .then(data => {
      console.log(data);
      let renderData = deafultData(req);
      renderData.images = data[0].images;
      renderData.videos = data[0].videos;
      renderData.categories = data[1];
      renderData.item = data[2];
      res.render(`${type}NewItem.html`, renderData);
      console.log(renderData);
    })
    .catch(e => {
      console.log("manager load error =", e);
      let renderData = deafultData(req);
      renderData.images = [];
      renderData.videos = [];
      renderData.categories = [];
      renderData.item = {};
      res.render(`${type}NewItem.html`, renderData);
    });
};

exports.uploadImages = async (req, res) => {
  media
    .storeImages(req.files)
    .then(() => res.send({ msg: "Done" }))
    .catch(() => res.send({ msg: "Error" }));
};

exports.uploadVideos = async (req, res) => {
  console.log("uploadVideos", req.body);
  media
    .storeVideos(req.body.videos)
    .then(() => res.send({ msg: "Done" }))
    .catch(() => res.send({ msg: "Error" }));
};

exports.loadImage = async (req, res) => {
  const toPng = false;
  res.writeHead(200, {
    "Content-Type": toPng ? "image/webp" : "image/webp",
    "Cache-Control": "no-transform,public,max-age=86400"
  });
  media
    .loadImage(res, req.params.id, toPng, req.query.width, req.query.height)
    .then()
    .catch(e => console.log("Failed to load image", req.params.id, e));
};

exports.deleteMedia = async (req, res) => {
  media
    .removeStoredMedia(req.body)
    .then(() => res.send({ msg: "Done" }))
    .catch(e => {
      console.log(e);
      res.send({ msg: "Error" });
    });
};
