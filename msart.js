"use strict";

process.env.NODE_ENV = "production";
process.env.EXPRESS_ENV = "production";

var config 			= require('./config')(),
	express 		= require('express'),
	favicon 		= require('serve-favicon'),
	logger 			= require('morgan'),
	path 			= require('path'),
	methodOverride 	= require('method-override'),
	session 		= require('express-session'),
	ssm 			= require('connect-mongodb-session')(session), 
	bodyParser 		= require('body-parser'),
	multer 			= require('multer'),
	swig 			= require('swig'),
	device 			= require('express-device'),
	errorHandler 	= require('errorhandler'),
	db 				= require("./db"),
	app 			= express(),
	http 			= require('http'),
	https 			= require('https'),
	fs 				= require('fs'),
	forceSSL 		= require('express-force-ssl'),
	engine 			= require('./engine'),
	cors 			= require('cors'),
	compression 	= require('compression'),
	server 			= null,
	secureServer 	= null,
	session_store 	= new ssm(			
	{ 
    	uri: 'mongodb://localhost:27017/msart',
    	collection: 'sessions'
	}),
	session_manager = session({ 
				store: session_store,
				resave: true,
                saveUninitialized: true,
                domain: config.domain,
                secure: config.session.secure,
                secret: config.session.secret,
                sameSite: true });

require("./utils");


if(config.logging) {
	enableLog();
}

server = http.createServer(app);
if(config.ssl) {
	var ssl_opt = {
		key: fs.readFileSync(config.privateKey),
  		cert: fs.readFileSync(config.publicKey),
  		ca: fs.readFileSync(config.chainKey)
	}
	secureServer = https.createServer(ssl_opt, app);
	app.use(forceSSL);
}

// all environments
app.engine('html', swig.renderFile);
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'html');
app.set('view cache', true);
app.use(compression());
app.use(favicon(__dirname + '/public/favicons/favicon.ico'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ inMemory : true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(device.capture());
app.use(engine.session_update);

// swig.setDefaults({ cache: 'memory' });
swig.setDefaults({ cache: 'memory' });
// development only

engine.track_sessions(session_store);

app.get('/', session_manager, engine.index);
app.get('/admin',session_manager, engine.login);
app.get('/async/images/load/:id', engine.load_image);
app.get('/async/preview/load/:id', engine.load_small_image);
app.get('/async/thumb/load/:id', engine.load_thumb_image);

app.post('/async/user/login',session_manager, engine.do_login);
app.post('/async/images/list',session_manager, engine.list_images);
app.post('/async/images/save',session_manager, engine.save_image);
app.post('/async/images/delete',session_manager, engine.delete_image);

app.post('/async/about/save',session_manager, engine.save_about);
app.post('/async/about/load',session_manager, engine.load_about);

app.post('/async/shop/list',session_manager, engine.list_shop_item);
app.post('/async/shop/save',session_manager, engine.save_shop_item);
app.post('/async/shop/load',session_manager, engine.load_shop_item);
app.post('/async/shop/delete',session_manager, engine.delete_shop_item);

app.post('/async/category/save',session_manager, engine.save_category);
app.post('/async/category/delete',session_manager, engine.delete_category);
app.post('/async/category/list',session_manager, engine.categories);

app.post("/async/orders/add",session_manager, engine.order_add);
app.post("/async/orders/remove",session_manager, engine.order_remove);
app.post("/async/orders/session",session_manager, engine.order_session);

app.post("/async/payment/types", engine.payment_types);

app.post("/async/orders/shipping",session_manager, engine.order_shipping);
app.post("/async/orders/pay_paypal",session_manager, engine.order_pay_paypal);
app.post("/async/orders/pay_card",session_manager, engine.order_pay_card);
app.get("/async/orders/process",session_manager, cors(), engine.order_process);

app.all("/async/paypal/accept",session_manager, engine.paypal_return);
app.all("/async/paypal/cancel",session_manager, engine.paypal_cancel);

app.post('/async/gallery/load',session_manager, engine.load_gallery);
app.post('/async/gallery/save',session_manager, engine.save_gallery_item);
app.post('/async/gallery/delete',session_manager, engine.delete_gallery_item);
app.post('/async/gallery/swap',session_manager, engine.swap_gallery);

app.post('/async/contact', engine.contact);

app.post('/async/user/logout',session_manager, engine.do_logout);
app.get('/logout',session_manager, engine.do_logout);

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
		"access",
		"internal",
		"archive"
	]
}, function () {
	if(secureServer) {
		secureServer.listen(443)
	}
	server.listen(app.get("port"));
});
