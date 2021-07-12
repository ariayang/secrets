//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// Learning Encryptions
// const encrypt = require("mongoose-encryption");
// require('dotenv').config();
// const md5 = require("md5");

// level 4 - salting and hashing passwords with bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

//About cookies and session
const passport = require('passport');
const passportLocal = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const expressSession = require("express-session");



const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/serectsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  // we're connected!
});


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please check your entry. No email specified"],
  },
  password: String,
});


// Level 2.1 secret, with a serect key in the code. still dangerous
// const encryptSecret = "ThisisourLittlesecret.";

//level 2.5 secret, use dotenv to store environment keys
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });


const User = new mongoose.model("User", userSchema);


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

.post(function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    User.findOne({email: req.body.username}, function(err, foundUser){
        if (err) {
            res.send(err);
        }
        else if (foundUser) { res.send("User name exists, try again"); }
        else {

            const newUser = new User({
                email: req.body.username,
                password: hash
              });

              newUser.save(function(err){
                  if (err) { res.send(err); }
                  else { res.render("secrets"); }
              });
        }

    }); 
  });
  });



app.route("/login")
  .get(function (req, res) {
    res.render("login");
})
  .post(function (req, res) {
    User.findOne({email: req.body.username}, function(err, foundUser){
        if (err) {
            res.send(err);
        }
        else if (!foundUser) { res.send("User not found, try again"); }
        else {
       //Found the user, Authentication: check if the password is the same
            bcrypt.compare(req.body.password, foundUser.password, function(err, result){
                // result == true
                if (result === true) {
                    res.render("secrets");
                } else {
                res.send("Cannot find a user with this email and password. Please try again.");
                }
            });
        } 
    }); 
  });


app.listen(3000, function() {
    console.log("Server started on port 3000");
  });