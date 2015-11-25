
//app set up ========================================================================
var express         = require("express");
var path            = require("path");
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var mongoose        = require('mongoose');
var app             = express(); // express framework
var Disqus          = require('disqus'); // comments framework
var favicon         = require('express-favicon'); // favicon service


//passportJs set up ==================================

var passport		= require('passport');
var flash			= require('connect-flash');
var session			= require('express-session');
var morgan			= require('morgan');
var cookieParser	= require('cookie-parser');

//Port Config ========================================================================
var port = process.env.PORT || 3000; //bind to port 3000

// Disqus config
var disqus = new Disqus({
    api_secret : 'blceyt4mjocdtWmGh1F1W1pAgOvvKTIPJWL4aGC1uVkk5MMsc1r9tOMap6DQEhaT',
    api_key : 'FuFbTSoKxKoAwzl4G8SPs9gvZG2D9X17E0Di6YzxJpcAR7h3mXnIoWXWceoN1WOz',
    access_token : '87902e92c5d9425fa4be2a9663378c4d'
});

disqus.request('posts/list', { forum : 'idoson'}, function(data) {
    if (data.error) {
        console.log('Something went wrong...');
    } else {
      //  console.log(data);
      ;
    }
});

//DB config ==========================================================================
mongoose.connect('mongodb://admin:0@ds047474.mongolab.com:47474/crowdsourcing');
var db = mongoose.connection;

//print error to console if there error
db.on('error', console.error.bind(console, 'connection error:')); 

//print first time db opened
db.once('open', function (callback) {
  console.log("Logging in to the DB...")
});


//app config ===========================================================================

// pass passport for configuration
require('./config/passport')(passport);

// favicon usage
app.use(favicon('./public/images/favicon.png'));

// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })); 

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));


// set the static files location /public/img will be /img for users
app.use(express.static(path.join(__dirname, 'public')));

// log every request to the console
app.use(morgan('dev'));



//passportJs set up ==========================================

// read cookies (needed for auth)
app.use(cookieParser());

// use connect-flash for flash messages stored in session
app.use(flash());

// session secret
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' }));
 
app.use(passport.initialize());

// persistent login sessions
app.use(passport.session());

//set up routes(handle hhtp request)==========================

// load our routes and pass in our app and fully configured passport
require('./app/routes')(app,passport);


//launch =======================================================
app.listen(port);
console.log("Running on Port " + port);

// expose app           
exports = module.exports = app; 

