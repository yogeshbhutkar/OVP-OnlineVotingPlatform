const express = require('express')
const app = express()
var cookieParser = require("cookie-parser");
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")
const flash = require("connect-flash");
//Fetching the schemas from DB
const {Users, election, electionQuestions, electionOptions, voterStatus} = require("./models")

//For additional security.
var csrf = require("tiny-csrf");

//For authentication.
const passport = require("passport")

//Authentication strategy is local.
const LocalStrategy = require("passport-local")

//To safe-guard our end points. Only logged In users can access that particular end point.
const connectEnsureLogin = require("connect-ensure-login")

//For hashing the passwords
const bcrypt = require("bcrypt");
//To be later used in bcrypt.
const saltRounds = 10

app.use(express.urlencoded({ extended: false }))
app.use(cookieParser("some-secret-key"));
app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: "secret-key-123123123123",
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
)
app.use(bodyParser.json())
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash())
app.use(function (req, res, next) {
  res.locals.messages = req.flash();
  next();
});
//Specifying the usage of local strategy.

app.use(passport.initialize());
app.use(passport.session());
passport.use(
    "local",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      (username, password, done) => {
        Users.findOne({ where: { email: username } })
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

  passport.use(
    "local-voters",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (request, username, password, done) => {
        const ele = await election.findOne({where: {url: '/e/'+request.params.url}})
        voterStatus.findOne({ where: { voterDetails: username, eId: ele.id } })
          .then(async (user) => {
            const result = password==user.password?true:false
            if (result) {
              return done(null, user)
            } else {
              return done(null, false, { message: "Invalid password" })
            }
          })
          .catch(function () {
            return done(null, false, { message: "Invalid VoterID" })
          })
      }
    )
  )

  passport.serializeUser((user, done) => {
    console.log("Serializing user in session", user.id);
    done(null, {id: user.id, role: user.role?user.role:"admin"});
  });
  
  passport.deserializeUser((id, done) => {
    if (id.role === "admin"){
      Users.findByPk(id.id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
    }else if (id.role === "voter"){
      voterStatus.findByPk(id.id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
    }  
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
    title: "OVP - An Online Voting Platform",
    csrfToken: req.csrfToken(),
  })
})

//route for login.
app.get('/login', (req, res)=> {
    res.render('login', {
        data:"Sign in",
        logout: "",
        title: "Sign in",
        csrfToken: req.csrfToken(),
    })
})

//route for sign-up.
app.get('/signup', (req, res)=>{
    res.render('signup', {
        data:"Sign up",
        logout:"",
        title: "Sign up",
        csrfToken: req.csrfToken(),
    })
})

//route to post details and verify them after signing in.
app.post('/signup-post', async (req, res)=>{
    const hashedPwd = await bcrypt.hash(req.body.password, saltRounds)
    try{
      if (req.body.firstName == "") {
        req.flash("error", "please provide your firstname");
        return res.redirect("/signup");
      }
      if (req.body.email == "") {
        req.flash("error", "please provide your email");
        return res.redirect("/signup");
      }
        if (req.body.password == "") {
          req.flash("error", "please enter the password");
          return res.redirect("/signup");
        }
        if (req.body.password.length < 8) {
          req.flash("error", "password must contain atleast 8 characters.");
          return res.redirect("/signup");
        }
        const emailExistsCheck = await Users.findOne({
          where: {
            email: req.body.email,
          },
        });
        if (emailExistsCheck) {
          req.flash("error", "Email already exists.");
          return res.redirect("/signup");
        }
        const user = await Users.create({
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
        failureFlash: true,
    }), 
    (req, res)=>{
        res.redirect('/dashboard')
})

//signing out the user.
app.get("/signout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });


//route for dashboard. (After sign up or login the user will be redirected here.)
app.get('/dashboard', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
    const username =  req.user.firstName + " " + req.user.lastName
    const userId = req.user.id

    const elections = await election.getElections(userId)
    res.render('dashboard', {
        data: 'Dashboard',
        logout: "Sign out",
        title: "Dashboard",
        username: username,
        elections: elections,
        csrfToken: req.csrfToken(),
    })
})

//Route to create an election.
app.get('/create-election', connectEnsureLogin.ensureLoggedIn(), (req, res)=>{
    res.render('createElection',{
        data: 'Create an Election',
        logout: "Sign out",
        title: "Create Election",
        csrfToken: req.csrfToken(),
    })
})

//Route to delete an election.
app.delete(
  "/delete-election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, res) {
    console.log("We have to delete an election with ID: ", req.params.id)
    try {
      let result = await election.remove(req.params.id, req.user.id)
      console.log(result)
      return res.json({ success: true })
    } catch (error) {
      return res.status(422).json(error)
    }
  }
)

//Route to add a new election to db.
app.post('/dbElectionCreate', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
    try{
        if (req.body.electionName.length==0){
          req.flash("error", "Please enter the election name")
          return res.redirect("/create-election")
        }
        if (req.body.electionURL.length==0){
          req.flash("error", "Please enter the election URL")
          return res.redirect("/create-election")
        }
        if (req.body.electionURL.indexOf(' ')>=0){
          req.flash("error", "URL cannot contain space")
          return res.redirect("/create-election")
        }
        await election.addElection({
            name: req.body.electionName,
            url : '/e/'+req.body.electionURL,
            userId : req.user.id,
        })
        res.redirect('/dashboard')
    }catch(err){
        console.log(err);
    }
})

//Route to handle election.
app.get('/handle-election/:id',  connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  const electionDetail = await election.findOne({
    where: {
      id:  req.params.id,
    }
  })
  const questions = await electionQuestions.getElectionQuestions(electionDetail.id)
  const voters = await voterStatus.getAllVoters(electionDetail.id)
  res.render('handleElection', {
    data: 'Handle Election',
    logout: "Sign out",
    title: "Handle Election",
    electionDetail: electionDetail,
    questions: questions,
    voters:voters,
    csrfToken: req.csrfToken(),
  })
})

