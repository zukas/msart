"use strict";

const config = require("../config")();
const media = require("./media");
const categories = require("./categories");
const shop = require("./shop");
const blog = require("./blog");
const gallery = require("./gallery");
const user = require("./user");
const generic = require("./generic");

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
  if (req.session.admin) {
    Promise.all([generic.loadPageData("about"), media.fetchStoredMedia()])
      .then(data => {
        let renderData = deafultData(req);
        renderData.data = data[0];
        renderData.images = data[1].images;
        renderData.videos = data[1].videos;
        res.render("about.html", renderData);
      })
      .catch(e => {
        console.log("categories load error =", e);
        res.render("about.html", deafultData(req));
      });
  } else {
    generic
      .loadPageData("about")
      .then(data => {
        let renderData = deafultData(req);
        renderData.data = data;
        res.render("about.html", renderData);
      })
      .catch(e => {
        console.log("categories load error =", e);
        res.render("about.html", deafultData(req));
      });
  }
};

exports.contact = async (req, res) => {
  res.render("contact.html", deafultData(req));
};

exports.updatePageData = async (req, res) => {
  const type = req.params[0];
  console.log("updatePageData", type);
  generic
    .setPageData(type, req.body)
    .then(() => {
      res.send({ msg: "Done" });
    })
    .catch(e => {
      console.log("updatePageData error =", e);
      res.send({ msg: "Error" });
    });
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
  console.log("deleteCategory", type, id);
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

exports.deleteGalleryCategory = async (req, res) => {
  const type = req.params[0];
  const id = req.params[1];
  console.log("deleteGalleryCategory", type, id);
  categories
    .deleteCatagory(id)
    .then(() => res.redirect(`/${type}`))
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

exports.deleteItem = async (req, res) => {
  const type = req.params[0];
  const id = req.params[1];

  const category =
    req.session.navigation && req.session.navigation.root == type
      ? req.session.navigation.category
      : null;

  console.log("deleteItem", type, id, category);

  target[type]
    .deleteItem(id)
    .then(() => res.redirect(`/${type}/category/${category}`))
    .catch(() => res.redirect(`/${type}/category/${category}`));
};

exports.categoryItems = async (req, res) => {
  const type = req.params[0];
  const category = req.params[1];
  console.log("categoryItems", type, category);
  Promise.all([
    target[type].getItems(category, true),
    categories.getCategories(type, true),
    categories.getCategory(category, type, true)
  ])
    .then(data => {
      console.log(data);

      req.session.navigation = { root: type, category: category };

      let renderData = deafultData(req);
      renderData.id = category;
      renderData.header = data[2].caption;
      renderData.items = data[0];
      renderData.categories = data[1];
      res.render(`${type}CategoryItems.html`, renderData);
    })
    .catch(e => {
      console.log(e);
      let renderData = deafultData(req);
      renderData.id = null;
      renderData.header = null;
      renderData.items = [];
      renderData.categories = [];
      res.render(`${type}CategoryItems.html`, renderData);
    });
};

exports.galleryCategoryItems = async (req, res) => {
  const id = req.params[0];
  Promise.all([
    categories.getCategory(id, "gallery", true),
    categories.getCategories("gallery", true)
  ])
    .then(data => {
      console.log(data);
      media
        .fetchStoredMedia(data[0].gallery)
        .then(gallery => {
          console.log(gallery);
          let renderData = deafultData(req);
          renderData.id = data[0].id;
          renderData.header = data[0].caption;
          renderData.gallery = gallery;
          renderData.categories = data[1];
          res.render(`galleryCategoryItems.html`, renderData);
        })
        .catch(e => {
          console.log(e);
          let renderData = deafultData(req);
          renderData.id = null;
          renderData.gallery = [];
          res.render(`galleryCategoryItems.html`, renderData);
        });
    })
    .catch(e => {
      console.log(e);
      let renderData = deafultData(req);
      renderData.id = null;
      renderData.gallery = [];
      res.render(`galleryCategoryItems.html`, renderData);
    });
};

const resolveCommonItemData = async req => {
  const type = req.params[0];
  const id = req.params[1];
  console.log("resolveCommonItemData", type, id);
  const category =
    req.session.navigation && req.session.navigation.root == type
      ? req.session.navigation.category
      : null;

  const requests = category
    ? [target[type].getItem(id), target[type].getItems(category, true)]
    : [target[type].getItem(id)];

  const requestData = await Promise.all(requests);
  return {
    id: id,
    type: type,
    category: category,
    item: requestData[0],
    items: category ? requestData[1] : null
  };
};

exports.shopItem = async (req, res) => {
  resolveCommonItemData(req)
    .then(data => {
      console.log("shopItem", data);
      media
        .fetchStoredMedia(data.item.gallery)
        .then(gallery => {
          console.log(gallery);
          data.item.gallery = gallery;
          let renderData = deafultData(req);
          renderData.item = data.item;
          renderData.category = data.category;
          renderData.items = data.items;
          res.render(`${data.type}Item.html`, renderData);
        })
        .catch(e => {
          console.log(e);
          res.send({ msg: "Error", success: false });
        });
    })
    .catch(e => {
      console.log(e);
      res.send({ msg: "Error", success: false });
    });
};

const resolveBlogGallerySections = async sections => {
  const loopups = sections
    .map((item, idx) => {
      return { idx: idx, item: item };
    })
    .filter(elem => {
      return elem.item.type == "gallery";
    });
  const promises = loopups.map(elem => {
    return media.fetchStoredMedia(elem.item.data);
  });
  const galleryArray = await Promise.all(promises);
  return galleryArray.map((galleryItem, idx) => {
    return { idx: loopups[idx].idx, gallery: galleryItem };
  });
};

exports.blogItem = async (req, res) => {
  resolveCommonItemData(req)
    .then(data => {
      console.log("blogItem", data);
      resolveBlogGallerySections(data.item.sections)
        .then(galleryData => {
          galleryData.forEach(galleryItem => {
            data.item.sections[galleryItem.idx].data = galleryItem.gallery;
          });
          let renderData = deafultData(req);
          renderData.item = data.item;
          renderData.category = data.category;
          renderData.items = data.items;
          res.render(`${data.type}Item.html`, renderData);
        })
        .catch(e => {
          console.log(e);
          res.send({ msg: "Error", success: false });
        });
    })
    .catch(e => {
      console.log(e);
      res.send({ msg: "Error", success: false });
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
  media
    .loadImage(req.params.id, toPng, req.query.width, req.query.height)
    .then(stream => {
      res.writeHead(200, {
        "Content-Type": toPng ? "image/webp" : "image/webp",
        "Cache-Control": "no-transform,public,max-age=86400"
      });
      stream.pipe(res);
    })
    .catch(e => {
      console.log("Failed to load image", req.params.id, e);
      res.sendFile(`${req.app.locals.basePath}/public/images/error.png`);
    });
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

exports.updateMedia = async (req, res) => {
  media
    .updateMediaMetadata(req.body)
    .then(() => res.send({ msg: "Done", success: true }))
    .catch(e => {
      console.log(e);
      res.send({ msg: "Error", success: false });
    });
};
