const config = require("../config");
const media = require("./media");

const deafultData = req => {
  // console.log(req.useragent);
  return {
    admin: req.session.admin || true,
    lenguage: req.session.lang || "en",
    ua: req.useragent,
    debug: config.debug || true,
    map_key: config.google_maps || null
  };
};

exports.index = async (req, res) => {
  if (/*req.session.admin*/ true) {
    this.manager(req, res);
  } else {
    this.about(req, res);
  }
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

exports.blog = async (req, res) => {
  res.render("blog.html", deafultData(req));
};

exports.shop = async (req, res) => {
  res.render("shop.html", deafultData(req));
};

exports.gallery = async (req, res) => {
  res.render("gallery.html", deafultData(req));
};

exports.contact = async (req, res) => {
  res.render("contact.html", deafultData(req));
};

exports.blogGroup = async (req, res) => {
  res.render("blog-group.html", deafultData(req));
};

exports.blogItem = async (req, res) => {
  res.render("blog-item.html", deafultData(req));
};

exports.shopGroup = async (req, res) => {
  res.render("shop-group.html", deafultData(req));
};

exports.shopItem = async (req, res) => {
  res.render("shop-item.html", deafultData(req));
};

exports.shopGroupTemplate = async (req, res) => {
  res.render("new-shop-group.html", deafultData(req));
};

exports.shopItemTemplate = async (req, res) => {
  res.render("new-shop-item.html", deafultData(req));
};

exports.galleryGroup = async (req, res) => {
  res.render("gallery-group.html", deafultData(req));
};

exports.galleryItem = async (req, res) => {
  res.render("gallery-item.html", deafultData(req));
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
  media.loadImage(res, req.params.id, toPng, req.query.width, req.query.height);
};
