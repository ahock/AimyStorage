var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var path = require("path");
var APP_CONFIG = require("./app-variables.js");

console.log("NODE_ENV", process.env.NODE_ENV || "test");

console.log("APP_CONFIG", APP_CONFIG);

var app = express();

//Enabling CORS - cross-origin HTTP request
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://aimy.iod4all.com:8080");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var nodeModulesPath = path.join(__dirname, "..", "node_modules");
app.use("/node_modules", express.static(nodeModulesPath));

var clientPath = path.join(__dirname, "..", "client");
app.use("/client", express.static(clientPath));

app.use(bodyParser.json());

const MONGO_DB_URI = "mongodb://ahock:taurus1ted@ds135069.mlab.com:35069/aimy";
mongoose.connect(MONGO_DB_URI,{ useNewUrlParser: true });
mongoose.connection.on('connected', () => {
    console.log("Connected to MongoDB");
    // Load initial data

});
mongoose.connection.on('error', (err) => {
    console.log("Error:", err, MONGO_DB_URI);    
});



var Schema = mongoose.Schema;
var userTestData = new Schema({
    text: String,
    lang: String
},{collection: 'test'});
const TestData = mongoose.model('testData', userTestData);



app.get("/", function(req, res) {
    console.log("index.html aufgerufen:", req.query);
    res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.get("/test", function(req, res) {
    console.log("test.html aufgerufen:", req.query);
    res.sendFile(path.join(__dirname, "views", "test.html"));
});

app.get("/favicon.ico", function(req, res) {
    res.sendFile(path.join(__dirname, ".", "favicon.ico"));
});

///////////////////////////////////////////////////////////////
//
// ToDo's
//
///////////////////////////////////////////////////////////////

app.get("/api/0.1.0/todos", function(req, res) {
    TestData.find()
        .then(function(doc){
            console.log("ID:", doc[0]);
            res.send(doc);
    });
});

var todos = [
    {
        title: "1. Todo",
        content: "Ich bin der Inhalt"
    },
    {
        title: "2. Todo",
        content: "Ich bin der Inhalt"
    }
];

app.get("/api/1.0.0/todos", function(req, res) {
    res.send(todos);
});
app.get("/api/1.0.1/todos", function(req, res) {
    
    TestData.find()
        .then(function(doc){
            var todos = [];
            for(var i=0; i<doc.length; i++){
                console.log("ID:", doc[i]);
                todos.push({
                    title: doc[i].lang,
                    content: doc[i]['text']
                });            
            }
            res.send(todos);
    });
//    res.send(todos);
});

app.put("/api/1.0.0/todos/create", function(req, res) {
    console.log(req.body.title, req.body.content);
    todos.push({
        title: req.body['title'],
        content: req.body['content']
    });
    res.send({success: true});
});


///////////////////////////////////////////////////////////////
//
// User
//
///////////////////////////////////////////////////////////////

//var Schema = mongoose.Schema;
var masteryData = new Schema({
    token: String,
    name: String,
    status: String
});

var userData = new Schema({
    token: String,
    email: String,
    firstname: String,
    lastname: String,
    last_login: Date,
    login_history: [String],
    groups: [String],
    eduobjectives: [{oid: String, name: String, selfassess: String, field: String, notes: String}],
    masteries: [masteryData],
    reviews: [{oid: String, name: String}],
    lang: String
},{collection: 'users'});

const userDataModel = mongoose.model('UserData', userData);

/*
console.log("User1", User1);
User1.save(function (err, User1) {
    if (err) return console.error(err);
});
*/

var userList = [];

userDataModel.find(function (err, user) {
  if (err) return console.error(err);
  userList = user;
  console.log("Anzahl User geladen:", userList.length);
  // console.log("userList aus MongoDB:", userList);
});

app.get("/api/0.0.1/user/get", function(req, res) {
    // Parameter
    //  UserToken
    //
    console.log("/api/0.0.1/user/get");
    // Log Device parameter
    console.log("IP", req.ip);
    console.log("Token", req.query.UserToken);
    console.log("ClientId", req.query.ClientId);
    
    ///// Search for user with this token
    var ok = false;
    var j;
    for(var i = 0; i<userList.length;i++) {
//        console.log("Token",userList[i].token);
        if(userList[i].token == req.query.UserToken) {
            console.log("Ok",i);
            ok = true;
            j = i;
            i = userList.length;
        }
    }
    if(ok) {
        console.log("User with token:", userList[j].token);
        res.send({success: true, user: userList[j]});
    }
    else {
        console.log("No user found!");
        res.send({success: false, error: "no such user"});
    }
});
app.get("/api/0.0.1/user/add", function(req, res) {
    ///// Add new user
    var newuserflag = true;
    /// Check existance
    ///// Search for user with this token
    if( req.query.UserToken != "" && req.query.UserToken != undefined) {
        var j;
        for(var i = 0; i<userList.length;i++) {
//            console.log("Token",userList[i].token);
            if(userList[i].token == req.query.UserToken) {
                console.log("Ok",i);
                newuserflag = false;
                j = i;
                i = userList.length;
            }
        }
    }
    /// Stage data
    if(newuserflag) {
        console.log("New user!", req.query.UserData);
        
        var stageuserdata = JSON.parse(req.query.UserData);
//        stageuserdata.token = req.query.UserToken;
        stageuserdata.last_login = new Date();
        
        console.log("New user data object", stageuserdata);
//        newuserflag = false;
    }
    else {
        console.log("User with token:", userList[j].token);
        res.send({success: false, error: "user exists"});
    }
    /// Create object and save
    if(newuserflag) {
        var User1 = new userDataModel(stageuserdata);
        User1.save();
        userList.push(User1);
        console.log("Save new user!", User1, userList);
        res.send({success: true, error: "user created"});
    }
});
app.get("/api/0.0.1/user/reload", function(req, res) {
    ///// Reload data from DB

    userDataModel.find(function (err, user) {
        if (err) return console.error(err);
        userList = user;
        console.log("userList aus MongoDB:", userList);
        res.send({success: true, function: "reload"});
    });
});
app.get("/api/0.0.1/user/list", function(req, res) {
    ///// List with all users

    console.log("userList from memory:", userList);
    res.send(userList);
});
app.get("/api/0.0.1/user/update", function(req, res) {
    userDataModel.findOne({token:req.query.UserToken}, function (err, user) {
        if (err) return console.error(err);
        // Found user with this token in database
        console.log("Query:",req.query);
//        console.log("User:",user);
        // Udgate Educational Objectives
        console.log(req.query.EduObj?JSON.parse(req.query.EduObj):"keine Educational Objectives");
        if(req.query.EduObj) {
            let edo = JSON.parse(req.query.EduObj);
            
            for(let i=0;i<user.eduobjectives.length;i++) {
                for(let j=0;j<edo.length;j++) {
                    if(user.eduobjectives[i].oid == edo[j].oid) {
                       if(edo[j].selfassess) {
                           user.eduobjectives[i].selfassess =  edo[j].selfassess;
                       }
                       if(edo[j].notes) {
                           user.eduobjectives[i].notes =  edo[j].notes;
                       }
                    }
                }
            }
        }
        // Update Reviews
        // TODO
        
        // Save user
//        if(user){
            user.save(function (err, user) {
                if (err) return console.error(err);
                userDataModel.find(function (err, user) {
                    if (err) return console.error(err);
                    userList = user;
                });
            });
//        }
    });
    res.send({success: true, function: "update"});
});

// User Ende ////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////
//
// Review, Test, Verification, former Mastery, Überprüfung, Erfolgskontrolle, Lernzielkontrolle
//
///////////////////////////////////////////////////////////////

var reviewSchema = new Schema({
    name: String,
    status: ['upcoming','open','done'],
    type: ['Mastery','ATL','Verify'],
    modul: String,
    learninggoal: [{
        name: String
    }],
    autor: String,
    options: {
        start: Boolean,
        replay: Boolean,
        delay: Boolean,
        locked: Boolean,
        coach: Boolean
    },
    group: String,
    result: String,
    challenges: [String]
},{collection: 'reviews'});

const reviewModel = mongoose.model('Review', reviewSchema);
/*
var Review = new reviewModel({
    name: "AIMY - M1: Aimy Konzept",
    type: "Mastery",
    modul: "Learning with Aimy",
    autor: "Andreas Hock",
    challenges: ["Aufgabe 1","Aufgabe 2","Aufgabe 3"]
});

console.log("Review 1", Review);

Review.save(function (err, Review) {
    if (err) return console.error(err);
});
*/

var reviewList = [];

reviewModel.find(function (err, reviews) {
  if (err) return console.error(err);
  reviewList = reviews;
  console.log("Anzahl Reviews geladen:", reviewList.length);
  status.Datasets.push({"Reviews":reviewList.length});  
});

app.get("/api/0.0.1/review/get", function(req, res) {
    // Parameter
    //  id
    //
    console.log("/api/0.0.1/review/get");
    // Log Device parameter
    console.log("IP", req.ip);
    console.log("id", req.query.id);
    
    ///// Search for user with this token
    var ok = false;
    var j;
    for(var i = 0; i<reviewList.length;i++) {
        console.log("id",reviewList[i]._id);
        if(reviewList[i]._id == req.query.id) {
            console.log("Ok",i);
            ok = true;
            j = i;
            i = userList.length;
        }
    }
    if(ok) {
        console.log("Review with id:", reviewList[j]._id);
        res.send(reviewList[j]);
    }
    else {
        console.log("No review found!");
        res.send({success: false, error: "no such review"});
    }
});

app.get("/api/0.0.1/review/list", function(req, res) {
    ///// List with all users

//    console.log("reviewList from memory:", reviewList);
    res.send(reviewList);
}); 

// Review Ende ////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////
//
// Educational objective, Lernziel, ...
//
///////////////////////////////////////////////////////////////

var eduobjectiveSchema = new Schema({
    name: String,
    lang: ['DE','EN','FR'],
    type: ['Kennen','Können','Tuen'],
    skillgoal: String,
    field: String,
    modul: String
},{collection: 'eduobjectives'});

const eduobjectiveModel = mongoose.model('EduObjective', eduobjectiveSchema);

/*
var EduObjective = new eduobjectiveModel({
    name: "Ich kann Lernenden die Arbeitsweise und Vorteile näher bringen.",
    lang: "DE",
    type: "Tuen",
    skillgoal: "Das Konzept von Aimy so verstehen, dass man es für sich selbst gewinnbringend anwenden kann und die Vorteile anderen erklärt werden können.",
    modul: "Aimy für Lern- und Fachcoaches",
    field: "Aimy",
});
console.log("EduObjective", EduObjective);

EduObjective.save(function (err, EduObjective) {
    if (err) return console.error(err);
});
*/

var eduobjectiveList = [];

eduobjectiveModel.find(function (err, eo) {
  if (err) return console.error(err);
  eduobjectiveList = eo;
  console.log("Anzahl Lernziele geladen:", eduobjectiveList.length);
  status.Datasets.push({"EduObjectives":eduobjectiveList.length});
  // console.log("userList aus MongoDB:", userList);
});

app.get("/api/0.0.1/objective/list", function(req, res) {
    ///// List with all educational objectives

    console.log("eduobjectiveList from memory:", eduobjectiveList.length);
    res.send(eduobjectiveList);
});

app.get("/api/0.0.1/objective/get", function(req, res) {
    // Parameter
    //  id
    //
    var returnList = [];
    
    
    console.log("/api/0.0.1/objective/get");
    // Log Device parameter
    
//    console.log("id", req.query.id);
    
    let idres = JSON.parse(req.query.id);
//    console.log("id", idres, typeof idres);
    
    ///// Search for user with this token
    var ok = false;
    for(var i = 0; i<eduobjectiveList.length;i++) {
//        console.log("id",challengeList[i]._id);
        for(var j = 0; j<idres.length;j++) {
//            console.log(":",challengeList[i]._id, idres[j]);
            if(eduobjectiveList[i]._id == idres[j]) {
                console.log("Match:",idres[j], eduobjectiveList[i].name);
                returnList.push(eduobjectiveList[i]);
                ok = true;
            }
        }
    }
    if(ok) {
//        console.log("Challenges:");
        res.send(returnList);
    }
    else {
        console.log("No eduobjective found!");
        res.send({success: false, error: "no such objective"});
    }
});

///////////////////////////////////////////////////////////////
//
// Challenge, Aufgabe, Frage, ...
//
///////////////////////////////////////////////////////////////

var challengeSchema = new Schema({
    name: String,
    lang: ['DE','EN','FR'],
    type: ['Kennen','Können','Tuen'],
    field: String,
    eduobjectives: [eduobjectiveSchema]
},{collection: 'challenges'});

const challengeModel = mongoose.model('Challenge', challengeSchema);


/*
var Challenge = new challengeModel({
    name: "Wei unterscheidet sich Microlearning von konventionellen Lernmethoden?",
    lang: "DE",
    type: "Kennen",
    field: "Aimy",
    eduobjectives: [
    {
                "oid": "5bc45c41aae9c9384dd39231",
                "name": "Ich verstehe das Konzept hinter Microlearing und kann die Vorteile erklären."
    }]
});

console.log("ChallengeObjective", Challenge);

Challenge.save(function (err, Challenge) {
    if (err) return console.error(err);
});
*/

var challengeList = [];

challengeModel.find(function (err, challenge) {
  if (err) return console.error(err);
  challengeList = challenge;
  console.log("Anzahl Challenges geladen:", challengeList.length);
  status.Datasets.push({"Challenges":challengeList.length});
  // console.log("userList aus MongoDB:", userList);
});

app.get("/api/0.0.1/challenge/get", function(req, res) {
    // Parameter
    //  id
    //
    var returnList = [];
    
    
    console.log("/api/0.0.1/challenge/get");
    // Log Device parameter
    
//    console.log("id", req.query.id);
    
    let idres = JSON.parse(req.query.id);
//    console.log("id", idres, typeof idres);
    
    ///// Search for user with this token
    var ok = false;
    for(var i = 0; i<challengeList.length;i++) {
//        console.log("id",challengeList[i]._id);
        for(var j = 0; j<idres.length;j++) {
//            console.log(":",challengeList[i]._id, idres[j]);
            if(challengeList[i]._id == idres[j]) {
                console.log("Match:",idres[j], challengeList[i].name);
                returnList.push(challengeList[i]);
                ok = true;
            }
        }
    }
    if(ok) {
//        console.log("Challenges:");
        res.send(returnList);
    }
    else {
        console.log("No challenge found!");
        res.send({success: false, error: "no such challenge"});
    }
});


// Challenge Ende ////////////////////////////////////////////////////////

app.get("/callback", function(req, res) {
    res.status(200).redirect("/");
//    res.status(200).redirect("/user");
});


app.get("/api/status", function(req, res) {
    console.log("Status requested from", req.ip);
    res.send(status);
});

var status = {
  "Status":"Ok",
  "Started":new Date(),
  "LastLoad":new Date(),
  "Hostname":process.env.HOSTNAME || "empty",
  "IP":process.env.IP,
  "Port":process.env.PORT || 3000,
  "PWD": process.env.PWD,
  "Datasets": []
};

console.log("Listening on port:", process.env.PORT || 3000);
console.log("Home directory:", process.env.HOME);
console.log("Meteor Port:", process.env.METEOR_PORT);
console.log("Script:",process.env.npm_package_scripts_run_server);
console.log("PWD:",process.env.PWD);
console.log("Init CWD:",process.env.INIT_CWD);
console.log("NPM package name:",process.env.npm_package_name);
console.log("Hostname:",process.env.HOSTNAME);
console.log("IP:",process.env.IP);
console.log("Port:",process.env.PORT);
//console.log("All env variables:", process.env);

app.listen(process.env.PORT || 3000,'10.0.0.251');

console.log("Server started on port:",process.env.PORT || 3000);