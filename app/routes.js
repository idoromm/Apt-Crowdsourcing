var User = require('./models/user');
var Listing = require('./models/listing');
var Question = require('./models/question');
var QuestionHandler = require('./QuestionHandler');

module.exports = function (app, passport) {

    //===================================================
    //DB api
    //*****Comment by Lior*****
    // next 2 functions are not needed. passport sets all  users
    //and transfer
    //users in the following way: req.user
    //please add here all details you need from user to
    //add to sign up form:
    //1. add name form for sign up. - Done
    //===================================================


    app.get('/api/userName', isLoggedIn, function (req, res) {

        //didnt find better way to make it work
        var userStr = JSON.stringify(req.user);
        var userJson = JSON.parse(userStr);

        //return name
        if (userJson.facebook) {
            res.send(userJson.facebook.firstName);
        } else if (userJson.google) {

            User.findOne({'google.email': userJson.google.email}, function (err, user) {
                if (err)
                    return done(err);

                if (user) {
                    var userStr = JSON.stringify(user.google);
                    var userJson = JSON.parse(userStr);
                    if (userJson.firstName) {
                        //old users (Us)
                        res.send(userJson.firstName);
                    } else {
                        res.send(userJson.name);
                    }
                }
            });
        } else {
            res.send(userJson.local.name);
        }
    });

    app.get('/api/user', function (req, res) {
        if (req.user) {
            res.json(req.user);
        } else {
            res.json("");
        }

    });


    /* gets a question with id = _id */
    app.get('/api/questions/:_id', function (req, res) {
        console.log("Question API");
        Question.find(
            {"_id": req.params._id}
            , function (err, question) {
                console.log("Question: " + question);
                res.json(question[0]);
            });
    });

    /* add a new question with description in url */
    app.post('/api/questions', function (req, res) {
        var description = req.body.description;
        var question = new Question({description: description});
        question.save(function (err, question) {
            if (err) return handleError(err);
            res.json({description: question.description});
        });
    });

    /* get an array of ALL the questions in the database */
    app.get('/api/questions', function (req, res) {
        Question.find(function (err, questions) {
            if (err)
                res.send(err);
            console.log(questions);
            res.json(questions);
        });
    });


    app.get('/api/getrandomquestion', function (req, res) {
		QuestionHandler.getRandomQuestion(res);
	});
	
	app.get('/api/geteandompic', function (req, res) {
		QuestionHandler.chooseRandomPic(res);
	});

    app.get('/api/listings', function (req, res) {
        // use mongoose to get all listings in the database
        Listing.find(function (err, listings) {
            // if there is an error retrieving, send the error.
            // nothing after res.send(err) will execute
            if (err)
                res.send(err);
            console.log(listings);
            res.json(listings); // return all nerds in JSON format
        });
    });

    app.post('/api/listings', function (req, res) {
        var beds = req.body.beds;
        var listing = new Listing({"beds": beds});
        listing.save(function (err) {
            if (err) throw err;

            console.log(listing + ' has been saved successfully!');
            res.json(listing);
        });
    });

    // server routes ===========================================================
    // handle things like api calls

    // frontend routes =========================================================
    // route to handle all angular requests

    //=====================================================
    // Home Page (welcome page for unrecognized users)
    //=====================================================

    //we add middleware function to let only signed in
    // users to go to main page
    app.get('/', isLoggedIn, function (req, res) {
        console.log("Main Page is loading ...");

        res.sendfile('./public/views/main-page.html');
    });

    //main page for users that are unrecognized
    app.get('/welcome', function (req, res) {
        if (req.user) {
            res.redirect('/');
        }
        console.log("Welcome Page is loading ...");

        //prevent caching to prevent from pressing back button and return to welcome page after log in
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.sendfile('./public/views/welcome.html');
    });


    //======================================================
    //Login(login form for local login(not facebook,google))
    //======================================================

    // show the login form
    app.get('/login', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('Signup.ejs', {message: req.flash('loginMessage')});
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/',		// redirect to the home page
        failureRedirect: '/login', // redirect back to the login page if there is an error
        failureFlash: true			// allow flash messages
    }));

    // =====================================================
    // FACEBOOK Login
    // =====================================================
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/',
            failureRedirect: '/'
        }));


    // ====================================================
    // GOOGLE ROUTES
    // ====================================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }));


    //======================================================
    //Sign Up
    //======================================================

    // show the signup form
    app.get('/signup', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/',			// redirect to the secure profile section
        failureRedirect: 'signup',		// redirect back to the signup page if there is an error
        failureFlash: true				// allow flash messages - shows messege for failure
    }));

    //======================================================
    //Profile Section
    //======================================================

    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile.ejs', {
            user: req.user // get the user out of session and pass to template
        });
    });

    //======================================================
    //Log Out
    //======================================================

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });


    //======================================================
    //Apartment listing
	//======================================================
	
	app.get('/listing/:street/:buildingNumber/:apartmentNumber', function (req, res) {
		res.sendfile('./public/views/single.html');
		});

    app.get('/single', function (req, res) {
        console.log("listing page is loading ...");
        res.sendfile('./public/views/single.html');
    });

    app.get('/new', function (req, res) {
        console.log("new post is loading ...");
        res.sendfile('./public/views/new.html');
    });

    app.get('/api/user/:email', function (req, res) {
        User.findOne({
            $or: [
                {"local.email": req.params.email},
                {"facebook.email": req.params.email},
                {"google.email": req.params.email}
            ]
        }, function (err, user) {
            res.json(user);
        });
    });

    app.get('/api/listing/:street/:buildingNumber/:apartmentNumber', function (req, res) {
        console.log("Listing API");
        Listing.findOne(
            {
                "street": req.params.street,
                "buildingNumber": req.params.buildingNumber,
                "apartmentNumber": req.params.apartmentNumber
            }
            , function (err, listing) {
                //if (err) { return next(err); }
                console.log("Listing: " + listing);
                res.json(listing);
            });
    });

    app.get('/api/listings', function (req, res, next) {
        Listing.find({}, function (err, listings) {
            if (err) {
                return next(err);
            }
            res.json(listings);
        });
    });

    app.get('/testAngular5', function (req, res) {
        console.log("new post is loading ...");
        res.sendfile('./public/views/testAngular5/index.html');
    });

    app.get('/testAngular3', function (req, res) {
        console.log("new post is loading ...");
        res.sendfile('./public/views/testAngular3/index.html');
    });


}; //end export


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the welcomw page
    res.redirect('/welcome');
}
