const express = require('express')
const app = express()
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")

//Fetching the schemas from DB
const {User} = require("./models")

//For authentication.
const passport = require("passport")

//Authentication strategy is local.
const LocalStrategy = require("passport-local")

//To safe-guard our end points. Only logged In users can access that particular end point.
const connectEnsureLogin = require("connect-ensure-login")

//For hashing the passwords
const bcrypt = require("bcrypt");
//To be later used in bcrypt.
const saltRounds = 10;

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))
app.use(
    session({
      secret: "secret-key-123123123123",
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
)

//Specifying the usage of local strategy.

app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      (username, password, done) => {
        User.findOne({ where: { email: username } })
          .then(async (user) => {
            const result = await bcrypt.compare(password, user.password)
            if (result) {
              return done(null, user)
            } else {
              return done(null, false, { message: "Invalid password" })
            }
          })
          .catch(function () {
            return done(null, false, { message: "Invalid Email" })
          })
      }
    )
  )

  passport.serializeUser((user, done) => {
    console.log("Serializing user in session", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done) => {
    User.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  });

//Setting view engine as ejs to use ejs templates.
app.set("view engine", "ejs")

//Setting the path.
app.use(express.static(path.join(__dirname, "public")))

//Root route of the web app.
app.get('/', (req, res) => {
  res.render('index', {
    data: "",
    logout: "",
    title: "OVP - An Online Voting Platform"
  })
})

//route for login.
app.get('/login', (req, res)=> {
    res.render('login', {
        data:"Sign in",
        logout: "",
        title: "Sign in"
    })
})

//route for sign-up.
app.get('/signup', (req, res)=>{
    res.render('signup', {
        data:"Sign up",
        logout:"",
        title: "Sign out"
    })
})

//route to post details and verify them after signing in.
app.post('/signup-post', async (req, res)=>{
    const hashedPwd = await bcrypt.hash(req.body.password, saltRounds)
    try{
        const user = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPwd,
        })
        req.login(user, (err) => {
            if (err) {
            console.log(err)
            res.redirect("/")
            } else {
            res.redirect("/dashboard")
            }
        })
    }catch(err){
        console.log(err)
    }
})



//route to post details after signing up.
app.post('/signin-post',
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: false,
    }), 
    (req, res)=>{
        res.redirect('/dashboard')
})

//signing out the user.
app.get("/signout", (request, response, next) => {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      response.redirect("/");
    });
  });


//route for dashboard. (After sign up or login the user will be redirected here.)
app.get('/dashboard', connectEnsureLogin.ensureLoggedIn(), (req, res)=>{
    const username =  req.user.firstName + req.user.lastName;
    console.log(username+"username")
    res.render('dashboard', {
        data: 'Dashboard',
        logout: "Sign out",
        title: "Dashboard",
        username: username,
    })
})


//Exporting the app here so that it can be imported from index and rendered through it.
module.exports = app;