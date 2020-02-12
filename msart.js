"use strict";

const config = require("./config")();
const db = require("./db");
const process = require("process");
const favicon = require("serve-favicon");
const methodOverride = require("method-override");
const express = require("express");
const session = require("express-session");
const minifyHTML = require("express-minify-html");
const ssm = require("connect-mongodb-session")(session);
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const expressNunjucks = require("express-nunjucks");
const device_ua = require("express-useragent");
const app = express();
const http = require("http");
const https = require("https");
const fs = require("fs");
const forceSSL = require("express-force-ssl");
const compression = require("compression");
const path = require("path");
const basePath = path.dirname(process.argv[1]);

process.env.NODE_ENV = "production";
process.env.EXPRESS_ENV = "production";

const setupOptions = app => {
  app.locals.basePath = basePath;
  app.set("views", `${basePath}/public/views`);
  app.set("view engine", "html");
  app.set("view cache", !config.debug);
  app.use(compression());
  app.use(favicon(`${basePath}/public/favicons/favicon.ico`));
  app.use(express.static(`${basePath}/public`));
  app.use(methodOverride());
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(device_ua.express());

  if (config.ssl) {
    app.use(forceSSL);
  }

  const session_store = new ssm({
    uri: `${config.db.uri}/${config.db.name}`,
    collection: "sessions"
  });

  app.use(
    session({
      store: session_store,
      resave: true,
      saveUninitialized: true,
      domain: config.domain,
      secure: config.session.secure,
      secret: config.session.secret,
      sameSite: true
    })
  );

  app.use(
    minifyHTML({
      override: true,
      exception_url: false,
      htmlMinifier: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        minifyJS: true,
        minifyCSS: true
      }
    })
  );

  expressNunjucks(app, {
    watch: config.debug || true,
    noCache: config.debug ? true : false
  });
};

const setupRoutes = app => {
  const engine = require("./engine");
  app.get("/", engine.index);
  app.get("/login", engine.login);
  app.get("/logout", engine.logout);
  app.get("/manager", engine.manager);
  app.get("/about", engine.about);
  app.get("/contact", engine.contact);

  app.post("/login", engine.doLogin);

  app.post("/contact/send", engine.contact);

  app.post(/^\/(about|contact)\/set$/, engine.updatePageData);

  app.get(/^\/(shop|blog|gallery)$/, engine.categories);
  app.get(/^\/(shop|blog)\/category\/(none|[\w\d]{24})$/, engine.categoryItems);
  app.get(/^\/gallery\/category\/([\w\d]{24})$/, engine.galleryCategoryItems);
  app.get(/^\/(shop|blog|gallery)\/category\/new$/, engine.newCategory);
  app.get(
    /^\/(shop|blog|gallery)\/category\/edit\/([\w\d]{24})$/,
    engine.editCategory
  );
  app.get(
    /^\/(shop|blog)\/category\/delete\/([\w\d]{24})$/,
    engine.deleteCategory
  );
  app.get(
    /^\/(gallery)\/category\/delete\/([\w\d]{24})$/,
    engine.deleteGalleryCategory
  );
  app.post(/^\/(shop|blog|gallery)\/category\/create$/, engine.createCategory);
  app.post(/^\/(shop|blog|gallery)\/category\/update$/, engine.updateCategory);

  app.get(/^\/(shop|blog)\/item\/new$/, engine.newItem);
  app.get(/^\/(shop)\/item\/([\w\d]{24})$/, engine.shopItem);
  app.get(/^\/(blog)\/item\/([\w\d]{24})$/, engine.blogItem);
  app.get(/^\/(shop|blog)\/edit\/([\w\d]{24})$/, engine.editItem);
  app.get(/^\/(shop|blog)\/delete\/([\w\d]{24})$/, engine.deleteItem);
  app.post(/^\/(shop|blog)\/item\/create$/, engine.createItem);
  app.post(/^\/(shop|blog)\/item\/update$/, engine.updateItem);

  app.get("/image/:id", engine.loadImage);

  app.post(
    "/manager/upload/images",
    upload.array("images"),
    engine.uploadImages
  );
  app.post("/manager/upload/videos", engine.uploadVideos);

  app.post("/manager/delete/media", engine.deleteMedia);
  app.post("/manager/update/media", engine.updateMedia);
};

