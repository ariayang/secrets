//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// Learning Encryptions
// const encrypt = require("mongoose-encryption");
require('dotenv').config();
// const md5 = require("md5");

// level 4 - salting and hashing passwords with bcrypt
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
// const myPlaintextPassword = 's0/\/\P4$$w0rD';
// const someOtherPlaintextPassword = 'not_bacon';

// About cookies and session
// npm i express-session passport passport-local passport-local-mongoose
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// Level 6: OAUTH 2.0
var GoogleStrategy = require("passport-google-oauth20").Strategy;

var findOrCreate = require("mongoose-findorcreate");



const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// THe sequence matters for app.use(session) and app.use(passport)
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}));


app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/serectsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  // we're connected!
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    //required: [true, "Please check your entry. No email specified"],
  },
  password: String,
  googleId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose); //use with passport

userSchema.plugin(findOrCreate);  // use with OAuth, and for findOrCreate function for OAuth to work


// Level 2.1 secret, with a serect key in the code. still dangerous
// const encryptSecret = "ThisisourLittlesecret.";

//level 2.5 secret, use dotenv to store environment keys 
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });


const User = new mongoose.model("User", userSchema);

// Level 5: Passport
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


// From passportjs.org documentation. Will work for broader apps. So, replacing the above code
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Level 6: OAUTH 2.0
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));



const secretSchema = new mongoose.Schema({
    title: String,
    content: String,
    userId: String
});

const Secret = new mongoose.model("Secret", secretSchema);


app.get("/", function(req, res){
    res.render('home');
});


app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })


  // Level 3: md5 version
//   .post(function (req, res) {
//     User.findOne({email: req.body.username}, function(err, foundUser){
//         if (err) {
//             res.send(err);
//         }
//         else if (foundUser) { res.send("User name exists, try again"); }
//         else {
//             const newUser = new User({
//                 email: req.body.username,
//                 password: md5(req.body.password)
//               });

//               newUser.save(function(err){
//                   if (err) { res.send(err); }
//                   else { res.render("secrets"); }
//               });
//         }

//     }); 
//   });

// .post(function (req, res) {
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     // Store hash in your password DB.
//     User.findOne({email: req.body.username}, function(err, foundUser){
//         if (err) {
//             res.send(err);
//         }
//         else if (foundUser) { res.send("User name exists, try again"); }
//         else {

//             const newUser = new User({
//                 email: req.body.username,
//                 password: hash
//               });

//               newUser.save(function(err){
//                   if (err) { res.send(err); }
//                   else { res.render("secrets"); }
//               });
//         }

//     }); 
//   });
//   });

.post(function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("secrets");
      })
    }
  })
});


app.get("/secrets", function(req, res){
  // if (req.isAuthenticated()){
  //   res.render("secrets");
  // } else {
  //   res.redirect("login");
  // }

  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err) { console.log(err); 
    } else {
      if (foundUsers) {
        //console.log(foundUsers);
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});



app.route("/login")
  .get(function (req, res) {
    res.render("login");
})
  .post(function (req, res) {
  //   User.findOne({email: req.body.username}, function(err, foundUser){
  //       if (err) {
  //           res.send(err);
  //       }
  //       else if (!foundUser) { res.send("User not found, try again"); }
  //       else {
  //      //Found the user, Authentication: check if the password is the same
  //           bcrypt.compare(req.body.password, foundUser.password, function(err, result){
  //               // result == true
  //               if (result === true) {
  //                   res.render("secrets");
  //               } else {
  //               res.send("Cannot find a user with this email and password. Please try again.");
  //               }
  //           });
  //       } 
  //   }); 
  // });
    const user = new User({
      email: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err){
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      }
    })
  });


  app.route("/logout")
  .get(function (req, res) {
    req.logOut();
    res.redirect("/");
});


app.get("/auth/google", 
  passport.authenticate("google", { scope: ["profile"] })
);


app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});


app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("login");
  }
});


app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  //console.log(req);
  //console.log(req.user.id); // works
  //console.log(session.passport.user);
  //console.log(_passport.session.user);

  User.findById(req.user.id, function(err, foundUser){
    if (err) { console.log(err); 
    } else {
      if (foundUser) {
        //console.log(req.user.id);
        foundUser.markModified("secret");
        foundUser.secret = submittedSecret;
        //console.log("secret is: " + foundUser.secret);
        
        foundUser.save(function(){
          //console.log("founderUser ID is: " + req.user.id);
          //console.log("secret is: " + foundUser.secret);
          //console.log(foundUser);
          res.redirect("/secrets");
        });
      }
    }
  });
});


app.listen(3000, function() {
    console.log("Server started on port 3000");
  });