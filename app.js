const express = require('express')
const app = express()
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")

//Fetching the schemas from DB
const {Users, election, electionQuestions, electionOptions, voterStatus} = require("./models")

//For authentication.
const passport = require("passport")

//Authentication strategy is local.
const LocalStrategy = require("passport-local")

//To safe-guard our end points. Only logged In users can access that particular end point.
const connectEnsureLogin = require("connect-ensure-login")

//For hashing the passwords
const bcrypt = require("bcrypt");
const voterstatus = require('./models/voterstatus')
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

  passport.serializeUser((user, done) => {
    console.log("Serializing user in session", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done) => {
    Users.findByPk(id)
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
        title: "Sign up"
    })
})

//route to post details and verify them after signing in.
app.post('/signup-post', async (req, res)=>{
    const hashedPwd = await bcrypt.hash(req.body.password, saltRounds)
    try{
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
    })
})

//Route to create an election.
app.get('/create-election', connectEnsureLogin.ensureLoggedIn(), (req, res)=>{
    res.render('createElection',{
        data: 'Create an Election',
        logout: "Sign out",
        title: "Create Election"
    })
})

//Route to delete an election.
app.delete(
  "/delete-election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    try {
      await election.remove(request.params.id, request.user.id);
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
)

//Route to add a new election to db.
app.post('/dbElectionCreate', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
    try{
        await election.addElection({
            name: req.body.electionName,
            url : '/'+req.body.electionName+'/',
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
    voters:voters
  })
})

app.get('/edit-election-title/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=>{
  const element = await election.findByPk(req.params.id)
  res.render('editTitle',
  {
    data: 'Handle Election',
    logout: "Sign out",
    title: "Handle Election",
    element:element
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
    option: option
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
    electionDetail: electionDetail
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
    options
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
    question
  })
})

//Put route to handle update question request.
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

//Route to handle delete question request.
app.delete('/delete-question/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  try {
    await electionQuestions.removeQuestion(req.params.id)
    return res.json({ success: true })
  }catch(err){
    console.log(err)
    return res.status(422).json(err)
  }
})

//Route to handle delete option request.
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
    question
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
    id: req.params.id
  })
})

//Post route to add the voters.
app.post('/register-voters/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res)=> {
  try {
      await voterStatus.addVoter({
      id: req.body.id,
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
  res.render('launchElection',
  {
    data: 'Launch Election',
    logout: "Sign out",
    title: "Launch Election",
    electionDetail,
    questions,
    option,
  })
})

//Route to go to launched live state of the election.
app.get('/live-election/:id', connectEnsureLogin.ensureLoggedIn(), async(req, res)=>{
  res.render('liveElection', {
    data: 'Live Election',
    logout: "Sign out",
    title: "Live Election",
  })
})

//Exporting the app here so that it can be imported from index and rendered through it.
module.exports = app;