const createServer = async app => {
  if (config.ssl) {
    const files = await Promise.all([
      fs.readFile(config.privateKey),
      fs.readFile(config.publicKey),
      fs.readFile(config.chainKey)
    ]);

    const ssl_opt = {
      key: files[0],
      cert: files[1],
      ca: files[2]
    };
    return https.createServer(ssl_opt, app);
  } else {
    return http.createServer(app);
  }
};

const getServerPort = () => {
  return config.ssl ? 443 : process.env.PORT || 80;
};

(async () => {
  const [, server] = await Promise.all([db.init(config.db), createServer(app)]);

  setupOptions(app);
  setupRoutes(app);
  server.listen(getServerPort());
})()
  .then(() => {
    console.log("Setver started");
    console.log(db);
  })
  .catch(err => console.error(err));

// app.get('/', engine.index);
// app.get('/admin', engine.login);
// app.get('/async/images/load/:id', engine.load_image);
// app.get('/async/preview/load/:id', engine.load_small_image);
// app.get('/async/thumb/load/:id', engine.load_thumb_image);

// app.post('/async/user/login', engine.do_login);
// app.post('/async/images/list', engine.list_images);
// app.post('/async/images/save', engine.save_image);
// app.post('/async/images/delete', engine.delete_image);

// app.post('/async/about/save', engine.save_about);
// app.post('/async/about/load', engine.load_about);

// app.post('/async/workshop/list', engine.list_workshops);
// app.post('/async/workshop/save', engine.save_workshop);
// app.post('/async/workshop/load', engine.load_workshop);
// app.post('/async/workshop/delete', engine.delete_workshop);

// app.post('/async/shop/list', engine.list_shop_item);
// app.post('/async/shop/save', engine.save_shop_item);
// app.post('/async/shop/load', engine.load_shop_item);
// app.post('/async/shop/delete', engine.delete_shop_item);

// app.post('/async/category/save', engine.save_category);
// app.post('/async/category/delete', engine.delete_category);
// app.post('/async/category/list', engine.categories);

// app.post("/async/orders/add", engine.order_add);
// app.post("/async/orders/remove", engine.order_remove);
// app.post("/async/orders/session", engine.order_session);

// app.post("/async/payment/types", engine.payment_types);

// app.post("/async/orders/shipping", engine.order_shipping);
// app.post("/async/orders/pay_paypal", engine.order_pay_paypal);
// app.post("/async/orders/pay_card", engine.order_pay_card);
// app.get("/async/orders/process", engine.order_process);

// app.all("/async/paypal/accept", engine.paypal_return);
// app.all("/async/paypal/cancel", engine.paypal_cancel);

// app.post('/async/gallery/load', engine.load_gallery);
// app.post('/async/gallery/save', engine.save_gallery_item);
// app.post('/async/gallery/delete', engine.delete_gallery_item);
// app.post('/async/gallery/move', engine.move_gallery);

// app.post('/async/contact', engine.contact);

// app.post('/async/user/logout', engine.do_logout);
// app.get('/logout', engine.do_logout);

// app.get('*', function (req, res) {
// 	res.redirect('/');
// });

// const msartDB = Promise.resolve(db({
// 	name: "msart",
// 	collections: [
// 		"users",
// 		"images",
// 		"about",
// 		"workshops",
// 		"shop",
// 		"category",
// 		"orders",
// 		"order_details",
// 		"gallery",
// 		"history",
// 		"access",
// 		"internal",
// 		"archive"
// 	]
// }));

// console.log(msartDB);

// if (secureServer) {
// 	secureServer.listen(443);
// }
// else {
// 	server.listen(app.get("port"));
// }