app.get('/edit-election-title/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  const element = await election.findByPk(req.params.id)
  res.render('editTitle',
  {
    data: 'Handle Election',
    logout: "Sign out",
    title: "Handle Election",
    element:element,
    csrfToken: req.csrfToken(),
  })
})

//Route to update the title of the election.
app.get('/edit-title/:id',  connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  try{
    const element = await election.findByPk(req.params.id)
    return res.json(element)
  }catch(err){
    console.log(err)
    return res.status(422).json(err);
  }
  
})
app.put('/edit-title/:id',  connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  try{
    const element = await election.findByPk(req.params.id)
    const updatedElement = await element.setElectionTitle(req.body.name)
    return res.json(updatedElement)
  }catch(err){
    console.log(err)
    return res.status(422).json(err)
  }
})

//managing questions.
app.get('/manage-questions/:id', connectEnsureLogin.ensureLoggedIn(), async(req, res)=>{
  const electionDetail = await election.findOne({
    where: {
      id:  req.params.id,
    }
  })
  const questions = await electionQuestions.getElectionQuestions(electionDetail.id)
  var option = [];
  for (var i=0; i<questions.length; i++){
    const options = await electionOptions.getOptions(questions[i].id)
    for (var j=0; j<options.length; j++){
      const item = {
        name: options[j].option,
        id: options[j].questionId,
        optionId: options[j].id
      }
      option.push(item)
    }
  }

  
  res.render('manageQuestions', {
    data: 'Manage Questions',
    logout: "Sign out",
    title: "Manage Questions",
    electionDetail: electionDetail,
    questions: questions,
    option: option,
    csrfToken: req.csrfToken(),
  })
})

