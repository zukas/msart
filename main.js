process.env.NODE_ENV = "production";
process.env.EXPRESS_ENV = "production";

var express = require('express'),
	favicon = require('serve-favicon'),
	logger = require('morgan'),
	path = require('path'),
	methodOverride = require('method-override'),
	session = require('express-session'),
	session_store_manager = require('connect-mongodb-session')(session), 
	bodyParser = require('body-parser'),
	multer = require('multer'),
	swig = require('swig'),
	device = require('express-device'),
	errorHandler = require('errorhandler'),
	db = require("./db"),
	app = express(),
	engine = require('./engine'),
	session_store = new session_store_manager(
	{ 
    	uri: 'mongodb://localhost:27017/msart',
    	collection: 'sessions'
	});

require("./utils");

global.isDev = function () {
	return 'development' === app.get('env');
}
// all environments
app.engine('html', swig.renderFile);
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'html');
app.set('view cache', true);
app.use(favicon(__dirname + '/public/images/ms_logo.ico'));
log(__dirname + '/public/images/ms_logo.ico');
app.use(methodOverride());
app.use(session({ 
				store: session_store,
				resave: true,
                saveUninitialized: true,
                secret: '4f6faqwec8g5x3v4v4sm1' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ inMemory : true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(device.capture());
app.use(engine.session_update);

// swig.setDefaults({ cache: 'memory' });
swig.setDefaults({ cache: false });
// development only
if (isDev()) {
  app.use(errorHandler());
}

engine.track_sessions(session_store);

app.get('/', engine.index);
app.get('/admin', engine.login);
app.get('/async/images/load/:id', engine.load_image);
app.get('/async/preview/load/:id', engine.load_small_image);
app.get('/async/thumb/load/:id', engine.load_thumb_image);

app.post('/async/user/login', engine.do_login);
app.post('/async/images/list', engine.list_images);
app.post('/async/images/save', engine.save_image);
app.post('/async/images/delete', engine.delete_image);

app.post('/async/about/save', engine.save_about);
app.post('/async/about/load', engine.load_about);

app.post('/async/shop/list', engine.list_shop_item);
app.post('/async/shop/save', engine.save_shop_item);
app.post('/async/shop/load', engine.load_shop_item);
app.post('/async/shop/delete', engine.delete_shop_item);
app.post('/async/shop/save_category', engine.save_shop_category);
app.post('/async/shop/delete_category', engine.delete_shop_category);

app.post("/async/orders/add", engine.order_add);
app.post("/async/orders/remove", engine.order_remove);
app.post("/async/orders/session", engine.order_session);
// app.post("/async/orders/checkout", engine.order_checkout);

app.post("/async/payment/types", engine.payment_types);

app.post("/async/orders/shipping", engine.order_shipping);
app.post("/async/orders/pay_paypal", engine.order_pay_paypal);
app.post("/async/orders/pay_card", engine.order_pay_card);
app.post("/async/orders/process", engine.order_process);

app.all("/async/paypal/accept", engine.paypal_return);
app.all("/async/paypal/cancel", engine.paypal_cancel);

// app.post("/async/shop/order", engine.create_order);

app.post('/async/gallery/load', engine.load_gallery);
app.post('/async/gallery/save', engine.save_gallery_item);
app.post('/async/gallery/delete', engine.delete_gallery_item);

app.post('/async/contact', engine.contact);


app.post('/async/user/logout', engine.do_logout);
app.get('/logout', engine.do_logout);

app.get('*', function (req, res) {
	res.redirect('/');
});

db.start({
	name: "msart",
	collections: [
		"users",
		"images",
		"about",
		"shop",
		"category",
		"orders",
		"order_details",
		"gallery",
		"history",
		"access"
	]
}, function () {
	app.listen(app.get('port'), function() {
	  	log('Express server listening on port ' + app.get('port'));
	});
});