//Route for creating a question 
app.get('/create-question/:id',connectEnsureLogin.ensureLoggedIn(), async(req, res)=>{
  const electionDetail = await election.findOne({
    where: {
      id:  req.params.id,
    }
  })
  res.render('createQuestion', {
    data: 'Manage Questions',
    logout: "Sign out",
    title: "Manage Questions",
    electionDetail: electionDetail,
    csrfToken: req.csrfToken(),
  })
})

//Route for creating a new question
app.get('/new-question/:id',connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  const electionDetail = await election.findOne({
    where: {
      id:  req.params.id,
    }
  })
  res.render('newQuestion',
  {
    data: 'Create New Question',
    logout: "Sign out",
    title: "Create New Question",
    electionDetail: electionDetail,
    csrfToken: req.csrfToken(),
  }
  );
})

//Route to post the data of creating a question inside of an election.
app.post('/new-question/:id',connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  try{
    const newQuestion = await electionQuestions.addQuestion({
        question: req.body.question,
        description : req.body.description,
        electionId : req.params.id,
    })
    res.redirect('/add-options/'+newQuestion.id)
  }catch(err){
    console.log(err)
  }
})

//Route to add the options.
//id is question's id.
app.get('/add-options/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  const question = await electionQuestions.findOne({
    where: {
      id:req.params.id
    }
  })


  const options = await electionOptions.getOptions(question.id)

  res.render('addOption',
  {
    data: 'Add options',
    logout: "Sign out",
    title: "Add options",
    question,
    options,
    csrfToken: req.csrfToken(),
  })
})

app.post('/add-option-to-db/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  try{
     const option = await electionOptions.addOptions({
        option: req.body.option,
        questionId: req.params.id,
    })
    res.redirect('/add-options/'+option.questionId)
  }catch(err){
    console.log(err)
  }
})

//Route for updating the question.
app.get('/update-question/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  const question = await electionQuestions.findOne({
    where: {
      id:req.params.id
    }
  })
  res.render('updateQuestion', {
    data: 'Update Question',
    logout: "Sign out",
    title: "Update Question",
    question,
    csrfToken: req.csrfToken(),
  })
})

//Put route to handle update question req.
app.put('/update-question/:id',  connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  try {
    const question = await electionQuestions.findByPk(req.params.id)
    const update = await question.setQuestionAndDescription(req.body.question, req.body.description)
    return res.json(update)
  }catch(err){
    console.log(err)
    return res.status(422).json(err)
  }
})

//Route to handle delete question req.
app.delete('/delete-question/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  try {
    await electionQuestions.removeQuestion(req.params.id)
    return res.json({ success: true })
  }catch(err){
    console.log(err)
    return res.status(422).json(err)
  }
})

//Route to handle delete option req.
app.delete('/delete-option/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  const option = await electionOptions.findByPk(req.params.id)
  console.log(option)
  console.log(req.params.id)
  try {
    await electionOptions.removeOption(req.params.id)
    return res.json({ success: true })
  }catch(err){
    console.log(err)
    return res.status(422).json(err)
  }
})

//Route to update options.
app.get('/update-option/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  const option = await electionOptions.findByPk(req.params.id)
  const question = await electionQuestions.findOne({
    where:{
      id: option.questionId
    }
  })
  res.render('updateOption', {
    data: 'Update options',
    logout: "Sign out",
    title: "Update options",
    option,
    question,
    csrfToken: req.csrfToken(),
  })
})

//Put Route to handle updation of an option
app.put('/update-option/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) =>  {
  try{
    const option = await electionOptions.findByPk(req.params.id)
    option.setOption(req.body.option)
  }catch(err){
    console.log(err)
  }
  
})

//Get route to register voters.
app.get('/register-voters/:id', connectEnsureLogin.ensureLoggedIn(), (req, res)=>{
  res.render('registerVoters',{
    data: 'Register Voter',
    logout: "Sign out",
    title: "Register Voter",
    id: req.params.id,
    csrfToken: req.csrfToken(),
  })
})

//Post route to add the voters.
app.post('/register-voters/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  console.log(req.params.id)
  try {
      await voterStatus.addVoter({
      voterDetails: req.body.voterDetail,
      password: req.body.password,
      eId: req.params.id
    })
    res.redirect('/handle-election/'+req.params.id)
  }catch(err){
    console.log(err)
  }
})

//Route to go to preview ballot page.
app.get('/launch-election/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  const electionDetail = await election.findOne({
    where: {
      id:  req.params.id,
    }
  })
  const questions = await electionQuestions.getElectionQuestions(electionDetail.id)
  let noQuestions = false
  if (questions.length==0){
    noQuestions = true
  }
  var option = [];
  for (var i=0; i<questions.length; i++){
    const options = await electionOptions.getOptions(questions[i].id)
    for (var j=0; j<options.length; j++){
      const item = {
        name: options[j].option,
        id: options[j].questionId,
        optionId: options[j].id
      }
      option.push(item)
    }
  }

  //To check if there are at-least 2 options for every question.
  display = true
  const idArray = []
  for (let i=0; i<option.length; i++){
    idArray.push(option[i].id)
  }
  const counts={}
  for (const num of idArray) {
    counts[num] = counts[num] ? counts[num] + 1 : 1;
  }
  const idKeys = Object.keys(counts)
  for (let i=0; i<idKeys.length; i++){
    if (counts[idKeys[i]]<2){
      display = false
      break
    }
  }
  const voters = await voterStatus.getAllVoters(electionDetail.id)
  let noVoters = false
  if (voters.length==0){
    noVoters = true
  }
  res.render('launchElection',
  {
    data: 'Launch Election',
    logout: "Sign out",
    title: "Launch Election",
    electionDetail,
    questions,
    option,
    csrfToken: req.csrfToken(),
    display,
    noQuestions,
    noVoters,
  })
})

//Route to go to launched live state of the election.
app.get('/live-election/:id', connectEnsureLogin.ensureLoggedIn(), async(req, res)=>{
  const electionDetail = await election.findOne({
    where: {
      id:  req.params.id,
    }
  })
  const questions = await electionQuestions.getElectionQuestions(electionDetail.id)
  const voters = await voterStatus.getAllVoters(electionDetail.id)
  res.render('liveElection', {
    data: 'Live Election',
    logout: "Sign out",
    title: "Live Election",
    id: req.params.id,
    electionDetail,
    questions,
    voters,
    csrfToken: req.csrfToken(),
  })
})

app.get("/e/:url", async (req, res)=>{
  res.render('voterSignIn', {
    data: 'Voter Sign In',
    logout: "Sign out",
    title: "Voter Sign In",
    url: req.params.url,
    csrfToken: req.csrfToken(),
  })
})

app.get('/vote/:url', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  const electionDetail = await election.findOne({
    where: {
      url:  '/e/'+req.params.url,
    }
  })
  const questions = await electionQuestions.getElectionQuestions(electionDetail.id)
  const voters = await voterStatus.getAllVoters(electionDetail.id)

  var option = [];
  for (var i=0; i<questions.length; i++){
    const options = await electionOptions.getOptions(questions[i].id)
    for (var j=0; j<options.length; j++){
      const item = {
        name: options[j].option,
        id: options[j].questionId,
        optionId: options[j].id
      }
      option.push(item)
    }
  }
  res.render("vote", {
    data: 'Vote',
    logout: "Sign out",
    title: "Caste your vote",
    electionDetail: electionDetail,
    questions: questions,
    voters:voters,
    option,
    csrfToken: req.csrfToken(),
  })
})

app.post('/signin-voters-post/:url',
    passport.authenticate("local-voters", {
      failureRedirect: 'back',
        failureFlash: true,
    }), 
    (req, res)=>{
        res.redirect('/vote/'+req.params.url)
})

//Route to add the answers to the table. (still incomplete)
app.post('/vote/add-answers', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  console.log("reached")
  console.log(req.body)
})

//Exporting the app here so that it can be imported from index and rendered through it.
module.exports = app;