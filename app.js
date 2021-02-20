var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var path = require("path");
var nodemailer = require('nodemailer');
var fs = require('fs');

var dialog = require("./schema/dialog.js");
var assignment = require("./schema/assignment.js");
var assignresult = require("./schema/assignresult.js");
var log = require("./schema/log.js");
var eduobjective = require("./schema/eduobjective.js");
var skill = require("./schema/skill.js");
var skillset  = require("./schema/skillset.js");
var content = require("./schema/content.js");
var user = require("./schema/user.js");
var group = require("./schema/group.js");

var APP_CONFIG = require("./app-variables.js");

//console.log("NODE_ENV", process.env.NODE_ENV || "test");
console.log("ENV", process.env || "test");

console.log("HOST    :", process.env.C9_HOSTNAME || "no C9_HOSTNAME");
console.log("AWS_PATH:", process.env.AWS_PATH || "no AWS_PATH");
console.log("APP_CONFIG", APP_CONFIG);

var app = express();

//Enabling CORS - cross-origin HTTP request
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var nodeModulesPath = path.join(__dirname, "..", "node_modules");
app.use("/node_modules", express.static(nodeModulesPath));

var clientPath = path.join(__dirname, "..", "client");
app.use("/client", express.static(clientPath));

app.use(bodyParser.json());

//const MONGO_DB_URI = "mongodb://ahock:taurus1ted@ds135069.mlab.com:35069/aimy";
//mongoose.connect(MONGO_DB_URI,{ useNewUrlParser: true });

//const MONGO_DB_URI = "mongodb+srv://aimy:aimx4aimy@aimycluster-9in7r.mongodb.net/aimy?retryWrites=true&w=majority";

const MONGO_DB_URI = APP_CONFIG.MongoURI;
mongoose.connect(MONGO_DB_URI,{ useNewUrlParser: true, useUnifiedTopology: true });

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
    console.log("index.html aufgerufen von:", req.ip);
//    res.sendFile(path.join(__dirname, "views", "index.html"));
    res.send({success: false, error: "request not valid"});
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
// Email notifications
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/email", function(req, res) {
    var mailOptions = {
      from: 'andreas4hock@gmail.com',
      to: 'andreashock@bluewin.ch',
      subject: 'AIMY - Entwickele Dich - Es liegen neue Meldungen vor!',
      text: 'That was easy!',
      html: "<p>Es liegen neue Meldungen bei AIMY vor!</p><p><a href='http://showcase.aimyonline.com:8080/' target='_new'>Direkt zu Aimy</a></p>"
    };    
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'onlineaimy@gmail.com',
        pass: '5s#Dks26w2*J'
      }
    });

    if(req.query.sender_token == "auth0|5bbf4fed899d886ff2604295") {
        const receiver = user.findOne({token: req.query.receiver_token});
        receiver.then((data)=>{
            if(data) {
                console.log("Email Notification Receiver - Token:, Email",req.query.receiver_token,data.email);   
                if(data.email) {
                    // Send
                    mailOptions.to = data.email;
                    fs.readFile('./assets/emailtext.html', 'utf8', (err, template) => {
                        if (err) throw err;
                        mailOptions.html = template;
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                                console.log(error);
                                res.send({success: false, error: "not send", info: req.query.sender_token, email: mailOptions.to});
                            } else {
                                res.send({success: true, error: "", info: info.response, email: mailOptions.to});    
                            }
                        });     
                    });                    
                }
            }
        });
    } else {
        res.send({success: false, error: "unauthorized sender", info: req.query.sender_token, email: mailOptions.to});
    }
});

///////////////////////////////////////////////////////////////
//
// Link Objects
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/link", function(req, res) {
    console.log("Link objects", req.query.pair, req.query.id1, req.query.id2 );
    var id1 = req.query.id1;
    var id2 = req.query.id2;
    var name1;
    var name2;
    var obj1;
    var obj2;
    
    switch (req.query.pair) {
        case 'skill2set':
            skillset.findById(req.query.id1, function(err, result) {
                if (err) {
                    return console.error(err);
                } else {
//                    console.log("skillset",id1,id2);
                    obj1 = new skillset(result);
                    name1 = result.name;
                    skill.findById(id2, function(err, result) {
                        if (err) {
                            return console.error(err);
                        } else {
                            obj2 = new skill(result);
                            name2 = result.name;
                            // Existing?
                            skillset.find({'skillref.id':id2},{name: 1},null,function(err, result) {
                                if (err) {
                                    return console.error(err);
                                } else {                                
//                                    console.log("result", result);                            
                                    // Is skill already linked?
                                    var newlinkflag = true;
                                    for(var i=0;i<result.length;i++) {
//                                        console.log(id1, result[i]._id);
                                        if(id1 == result[i]._id) {
                                            newlinkflag = false;
                                        }
                                    }
                                    console.log(newlinkflag);
//                                    console.log("skillset",id1,name1,obj1);
//                                    console.log("skill",id2,name2,obj2);
                                    if(newlinkflag) {
                                        // Create new link
                                        obj1.skillref.push({"id":id2,"name":name2});
                                        obj2.skillsetref.push({"_id":id1,"name":name1});
                                    } else {
                                        // Update existing link
                                        for(var j=0;j<obj1.skillref.length;j++) {
                                            if(obj1.skillref[j].id==id2) {
                                                obj1.skillref[j].name = name2;
                                            }
                                        }
                                        for(var k=0;k<obj2.skillsetref.length;k++) {
                                            if(obj2.skillsetref[k]._id==id1) {
                                                obj2.skillsetref[k].name = name1;
                                            }
                                        }
                                    }
                                    obj1.save(function (err, result) {if (err) return console.error(err);});
                                    obj2.save(function (err, result) {if (err) return console.error(err);});
//                                    console.log("skillset",id1,name1,obj1);
//                                    console.log("skill",id2,name2,obj2);
                                    res.send({success: false, error: "info", newlink: newlinkflag, data:{id1:id1,name1:name1,id2:id2,name2:name2}});    
                                }
                            });
                            
                            
                        }
                    });
                }
            });
            break;
        case 'skilleduo':
            skill.findById(req.query.id1, function(err, result) {
                if (err) {
                    return console.error(err);
                } else {
                    obj1 = new skill(result);
                    name1 = result.name;
                    eduobjective.findById(id2, function(err, result) {
                        if (err) {
                            return console.error(err);
                        } else {
                            obj2 = new eduobjective(result);
                            name2 = result.name;
                            // Existing?
                            skill.find({'eduobjectiveref._id':id2},{name: 1},null,function(err, result) {
                                if (err) {
                                    return console.error(err);
                                } else {                                
                                    // Is skill already linked?
                                    var newlinkflag = true;
                                    for(var i=0;i<result.length;i++) {
                                        if(id1 == result[i]._id) {
                                            newlinkflag = false;
                                        }
                                    }
                                    console.log(newlinkflag);
                                    if(newlinkflag) {
                                        // Create new link
                                        obj1.eduobjectiveref.push({"_id":id2,"name":name2});
                                        obj2.skillref.push({"_id":id1,"name":name1});
                                    } else {
                                        // Update existing link
                                        for(var j=0;j<obj1.eduobjectiveref.length;j++) {
                                            if(obj1.eduobjectiveref[j].id==id2) {
                                                obj1.eduobjectiveref[j].name = name2;
                                            }
                                        }
                                        for(var k=0;k<obj2.skillref.length;k++) {
                                            if(obj2.skillref[k]._id==id1) {
                                                obj2.skillref[k].name = name1;
                                            }
                                        }
                                    }
                                    obj1.save(function (err, result) {if (err) return console.error(err);});
                                    obj2.save(function (err, result) {if (err) return console.error(err);});
                                    res.send({success: false, error: "info", newlink: newlinkflag, data:{id1:id1,name1:name1,id2:id2,name2:name2}});    
                                }
                            });
                            
                            
                        }
                    });
                }
            });
            break;
        case 'eduocontent':
            eduobjective.findById(req.query.id1, function(err, result) {
                if (err) {
                    return console.error(err);
                } else {
                    obj1 = new eduobjective(result);
                    name1 = result.name;
                    content.findById(id2, function(err, result) {
                        if (err) {
                            return console.error(err);
                        } else {
                            obj2 = new content(result);
                            name2 = result.name;
                            // Existing?
                            eduobjective.find({'contentref.id':id2},{name: 1},null,function(err, result) {
                                if (err) {
                                    return console.error(err);
                                } else {                                
                                    // Is skill already linked?
                                    var newlinkflag = true;
                                    for(var i=0;i<result.length;i++) {
                                        if(id1 == result[i]._id) {
                                            newlinkflag = false;
                                        }
                                    }
                                    console.log("Create new link:",newlinkflag);
                                    if(newlinkflag) {
                                        // Create new link
                                        obj1.contentref.push({"id":id2,"name":name2});
                                        // TODO: Also link eduo back to content
                                        obj2.eduobjectiveref.push({"_id":id1,"name":name1});
                                        console.log("Contentref in eduo:", obj1);
                                    } else {
                                        // Update existing link
                                        for(var j=0;j<obj1.contentref.length;j++) {
                                            if(obj1.contentref[j].id==id2) {
                                                obj1.contentref[j].name = name2;
                                            }
                                        }
                                        var backlink = false;
                                        for(var k=0;k<obj2.eduobjectiveref.length;k++) {
                                            if(obj2.eduobjectiveref[k]._id==id1) {
                                                // Backlink exists, only update name
                                                obj2.eduobjectiveref[k].name = name1;
                                                backlink = true;
                                            }
                                        }
                                        if( !backlink ) {
                                            // Create new backlink from content to eduobjective
                                            obj2.eduobjectiveref.push({"_id":id1,"name":name1});
                                        }
                                    }
                                    obj1.save(function (err, result) {if (err) return console.error(err);});
                                    obj2.save(function (err, result) {if (err) return console.error(err);});
                                    res.send({success: false, error: "info", newlink: newlinkflag, data:{id1:id1,name1:name1,id2:id2,name2:name2}});    
                                }
                            });
                            
                            
                        }
                    });
                }
            });
            break;
    
        
        default:
            // code
            res.send({success: false, error: "link: ["+req.query.pair+"] ("+req.query.id1+") and ("+req.query.id2+")"});
    }
/*    
    skillset.find({},function(err, result) {

        if (err) {
            res.send({success: false, error: "error "+err+" from db"});
            return console.error(err);
        }
        if(result.length > 0) {
            res.send({success: true, error: "no error", "skillsets": result});
        } else {
            res.send({success: false, error: "no skillset"});
        }
    }); 
*/
    
});
// Skillset Ende ////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////
//
// Skillset
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/skillset/getall", function(req, res) {
    console.log("Skillset getall");
    skillset.find({},function(err, result) {
//            console.log(err, result);
        if (err) {
            res.send({success: false, error: "error "+err+" from db"});
            return console.error(err);
        }
        if(result.length > 0) {
            res.send({success: true, error: "no error", "skillsets": result});
        } else {
            res.send({success: false, error: "no skillset"});
        }
    }); 
});
app.get("/api/0.1.0/skillset/lookupeduobj", function(req, res) {
    console.log("Skillset lookupeduobj");
    var query = '{}';
    var eduobjlist = new Array();
    
    if(req.query.id!='') {
        query = {"skillsetref._id": req.query.id};
    }
    skill.find(query,function(err,result){
        if (err) {
            return console.error(err);
        }
        if(result.length > 0) {
            for(var i=0; i<result.length; i++) {
                for(var j=0; j<result[i].eduobjectiveref.length; j++) {
                    eduobjlist.push(result[i].eduobjectiveref[j]._id);
                }
            }
        }
//        console.log("1",eduobjlist);
        
        for(i=0;i<eduobjlist.length;i++){
            eduobjlist[i] = mongoose.Types.ObjectId(eduobjlist[i]);
        }

//mongoose.Types.ObjectId()

//        var list = [eduobjlist[0],eduobjlist[1]];

        eduobjective.find({_id: {$in:eduobjlist}},function(err, eduobjs) {
            console.log("# eduobjectives for skillset", eduobjs.length);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(eduobjs.length > 0) {
                res.send({success: true, error: "no error", "eduobjectives": eduobjs});
            }
        });
    });
});
app.get("/api/0.1.0/skillset/get", function(req, res) {
    console.log("Skillset get", req.query.id);
    if(req.query.id) {
        skillset.find({_id: req.query.id},function(err, result) {
            console.log(err, result);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(result.length > 0) {
                res.send({success: true, error: "no error", "skillset": result[0]});
            } else {
                res.send({success: false, error: "no skillset with id "+req.query.id});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.id});
    }
});
app.get("/api/0.1.0/skillset/upsert", function(req, res) {
    console.log("Skillset add/update", req.query.id);
    if(req.query.id) {
        skillset.findByIdAndUpdate(req.query.id,{
            $set: {
                name: req.query.name,
                description: req.query.description,
                field: req.query.field,
                lang: req.query.lang,
                skillref: []
            }
            },{upsert:true},function(err, result) {
            console.log(err, result);
                if (err) {
                    res.send({success: false, error: "error "+err+" from db"});
                    return console.error(err);
                }
                if(result) {
                    res.send({success: true, error: "no error", "skillset": result});
                } else {
                    res.send({success: false, error: "no skillset with id "+req.query.id});
            }
        });
    } else {
        var NewSkillSet = new skillset({
            name: req.query.name,
            description: req.query.description,
            field: req.query.field,
            lang: req.query.lang,
            skillref: []
        });
        console.log("SkillSet", NewSkillSet);
        NewSkillSet.save(function (err, result) {
            if (err) return console.error(err);
            console.log("SkillSetResult: ", result);
            res.send({success: true, error: "no error", "skillset": result});    
        });
    }
});
app.get("/api/0.1.0/skillset/modify", function(req, res) {
    //
    //  id:string       Id of skillset to modify
    //  skillid:string  Id of skill to add or delete
    //  cmd:string      Command to execute, add, delete, new, md-...
    //  text:string     Payload: E.g. name of skill to add, content of masterdata
    //
    console.log("Skillset modify", req.query.id);
    if(req.query.id) {
        skillset.findOne({_id:req.query.id}, function(err, data) {
            console.log(err, data);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(data) {
                switch (req.query.cmd) {
                    case 'add':
                        data['skillref'].push({id:req.query.skillid,name:req.query.text});
                        data.save();
                        break;
                    case 'delete':
                        for( var i = 0; i < data['skillref'].length; i++) {
                            if ( data['skillref'][i]['id'] == req.query.skillid) {
                                data['skillref'].splice(i, 1);
                            }
                        }
                        console.log("skillset", data);
                        
                        data.save();
                        break;
                    default:
                        // code
                }
                res.send({success: true, error: "no error", "skillset": data});
            }
        });
/*
                    res.send({success: true, error: "no error", "skillset": result});
    } else {
        var NewSkillSet = new skillset({
            name: req.query.name,
            description: req.query.description,
            field: req.query.field,
            skillref: []
        });
        console.log("SkillSet", NewSkillSet);
        NewSkillSet.save(function (err, result) {
            if (err) return console.error(err);
            console.log("SkillSetResult: ", result);
            res.send({success: true, error: "no error", "skillset": result});    
        });
*/
    }
});
// Skillset Ende ////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////
//
// Content
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/content/getall", function(req, res) {
    console.log("Content getall");
        content.find({},function(err, result) {
            console.log(result);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(result) {
                res.send({success: true, error: "no error", "content": result});
            } else {
                res.send({success: false, error: "no content with id "+req.query.id});
            }
        }); 
});
app.get("/api/0.1.0/content/get", function(req, res) {
    console.log("Content get", req.query.id);
    if(req.query.id) {
        content.findOne({_id: req.query.id},function(err, result) {
            console.log(result);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(result) {
                res.send({success: true, error: "no error", "content": result});
            } else {
                res.send({success: false, error: "no content with id "+req.query.id});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.id});
    }
});
app.get("/api/0.1.0/content/upsert", function(req, res) {
    console.log("Content add/update", req.query.id);
    var type_text = [
        "YouTube Video",
        "Website Tutorial",
        "Video",
        "Presentation",
        "Online Presentation",
        "Audio Book",
        "Book",
        "Event",
        "Meetup Event"
    ];
    if(req.query.id) {
        content.findByIdAndUpdate(req.query.id,{
            $set: {
                name: req.query.name,
                description: req.query.description,
                type: parseInt(req.query.type,10),
                type_text: type_text[req.query.type-1],
                url: req.query.url,
                locator: req.query.locator,
                lang: req.query.lang
            }
            },{upsert:true},function(err, result) {
            console.log(err, result);
                if (err) {
                    res.send({success: false, error: "error "+err+" from db"});
                    return console.error(err);
                }
                if(result) {
                    res.send({success: true, error: "no error", "content": result});
                } else {
                    res.send({success: false, error: "no skill with id "+req.query.id});
            }
        });
    } else {
        var NewContent = new content({
            name: req.query.name,
            description: req.query.description,
            type: req.query.ctype,
            type_text: type_text[req.query.type-1],
            url: req.query.url,
            lang: req.query.lang
        });
        console.log("Content", NewContent);
        NewContent.save(function (err, result) {
            if (err) return console.error(err);
            console.log("ContResult: ", result);
            res.send({success: true, error: "no error", "content": result});    
        });
    }
});
// Content Ende ////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////
//
// Skills
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/skill/getall", function(req, res) {
    console.log("Skill get", req.query.id);
    
        skill.find({},function(err, result) {
            console.log(err, result);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(result.length > 0) {
                res.send({success: true, error: "no error", "skills": result});
            } else {
                res.send({success: false, error: "no skill with id "+req.query.id});
            }
        }); 
    
});
app.get("/api/0.1.0/skill/get", function(req, res) {
    console.log("Skill get", req.query.id);
    if(req.query.id) {
        skill.find({_id: req.query.id},function(err, result) {
            console.log(err, result);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(result.length > 0) {
                res.send({success: true, error: "no error", "skill": result[0]});
            } else {
                res.send({success: false, error: "no skill with id "+req.query.id});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.id});
    }
});
app.get("/api/0.1.0/skill/statistic", function(req, res) {
    console.log("Skill statistic", req.query.id);
    var statistic = {};
    var eduo = [];
    var ass = [];

//var ObjectId = mongoose.Types.ObjectId;
    
    if(req.query.id) {
        skill.findOne({_id: req.query.id},function(err, result) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(result) {
//                console.log(result.eduobjectiveref);
                // Create temp array of ids of eduobjectives of this skill
                eduo = [];
                for(var i=0;i<result.eduobjectiveref.length;i++) {
                    eduo.push(result.eduobjectiveref[i]._id);
                }
//                console.log(eduo);
                // Query details of all eduobjectives of this skill
                eduobjective.find({_id: {$in:eduo}},function(err, dialogs) {
        //            console.log(dialogs);
                    if (err) {
                        res.send({success: false, error: "error "+err+" from db"});
                        return console.error(err);
                    }
                    if(dialogs) {
//                        console.log("Skill has # of EduObjs:", dialogs.length);
                        ass = [];
                        for(var i=0;i<dialogs.length;i++) {
                            for(var j=0;j<dialogs[i].assignmentref.length;j++) {
                                if(!ass.includes(dialogs[i].assignmentref[j]._id)) {
                                    ass.push(dialogs[i].assignmentref[j]._id);   
                                }
                            }
                        }
                        statistic.ass_count = ass.length;
//                        console.log("Skill", req.query.id);
                        
                        user.find({skillref:{$elemMatch:{id:req.query.id}}},function(err, data) {
                            if(err) {}
                            if(data) {
//                                console.log("User", data.length);
                                }
                                statistic.cha_count = 22;
                                statistic.grp_count = 0;
                                statistic.skill_id = req.query.id;
                                statistic.user_workon = data.length;
                                statistic.user_success = data.length - 1;
                                res.send({success: true, error: "no error", "statistic": statistic});
                            }
                        );
                        //
                        // TODO: Determin # of challanges addressing eduobs of this skill
                        //
                    } else {
                        res.send({success: false, error: "no eduobjective for "+req.query.id});
                    }
                });                 
            } else {
                res.send({success: false, error: "no skill with id "+req.query.id});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.id});
    }
});
app.get("/api/0.1.0/skill/upsert", function(req, res) {
    console.log("Skill add/update", req.query.id);
    skill.findByIdAndUpdate(req.query.id,{ $set: { name: req.query.name, description: req.query.description, modul: req.query.modul, field: req.query.field, lang: req.query.lang }},{upsert:true},function(err, result) {
            console.log(err, result);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(result) {
                res.send({success: true, error: "no error", "skill": result});
            } else {
                res.send({success: false, error: "no skill with id "+req.query.id});
            }
    }); 
});
app.get("/api/0.1.0/skill/new", function(req, res) {
    console.log("new Skill", req.query);
    var newSkill = new skill({
        name: req.query.name,
        description: req.query.description,
        modul: req.query.modul,
        field: req.query.field,
        lang: req.query.lang,
        skillsetref: [{_id:req.query.skillsetid, name:req.query.skillsetname}]
    });
    console.log("New skill", newSkill);
    newSkill.save(function (err, result) {
        if (err) return console.error(err);
        console.log("NewSkillResult: ", result);
        res.send({success: true, error: "no error", "skill": result});    
    });
});
app.get("/api/0.1.0/skill/updateassignment", function(req, res) {
    console.log("EduObjective Assignment Update", req.query.id);
    if(req.query.id) { // query, fields, options, callback
        assignment.find({'eduobjref.id':req.query.id},{name: 1},null,function(err, assignments) {
            console.log(assignments);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(assignments!=null) { //assignmentref: assignments
                console.log("Update EduObj with Assignments:", req.query.id, assignments);
                eduobjective.updateOne({_id: mongoose.Types.ObjectId(req.query.id)}, { $set: { assignmentref: assignments } },function(err,result){ //mongoose.Types.ObjectId(req.query.id)
                  if(err){
                      console.log("Error:", err);
                  }
                  console.log("Result", result);
                  res.send({success: true, error: "no error", "eduobjective": result});
                });
//                res.send({success: true, error: "no error", "assignmentref": assignments});
            } else {
                res.send({success: false, error: "no eduobjective for "+req.query.id});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.token});
    }
});
app.get("/api/0.1.0/skill/setevaluation", function(req, res) {
    //id=5e09d00470877f375411433d&evaluation
    console.log("Set Skill Evaluation", req.query.id, JSON.parse(req.query.evaluation));
    
    if(req.query.id) {
        skill.findOne({_id: req.query.id},function(err, result) {
            console.log(result);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(result) {
                result.evaluation = JSON.parse(req.query.evaluation);
                console.log("Updated Skill: ", result);
                result.save(function (err, result) {
                    if (err) return console.error(err);
                    console.log("Saved Skill: ", result);
                    res.send({success: true, error: "no error", "skill": result});    
                });                
            } else {
                res.send({success: false, error: "no skill with id "+req.query.id});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.id});
    }
});


// Skill Ende ////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////
//
// EduObjective
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/eduobjective/get", function(req, res) {
    console.log("EduObjective", req.query.id);
    if(req.query.id) {
        eduobjective.find({_id: req.query.id},function(err, dialogs) {
            console.log(err, dialogs);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(dialogs.length > 0) {
                res.send({success: true, error: "no error", "eduobjective": dialogs[0]});
            } else {
                res.send({success: false, error: "no eduobjective for "+req.query.id});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.token});
    }
});
app.get("/api/0.1.0/eduobjective/list", function(req, res) {
    console.log("EduObjective", req.query.field, req.query.filter);
    var queryobj;
    if(req.query.field) {
        switch(req.query.field) {
            case 'modul':
                if(req.query.lang) {
                    queryobj = {
                        modul: req.query.filter,
                        lang: req.query.lang
                    };
                } else {
                    queryobj = {modul: req.query.filter};
                }                
                eduobjective.find(queryobj,function(err, dialogs) {
                    console.log(err, dialogs);
                    if (err) {
                        res.send({success: false, error: "error "+err+" from db"});
                        return console.error(err);
                    } 
                    res.send({success: true, error: "no error", "eduobjective": dialogs});
                });
                break;
            case 'field':
                if(req.query.lang) {
                    queryobj = {
                        field: req.query.filter,
                        lang: req.query.lang
                    };
                } else {
                    queryobj = {field: req.query.filter};
                }
                eduobjective.find(queryobj,function(err, dialogs) {
                    console.log(err, dialogs);
                    if (err) {
                        res.send({success: false, error: "error "+err+" from db"});
                        return console.error(err);
                    } 
                    res.send({success: true, error: "no error", "eduobjective": dialogs});
                });
                break;
            case 'lang':
                queryobj = {lang: req.query.filter};
                
                eduobjective.find(queryobj,function(err, dialogs) {
                    console.log(err, dialogs);
                    if (err) {
                        res.send({success: false, error: "error "+err+" from db"});
                        return console.error(err);
                    } 
                    res.send({success: true, error: "no error", "eduobjective": dialogs});
                });
                break;                
            default:
        }
    } else {
                if(req.query.lang) {
                    queryobj = {
                        lang: req.query.lang
                    };
                } else {
                    queryobj = {};
                }
                eduobjective.find(queryobj,function(err, dialogs) {
                    console.log(err, dialogs);
                    if (err) {
                        res.send({success: false, error: "error "+err+" from db"});
                        return console.error(err);
                    } 
                    res.send({success: true, error: "no error", "eduobjective": dialogs});
                });

    }
});
app.get("/api/0.1.0/eduobjective/save", function(req, res) {
//    console.log("EduObjective para", req.query);

    if(req.query.id) {
        eduobjective.findOne({_id: req.query.id},function(err, eduobj) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(eduobj) {
                // object to modify
                var edu1 = new eduobjective(eduobj);
                // from URL parameter to mongoose object
                var edu2 = new eduobjective(JSON.parse(req.query.eduobj));
                // copy data to db object
                edu1.name = edu2.name;
                edu1.type = edu2.type;
                edu1.taxonomie = edu2.taxonomie;
                edu1.lang = edu2.lang;
                edu1.modul = edu2.modul;
                edu1.field = edu2.field;
                edu1.skillref = edu2.skillref;
                edu1.assignmentref = edu2.assignmentref;
                edu1.contentref = edu2.contentref;
                edu1.challengeref = edu2.challengeref;
                edu1.save(function (err, edusave) {
                    if (err) {
                        console.log("Save:", err);
                        res.send({success: false, error: "not created"});
                    } else {
                        console.log("edu save: ",edusave._id);
                        res.send({success: true, error: "no error", "eduobjective": edusave});
                    }
                });  
            } else {
                res.send({success: false, error: "not created"});
            }
        }); 
    } else {
        var edu1 = new eduobjective();
        var edu2 = new eduobjective(JSON.parse(req.query.eduobj));
        edu1.name = edu2.name;
        edu1.type = edu2.type;
        edu1.taxonomie = edu2.taxonomie;
        edu1.lang = edu2.lang;
        edu1.modul = edu2.modul;
        edu1.field = edu2.field;
        edu1.skillref = edu2.skillref;
        edu1.assignmentref = edu2.assignmentref;
        edu1.contentref = edu2.contentref;
        edu1.challengeref = edu2.challengeref;
        edu1.save(function (err, edusave) {
            if (err) {
                console.log("Save:", err);
                res.send({success: false, error: "not created"});
            } else {
                console.log("edu new: ",edusave._id);
                res.send({success: true, error: "new edu created", "eduobjective": edusave});
            }
        });                
    }
});
app.get("/api/0.1.0/eduobjective/updateassignment", function(req, res) {
    console.log("EduObjective Assignment Update", req.query.id);
    if(req.query.id) { // query, fields, options, callback
        assignment.find({'eduobjref.id':req.query.id},{name: 1},null,function(err, assignments) {
            console.log(assignments);
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(assignments!=null) { //assignmentref: assignments
                console.log("Update EduObj with Assignments:", req.query.id, assignments);
                eduobjective.updateOne({_id: mongoose.Types.ObjectId(req.query.id)}, { $set: { assignmentref: assignments } },function(err,result){ //mongoose.Types.ObjectId(req.query.id)
                  if(err){
                      console.log("Error:", err);
                  }
                  console.log("Result", result);
                  res.send({success: true, error: "no error", "eduobjective": result});
                });
//                res.send({success: true, error: "no error", "assignmentref": assignments});
            } else {
                res.send({success: false, error: "no eduobjective for "+req.query.id});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.token});
    }
});
app.get("/api/0.1.0/eduobjective/lookup", function(req, res) {
    console.log("eduobjective lookup", req.query);
    if(req.query.field) {
        eduobjective.find().distinct(req.query.field,function(err, data) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            res.send({success: true, field: req.query.field, error: "lookup", lookup:data});
        }); 
    }
});

// EduObjective Ende ////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////
//
// Dialogs
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/dialogs/get", function(req, res) {
    console.log("Dialogs", req.query.token);
    if(req.query.token) {
        dialog.find({token:req.query.token, state: 1},null,{sort:{create_date: 1}},function(err, dialogs) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(dialogs.length > 0) {
                res.send({success: true, error: "dialogs for "+req.query.token, dialogs:dialogs});
            } else {
                res.send({success: false, error: "no dialogs for "+req.query.token});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.token});
    }
});

app.get("/api/0.1.0/dialogs/getactive", function(req, res) {
    console.log("Dialogs", req.query.token);
    if(req.query.token) {
        dialog.find({token:req.query.token, state: 1},null,{sort:{create_date: 1}},function(err, dialogs) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(dialogs.length > 0) {
                res.send({success: true, error: "dialogs for "+req.query.token, dialogcount:dialogs.length});
            } else {
                res.send({success: true, error: "no dialogs for "+req.query.token, dialogcount:0});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.token});
    }
});

app.get("/api/0.1.0/dialogs/getall", function(req, res) {
    console.log("Dialogs", req.query.token);
    if(req.query.token) {
        dialog.find({token:req.query.token},null,{sort:{create_date: -1}},function(err, dialogs) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(dialogs.length > 0) {
                res.send({success: true, error: "dialogs for "+req.query.token, dialogs:dialogs});
            } else {
                res.send({success: false, error: "no dialogs for "+req.query.token});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.token});
    }
});
app.get("/api/0.1.0/dialogs/add", function(req, res) {
    
    var token = req.query.token;
    var lang = req.query.lang;
    var type = req.query.type;
    var content = req.query.content;
    
    console.log("Dialogs", req.query, token, lang, type, content);

    if(token) {
        var dia1 = new dialog();
        
        dia1.token = token;
        dia1.lang = lang || "de";
        dia1.type = type;
        dia1.content = content;
        
        dia1.save(function (err, dia) {
            console.log("Save:", dia);
            if (err) {
                console.log("Save:", err);
                res.send({success: false, error: "not created"});
            } else {
                res.send({success: true, error: "dialog for "+token+" created"});
            }
        });
    } else {
        res.send({success: false, error: "token not valid"});
    }
});
app.get("/api/0.1.0/dialogs/reaction", function(req, res) {
    var id = req.query.id;
    var reaction = req.query.reaction;
    var text = req.query.text;

    console.log("Dialog reaction", id, reaction, text);
    if(id) {
        dialog.findOne({_id:id},function(err, dia) {
            if(err) {
                
            } else {
                //Find matching dialog
                //Update dialog status
                var reaction_ok = false;
                var new_state = 0;
                /************
                 * Reaction:
                 * 0:   Abort/deny
                 * 1-9: Button index
                 * 10:  ok
                 * 11:  delay
                 * 12:  ok, add skill
                 * 13:  ok, add text (log entry/comment)
                 * 
                 * Status:
                 * 1:   Active
                 * 2:   Postponed
                 * 3:   Done
                 * 4:   Cancled
                 ************/
                switch(reaction) {
                    case "0":
                        // code block
                        new_state = 4;
                        reaction_ok = true;
                        break;
                    case "1":
                    case "2":
                    case "3":
                    case "4":
                        // code block
                        new_state = 3;
                        reaction_ok = true;
                        break;
                    case "10":
                        new_state = 3;
                        reaction_ok = true;
                        break;
                    case "11":
                        new_state = 2;
                        var today = new Date;
                        // Add two days for the delay
                        dia.delay = new Date(today.getTime()+1000*60*60*48);
                        reaction_ok = true;
                        break;
                    case "12":
                        new_state = 3;
                        reaction_ok = true;
                        break;
                    case "13":
                        new_state = 3;
                        reaction_ok = true;
                        break;
                }                
                if(reaction_ok){
                    //Create reaction record and update local instance of dialog
                    dia.reaction.push({reaction_data: new Date, type: reaction, reponse:text});
                    dia.state = new_state;
                    //Update dialog with ammended reaction
                    dialog.updateOne({ _id: id }, dia, function(err, dia2){
                        if(err){
                            res.send({success: false, error: err});
                        } else {
                            res.send({success: true, error: "reaction for "+id+" created"});
                        }
                    });
                } else {
                    res.send({success: true, error: "wrong reaction ["+reaction+"] and status ["+new_state+"]["+dia.state+"]"});
                }
            } //else err
        }); //end find
    } else {
        res.send({success: false, error: "id not valid"});
    }
});

///////////////////////////////////////////////////////////////
//
// Log Entries
//
///////////////////////////////////////////////////////////////

app.get("/api/0.1.0/log/get", function(req, res) {
    console.log("Logs", req.query.token);
    if(req.query.token) {
        log.find({token:req.query.token},null,{sort:{create_date: -1},limit: 50},function(err, logentries) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(logentries.length > 0) {
                console.log("# log entries:", logentries.length);
                res.send({success: true, error: "log for "+req.query.token, logentries:logentries});
            } else {
                res.send({success: false, error: "no log for "+req.query.token});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.token});
    }
});
app.get("/api/0.1.0/log/month", function(req, res) {
    log.aggregate([
        { $project: {
            date: "$create_date",
            token: "$token",
            area: "$area",
            year:   { $year: "$create_date" },
            month:  { $month: "$create_date" },
            day:    { $dayOfMonth: "$create_date" },
            week:   { $week: "$create_date"}
            }
        },
        { $match : { "month" : parseInt(req.query.month,10), "year":parseInt(req.query.year,10) } },
        { $group: {
            _id: { a : "$day" }, // Group By Expression
            day: { $first: "$day"},
            date: { $first: "$date"},
            count: { $sum : 1 },
            user: {$push:{token:"$token"}}
            }
        },
        { $project: { 
            _id: 0,
            }
        },
        { $sort:{ day : 1 }
        }
    ])
    .exec(function(err, logentries) {
        if (err) {
            res.send({success: false, error: "error "+err+" from db"});
            return console.error(err);
        }
        if(logentries.length > 0) {
            console.log("Month# log entries:", logentries.length);
            res.send({success: true, error: "log entries", logentries:logentries});
        } else {
            console.log("Month# no log entries");
            res.send({success: false, error: "no log entries"});
        }
    }); 
});
app.get("/api/0.1.0/log/add", function(req, res) {
    var token = req.query.token;

//    console.log("Log add", token, req.query.type, req.query.message);

    if(token) {
        var log1 = new log();
        
        log1.token = token;
        log1.message = req.query.message;
        log1.type = req.query.type;
        log1.area = req.query.area;
        log1.scopeId = req.query.scopeId?req.query.scopeId:'empty';
        log1.extedId = req.query.extedId?req.query.extedId:'empty';
        log1.content = req.query.content;
        log1.lang = req.query.lang;

        log1.save(function (err, dia) {
            console.log("Save log item:", dia.token, dia.message, dia.area);
            if (err) {
                console.log("Save:", err);
                res.send({success: false, error: "not created"});
            } else {
                res.send({success: true, error: "log entry for "+token+" created: "+dia['_id'], id:dia['_id']});
            }
        });
    } else {
        res.send({success: false, error: "token not valid"});
    }
});

///////////////////////////////////////////////////////////////
//
// User v0.1.0
//
///////////////////////////////////////////////////////////////

app.get("/api/0.1.0/user/get", function(req, res) {
    // Parameter
    //  UserToken
    //
    console.log("/api/0.1.0/user/get");
    // Log Device parameter
    console.log("IP", req.ip);
    console.log("Token", req.query.UserToken);
    console.log("ClientId", req.query.ClientId);

    // TODO: move parameter 'UserToken' to 'token'

    if(req.query.UserToken) {
        user.findOne({token:req.query.UserToken},function(err, userdata) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(userdata) {
//                console.log("User:", userdata._id, userdata.assignmentrefs);
                res.send({success: true, error: "data for user "+req.query.UserToken, user:userdata});
            } else {
                res.send({success: false, error: "no user with token "+req.query.UserToken});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.UserToken});
    }
});
app.get("/api/0.1.0/user/toggleassignment", function(req, res) {
    // Parameter
    //  UserToken
    //
    console.log("/api/0.1.0/user/toggleassignment");
    var aid = -1;
    var assignmentitem;

    if(req.query.assignmentid) {
        assignmentitem = getAssignment(req.query.assignmentid);
        assignmentitem.then((data)=>{
            console.log("assignmentitem", data.name, data.type);
            if(req.query.id) {
                user.findOne({_id:req.query.id},function(err, userdata) {
                    if (err) {
                        res.send({success: false, error: "error "+err+" from db"});
                        return console.error(err);
                    }
                    if(userdata) {
                        for(var i=0;i<userdata.assignmentrefs.length;i++) {
                            if(userdata.assignmentrefs[i].id==req.query.assignmentid) {
                                aid = i;       
                                break;
                            }
                        }
                        switch(req.query.cmd) {
                            case "activate":
                                if(aid>-1) {
                                    // assignment available
                                    userdata.assignmentrefs[aid].status = "active";
                                    console.log("active existing");
                                    userdata.save();
                                } else {
                                    // new assignment for user
                                    userdata.assignmentrefs.push({id:req.query.assignmentid,name:data.name,status:'active',asstype:data.type});
                                    console.log("active new");
                                    userdata.save();
                                }
                                break;
                            case "inactivate":
                                userdata.assignmentrefs[aid].status = "inactive";
                                console.log("inactive existing");
                                userdata.save();
                                break;
                            default:
                        }
                        res.send({success: true, error: "user data", user:userdata});
                    } else {
                        res.send({success: false, error: "no user with token "+req.query.UserToken});
                    }
                }); 
            } else {
                res.send({success: false, error: "no valid token: "+req.query.id});
            }            
        });
    }
});
///////////////////////////////////////////////////////////////
//
// User Add
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/user/add", function(req, res) {
    ///// Add new user
    /// Check existance
    ///// Search for user with this token
    if(req.query.UserToken) {
        user.findOne({token:req.query.UserToken},function(err, userdata) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(userdata) {
                // User exists
                console.log("User:", userdata._id, userdata.assignmentrefs);
                res.send({success: true, error: "data for user "+req.query.UserToken, user:userdata});
            } else {
                // Create new user
                if(req.query.UserData) {
                    // New user with data
                    var stageuserdata = JSON.parse(req.query.UserData);
                    // Create default User
                    stageuserdata.token = req.query.UserToken;
                    var User1 = new user(stageuserdata);
                    console.log("New user data object", User1);
                    User1.save();
                    
                    // Create default Dialog
                    var Dialog1 = new dialog();
                    Dialog1.token = User1.token;
                    // TODO: set to selected language of user and update default text accordingly
                    Dialog1.lang = "de";
                    Dialog1.state = 1;
                    Dialog1.type = 1;
                    Dialog1.content = "Willkommen bei Aimy. Bitte beginne mit deinem ersten Auftrag und überprüfe, was du schon alles über die Bedienung von Aimy weisst. Dann kannst du schnell lernen, wie Aimy deine Daten schützt.";
                    Dialog1.save();
                } else {
                    // No data for new user
                }
                res.send({success: false, error: "no user with token "+req.query.UserToken});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.UserToken});
    }
});
app.get("/api/0.1.0/user/reload", function(req, res) {
    ///// Reload data from DB

    user.find(function (err, user) {
        if (err) return console.error(err);
        userList = user;
        console.log("userList aus MongoDB:", userList);
        res.send({success: true, function: "reload"});
    });
});
app.get("/api/0.1.0/user/list", function(req, res) {
    ///// List with all users

    user.find(function (err, user) {
        if (err) return console.error(err);
        userList = user;
        console.log("userList aus MongoDB:", userList.length);
//        res.send({success: true, function: "reload"});
        res.send(userList);
    });
});
app.get("/api/0.1.0/user/update", function(req, res) {
    user.findOne({token:req.query.UserToken}, function (err, user) {
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
app.get("/api/0.1.0/user/seteduoselfassess", function(req, res) {
    user.findOne({token:req.query.token}, function (err, userdata) {
        if (err) return console.error(err);
        // Found user with this token in database
        console.log("seteduoselfassess query:",req.query, userdata.eduobjectives);
        if(userdata) {
            var i = 0;
            for(i=0;i<userdata.eduobjectives.length;i++) {
                if(userdata.eduobjectives[i]._id==req.query.eduoid) {
                    userdata.eduobjectives[i].selfassess = req.query.value;
                    userdata.save(function (err, user) {
                        if (err) return console.error(err);
                    });
                    break;
                }
            }
            if(i==userdata.eduobjectives.length) {
                //New Selfassessment
                userdata.eduobjectives.push({_id: req.query.eduoid, name:'New EduObjective', selfassess: req.query.value});
                console.log(userdata.eduobjectives);
                userdata.save(function (err, userdata) {
                    if (err) return console.error(err);
                });
            }
        }
        // TODO
    });
    res.send({success: true, function: "seteduoselfassess"});
});
app.get("/api/0.1.0/user/setpreparatory", function(req, res) {

    
    user.findOne({token:req.query.token}, function (err, userdata) {
        if (err) return console.error(err);
        // Found user with this token in database
        console.log("seteduoselfassess query:",req.query);
        if(userdata) {
            var i = 0;
            for(i=0;i<userdata.assignmentrefs.length;i++) {
                if(userdata.assignmentrefs[i].id==req.query.assignment) {
                    userdata.assignmentrefs[i].preparatory = JSON.parse(req.query.answers);
//                    console.log("preparatory:", userdata.assignmentrefs[i]);
                    userdata.save(function (err, user) {
                        if (err) return console.error(err);
                        console.log("preparatory updated");
                    });
                    break;
                }
            }
/*
            if(i==userdata.eduobjectives.length) {
                //New Selfassessment
                userdata.eduobjectives.push({_id: req.query.eduoid, name:'New EduObjective', selfassess: req.query.value});
                console.log(userdata.eduobjectives);
                userdata.save(function (err, userdata) {
                    if (err) return console.error(err);
                });
            }
*/            
        }
        // TODO
    });
    res.send({success: true, function: "setpreparatory", assignment: req.query.assignment});
});
app.get("/api/0.1.0/user/setassessmentresult", function(req, res) {
    user.findOne({token:req.query.token}, function (err, userdata) {
        if (err) return console.error(err);
        // Found user with this token in database
//        console.log("setassessmentresult query:",req.query);
        if(userdata) {
            var i = 0;
            for(i=0;i<userdata.assignmentrefs.length;i++) {
                if(userdata.assignmentrefs[i].id==req.query.assignment) {
                    userdata.assignmentrefs[i].asstype = req.query.asstype;
                    userdata.assignmentrefs[i].tempresult = undefined;
                    if(userdata.assignmentrefs[i].results) {
                        userdata.assignmentrefs[i].results.push(JSON.parse(req.query.result));
                    }
                    else {
                        userdata.assignmentrefs[i].results.push(JSON.parse(req.query.result));
                    }
//                    console.log("assessment result:", userdata.assignmentrefs[i]);
//                    userdata.save(function (err, user) {
//                        if (err) return console.error(err);
//                        console.log("assessment result saved");
//                    });
                    break;
                }
            }
            // Update educational objectives with results
            var results = JSON.parse(req.query.result);
            for(i=0;i<userdata.eduobjectives.length;i++) {
//                console.log("User", i, userdata.eduobjectives[i]._id);
                for(var j=0;j<results.eduobj.length;j++) {
//                    console.log("Assessment", results.eduobj[j].id);
                    if(userdata.eduobjectives[i]._id==results.eduobj[j].id) {
                        console.log("Ok", userdata.eduobjectives[i]._id, req.query.asstype);
                        switch(req.query.asstype) {
                            case 'PK':
                                // PreKnowledge
                                userdata.eduobjectives[i].PK_asscount?userdata.eduobjectives[i].PK_asscount += 1:userdata.eduobjectives[i].PK_asscount = 1;
                                userdata.eduobjectives[i].PK_count?userdata.eduobjectives[i].PK_count += results.eduobj[j].count:userdata.eduobjectives[i].PK_count = results.eduobj[j].count;
                                userdata.eduobjectives[i].PK_ok?userdata.eduobjectives[i].PK_ok += results.eduobj[j].countok:userdata.eduobjectives[i].PK_ok = results.eduobj[j].countok;
                                break;
                            case 'SA':
                                // Self Atestation
                                userdata.eduobjectives[i].SA_asscount?userdata.eduobjectives[i].SA_asscount += 1:userdata.eduobjectives[i].SA_asscount = 1;
                                userdata.eduobjectives[i].SA_count?userdata.eduobjectives[i].SA_count += results.eduobj[j].count:userdata.eduobjectives[i].SA_count = results.eduobj[j].count;
                                userdata.eduobjectives[i].SA_ok?userdata.eduobjectives[i].SA_ok += results.eduobj[j].countok:userdata.eduobjectives[i].SA_ok = results.eduobj[j].countok;                                
/*                                if(userdata.eduobjectives[i].count) {
                                    userdata.eduobjectives[i].count = userdata.eduobjectives[i].count + results.eduobj[j].count;
                                } else {
                                    userdata.eduobjectives[i].count = results.eduobj[j].count;
                                }
                                if(userdata.eduobjectives[i].okcount) {
                                    userdata.eduobjectives[i].okcount = userdata.eduobjectives[i].okcount + results.eduobj[j].countok;
                                } else {
                                    userdata.eduobjectives[i].okcount = results.eduobj[j].countok;
                                }
*/                                break;
                            case 'MA':
                                // Mastery
                                userdata.eduobjectives[i].MA_asscount?userdata.eduobjectives[i].MA_asscount += 1:userdata.eduobjectives[i].MA_asscount = 1;
                                userdata.eduobjectives[i].MA_count?userdata.eduobjectives[i].MA_count += results.eduobj[j].count:userdata.eduobjectives[i].MA_count = results.eduobj[j].count;
                                userdata.eduobjectives[i].MA_ok?userdata.eduobjectives[i].MA_ok += results.eduobj[j].countok:userdata.eduobjectives[i].MA_ok = results.eduobj[j].countok;                                
                                break;                            
                        }
                    }
                }                
            }
            userdata.save(function (err, user) {
                if (err) return console.error(err);
                console.log("eduobj result saved");
            });
            

/*
            if(i==userdata.eduobjectives.length) {
                //New Selfassessment
                userdata.eduobjectives.push({_id: req.query.eduoid, name:'New EduObjective', selfassess: req.query.value});
                console.log(userdata.eduobjectives);
                userdata.save(function (err, userdata) {
                    if (err) return console.error(err);
                });
            }
*/            
        }
        // TODO
    });
    res.send({success: true, function: "setassessmentresult", result: req.query.result});
});

// settempassessmentresult
app.get("/api/0.1.0/user/settempassessmentresult", function(req, res) {
    user.findOne({token:req.query.token}, function (err, userdata) {
        if (err) return console.error(err);
        // Found user with this token in database
        var res = JSON.parse(req.query.result);
//        console.log("Temp assessment result",res);
        if(userdata) {
            // User found
            var i = 0;
            for(i=0;i<userdata.assignmentrefs.length;i++) {
                if(userdata.assignmentrefs[i].id==req.query.assignment) {
                    // Assignment exists in user data
                    userdata.assignmentrefs[i].tempresult = res;
                    break;
                }
            }
            userdata.save(function (err, user) {
                if (err) return console.error(err);
                console.log("Temp result saved for user", user.token);
            });
        }
    });
    res.send({success: true, function: "settempassessmentresult", result: req.query.result});
});

app.get("/api/0.1.0/user/setskillrating", function(req, res) {
    if(req.query.token && req.query.skillid)
    user.findOne({token:req.query.token}, function (err, userdata) {
        if (err) return console.error(err);
        // Found user with this token in database
        console.log("setskillrating:",req.query);
        if(userdata) {
            for(var i=0;i<userdata.skillref.length;i++) {
                if(userdata.skillref[i].id==req.query.skillid) {
                    userdata.skillref[i].rating = "75%";
                    userdata.skillref[i].togo = "Mastery noch zu machen";
                    userdata.save((err, user) => {
                        if (err) return console.error(err);
                        console.log("skillrating updated");
                        res.send({success: true, function: "setskillrating", rating: userdata.skillref[i].rating, togo: userdata.skillref[i].togo});
                    });
                    break;
                }
            }
        }
    });
});
app.get("/api/0.1.0/user/setskillstatus", function(req, res) {
    if(req.query.token && req.query.skillid && req.query.skillstatus)
    user.findOne({token:req.query.token}, function (err, userdata) {
        if (err) return console.error(err);
        // Found user with this token in database
        console.log("setskillstatus:",req.query);
        if(userdata) {
            for(var i=0;i<userdata.skillref.length;i++) {
                if(userdata.skillref[i].id==req.query.skillid) {
                    userdata.skillref[i].status = req.query.skillstatus;
                    userdata.save(function (err, user) {
                        if (err) return console.error(err);
                        console.log("skillstatus updated");
                        res.send({success: true, function: "setskillstatus", user: user});
                    });
                    break;
                }
            }
        }
    });
});
app.get("/api/0.1.0/user/getassignmentresults", function(req, res) {
    user.findOne({token:req.query.token}, function (err, userdata) {
        if (err) return console.error(err);
        // Found user with this token in database
        if(userdata) {
            var i = 0;
//            console.log("getassignmentresults query:",req.query, userdata);
            for(i=0;i<userdata.assignmentrefs.length;i++) {
                console.log("assignment",userdata.assignmentrefs[i].id,userdata.assignmentrefs[i].type);
                for(var j=0;j<userdata.assignmentrefs[i].results.length;j++) {
//                    console.log(userdata.assignmentrefs[i].results[j]);
                    for(var k=0;k<userdata.assignmentrefs[i].results[j].eduobj.length;k++) {
                        
//                        console.log("i j k", i, j, k, userdata.assignmentrefs[i].results[j].eduobj[k].id, req.query.eduobj);
                        if(userdata.assignmentrefs[i].results[j].eduobj[k].id==req.query.eduobj) {
                            
//                            assignment.findOne({_id:userdata.assignmentrefs[i].id},function(err, assignmentdata) {
//                                if (err) return console.error(err);
//                                console.log("assignment", assignmentdata);
//                            });
                            console.log("result", userdata.assignmentrefs[i].type ,userdata.assignmentrefs[i].id, req.query.eduobj,userdata.assignmentrefs[i].results[j].eduobj[k].countok,userdata.assignmentrefs[i].results[j].eduobj[k].count);
                        }   
                    }
                }
            }
        }
        // TODO
    });
    res.send({success: true, function: "getassignmentresults", assignment: req.query.assignment});
});
app.get("/api/0.1.0/user/addskill", function(req, res) {
//addskill", {params:{id: userid, skillid:skillid, name:name, description:description, status:status}}
    console.log("addSkill", req.query);
    user.findOne({_id:req.query.id}, function (err, userdata) {
        if (err) return console.error(err);
        // Found user with this id in database
        if(userdata) {

            userdata['skillref'].push({
                id:req.query.skillid,
                name:req.query.name,
                description:req.query.description,
                status: req.query.status
            });            
            
            userdata.save(function (err, userupd) {
                console.log("Save:", userupd);
                if (err) {
                    console.log("Save:", err);
                    res.send({success: false, error: "not created"});
                } else {
                    res.send({success: true, function: "addskill", user: userupd});
                }
            });
            
            
        }
    });
});
app.get("/api/0.1.0/user/getskillevaluation", function(req, res) {
    // Parameter
    //  token
    //  skillid
    //  mode
    //  refid
    //
//    console.log("/api/0.1.0/user/getskillevaluation", req.query);

    if(req.query.token) {
        var evaluationresult = {
            token: req.query.token,
            mode: req.query.mode,
            skill: req.query.skillid,
            assid: "",
            eduoid: "",
            result: false
        }
        user.findOne({token:req.query.token},function(err, userdata) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(userdata) {
                switch(req.query.mode) {
                    case '1':
                        console.log("Lernziel");
                        evaluationresult.eduoid = req.query.refid;
//                        console.log(req.query.refid);
//                        console.log(userdata.eduobjectives);
                        for(var i=0;i<userdata.eduobjectives.length;i++) {
                            if(userdata.eduobjectives[i]._id==req.query.refid) {
//                                console.log(req.query.threshold, parseInt(req.query.threshold,10));
//                                console.log(userdata.eduobjectives[i].MA_count**req.query.threshold,userdata.eduobjectives[i].MA_ok*100);
                                if(userdata.eduobjectives[i].MA_count*req.query.threshold<userdata.eduobjectives[i].MA_ok*100) {
                                    console.log("eduobj passed");   
                                    evaluationresult.result = true;
                                } else {
                                    console.log("eduobj not passed");
                                    evaluationresult.result = false;
                                }
                                break;
                            }
                        }
                        break;
                    case '2':
                        console.log("Auftrag");
                        evaluationresult.assid = req.query.refid;
                        for(var i=0;i<userdata.assignmentrefs.length;i++) {
                            if(userdata.assignmentrefs[i].id==req.query.refid) {
//                                console.log(req.query.threshold, parseInt(req.query.threshold,10));
//                                console.log(userdata.eduobjectives[i].MA_count**req.query.threshold,userdata.eduobjectives[i].MA_ok*100);
                                for(var j=0;j<userdata.assignmentrefs[i].results.length;j++) {
                                    if(userdata.assignmentrefs[i].results[j].pass) {
                                        evaluationresult.result = true;
                                        console.log("assignment passed");
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                        break;
                    default:
                        console.log("Default");
                        break;
                }
                res.send({success: true, error: "data for user", evaluation:evaluationresult});
            } else {
                res.send({success: false, error: "no user with token "+req.query.token});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.token});
    }
});
app.get("/api/0.1.0/user/lookup", function(req, res) {
    console.log("user lookup", req.query.field);
    if(req.query.field) {
        user.find().distinct(req.query.field,function(err, data) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            res.send({success: true, field: req.query.field, error: "lookup", lookup:data});
        }); 
    }
});
// User v0.1.0 Ende ////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////
//
// Review, Test, Verification, former Mastery, Überprüfung, Erfolgskontrolle, Lernzielkontrolle
//
///////////////////////////////////////////////////////////////

var reviewSchema = new Schema({
    name: String,
    status: ['upcoming','open','done'],
    type: String,
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

///api/0.1.0/assignment/get
app.get("/api/0.1.0/assignment/get", function(req, res) {
    console.log("Assignment", req.query.id);
    if(req.query.id) {
        assignment.findOne({_id:req.query.id},function(err, assignment) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            res.send({success: true, error: "assignment "+req.query.id, assignment:assignment});
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.id});
    }
});
app.get("/api/0.1.0/assignment/clone", function(req, res) {
    console.log("Clone Assignment", req.query.id);
    if(req.query.id) {
        assignment.findOne({_id:req.query.id},function(err, data) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            } else {
                if(data) {
                    let new_assignment = data.toObject();
                    delete new_assignment._id;
                    let new_assignment_doc = new assignment(new_assignment);
                    new_assignment_doc.save(function(err, newdata){
                        if (err) return console.error(err);
                        console.log("New cloned assignment id:",newdata._id);
                        res.send({success: true, error: "cloned assignment", assignment: newdata});
                    });
                }
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.id});
    }
});
app.get("/api/0.1.0/assignment/save", function(req, res) {
//    console.log("Save Assignment", req.query.id);
    if(req.query.id) {
        assignment.findOne({_id:req.query.id},function(err, data) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            } else {
                if(data) {
                    let new_assignment = JSON.parse(req.query.data);
/*
    learninggoal: [{
        name: String
    }],
    options: {
        start: Boolean,
        replay: Boolean,
        delay: Boolean,
        locked: Boolean,
        coach: Boolean
    },
    result: String,
*/
                    // copy all properties
                    data.challenges = new_assignment.challenges;
                    data.name = new_assignment.name;
                    data.status = new_assignment.status;
                    data.type = new_assignment.type;
                    data.modul = new_assignment.modul;
                    data.field = new_assignment.field;
                    data.lang = new_assignment.lang;
                    data.autor = new_assignment.autor;
                    data.group = new_assignment.group;
                    data.earlieststart = new_assignment.earlieststart;
                    data.latestend = new_assignment.latestend;
                    // save item                    
                    data.save(function(err, newdata){
                        if (err) return console.error(err);
                        console.log("Saved assignment id:",data._id);
                        res.send({success: true, error: "saved assignment", assignment: newdata});
                    });
                }
            }
        }); 
    } else {
        res.send({success: false, error: "no valid id: "+req.query.id});
    }
});
app.get("/api/0.1.0/assignment/list", function(req, res) {
    console.log("Assignment", req.query);
    var query = {};
    if(req.query.field) {
        switch(req.query.field) {
            case 'status':
                query = {status:req.query.filtertext};
                break;
            case 'type':
                query = {type:req.query.filtertext};
                break;
            case 'field':
                query = {field:req.query.filtertext};
                break;
            case 'modul':
                query = {modul:req.query.filtertext};
                break;  
        }
    } else {
        if(req.query.custom) {
            query = JSON.parse(req.query.custom);
        }
    }
    assignment.find(query,function(err, data) {
        if (err) {
            res.send({success: false, error: "error "+err+" from db"});
            return console.error(err);
        }
        res.send({success: true, error: "assignments", assignments:data});
    }); 
});
app.get("/api/0.1.0/assignment/lookup", function(req, res) {
    console.log("Assignment lookup", req.query);
    if(req.query.field) {
        assignment.find().distinct(req.query.field,function(err, data) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            res.send({success: true, field: req.query.field, error: "lookup", lookup:data});
        }); 
    }
});
app.get("/api/0.1.0/assignment/add", function(req, res) {
        var log1 = new assignment();
        
        log1.name = req.query.name;
        log1.status = req.query.status;
        log1.type = req.query.type;
        log1.field = req.query.field;
        log1.lang = req.query.lang;

        log1.save(function (err, dia) {
            console.log("Save:", dia);
            if (err) {
                console.log("Save:", err);
                res.send({success: false, error: "not created"});
            } else {
                res.send({success: true, error: "assignment created: "+dia['_id'], id:dia['_id']});
            }
        });
});

async function ass_updateeduobj(req, res){
    if(req.query.id) {
        var eduobjlist = [];
        var eduobitems = [];
        var doc;
        // Find the respected assignment
        try {
            doc = await assignment.findOne({_id:req.query.id}).exec();
            var chal = doc.challenges;
            for(var i=0; i<chal.length;i++) {
                try {
                    const doc1 = await challengeModel.findOne({_id:chal[i]}).exec();
//                    console.log("nach exec", i, doc1.eduobjectives);
                    for(var j=0;j<doc1.eduobjectives.length;j++) {
                       
                       if(eduobjlist.indexOf(doc1.eduobjectives[j].id)==-1) {
//                           console.log("eduo", i, j, doc1.eduobjectives[j]);
                           eduobjlist.push(doc1.eduobjectives[j].id);
                       }
                    }
                } catch (err) {
                    err.stack;
                }
            }
        } catch (err) {
          err.stack;
        }
        // Creation of array with ObjectIds for Mongoose
        for(var i=0; i<eduobjlist.length;i++) {
            eduobitems.push(mongoose.mongo.ObjectId(eduobjlist[i]));
        }
//        console.log("objectid", eduobitems);
        // Get details of all educational objectives in the list
        try {
            const doc3 = await eduobjectiveModel.find({_id:{$in:eduobitems}}).exec();
//            console.log("eduobj", doc3);
            eduobitems = [];
            for(i=0;i<doc3.length;i++) {
                eduobitems.push({id:doc3[i]._id,name:doc3[i].name});
            }
        } catch (err) {
            err.stack;
        }
        console.log("update assignment with eduobj:", eduobitems.length);
        doc.eduobjref = eduobitems;
        doc.save(function (err, dia) {
//            console.log("Save:", dia);
            if (err) {
                console.log("Save:", err);
                res.send({success: false, error: "not created"});
            } else {
                res.send({success: true, error: "no", assignment: dia});
            }
        });
    }
}
app.get("/api/0.1.0/assignment/updateeduobj", ass_updateeduobj);

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
// Assignment Result
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/assignresult/add", function(req, res) {
    console.log("Assignment Result add", req.query.token, req.query.assignid, req.query.rating);

    if(req.query.token && req.query.assignid) {
        var result = new assignresult();
        
        result.token = req.query.token;
        result.message = req.query.message;
        result.rating = req.query.rating;
        
        result.save(function (err, dia) {
            console.log("Save:", dia);
            if (err) {
                console.log("Save:", err);
                res.send({success: false, error: "not created"});
            } else {
                res.send({success: true, error: "assignment result entry for "+result.token+" created: "+dia['_id'], id:dia['_id']});
            }
        });
    } else {
        res.send({success: false, error: "token not valid"});
    }
});



// Assignment Result Ende ////////////////////////////////////////////////////////

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
    text: String,
    hint: String,
    lang: String,
    type: String,
    field: String,
    module: String,
    eduobjectives: [{id: String}],
    correct: [Number],
    answers: [String]
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

app.get("/api/0.1.0/challenge/getall", function(req, res) {
    console.log("/api/0.0.1/challenge/getall");
    challengeModel.find(function (err, challenge) {
        if (err) return console.error(err);
        console.log("Anzahl Challenges geladen:", challenge.length);
        res.send({success: true, challenges: challenge});
    });    
});

app.get("/api/0.0.1/challenge/get", function(req, res) {
    // Parameter
    //  id
    //
    var returnList = [];
    
    
    console.log("/api/0.0.1/challenge/get",req.query);
    // Log Device parameter
//db.getCollection('challenges').find({_id: { $in:[ObjectId("5d032bede7179a4e43247f48"),ObjectId("5d032bede7179a4e43247f48"),ObjectId("5d032bede7179a4e43247f48")]}})
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
//                console.log("Match:",idres[j], challengeList[i].name);
                returnList.push(challengeList[i]);
                ok = true;
            }
        }
    }

//    console.log("Line 2368", req.query.id);

/*
challengeModel.find({_id:req.query.id}, function (err, userdata) {
        if (err) return console.error(err);
        if(userdata) {
            console.log("db", userdata);
        }
});
*/
    
    if(ok) {
//        console.log("Challenges:",returnList);
        res.send(returnList);
    }
    else {
        console.log("No challenge found!");
        res.send({success: false, error: "no such challenge"});
    }
});
app.get("/api/0.1.0/challenge/getone", function(req, res) {
    //
    // id
    //
    console.log("/api/0.0.1/challenge/getone",req.query);

    challengeModel.find({_id:req.query.id}, function (err, userdata) {
        if (err) return console.error(err);
        if(userdata) {
            console.log("db", userdata);
            res.send({success: true, error: "no error", challenge: userdata});
        }
    });
});
app.get("/api/0.1.0/challenge/findbyeduobj", function(req, res) {
    //
    // id
    //
    //challenges: ({"eduobjectives.id":"5e2429b95ee29d51c471ced5"})
//    console.log("/api/0.1.0/challenge/findbyeduobj",req.query);

    challengeModel.find({"eduobjectives.id":req.query.id}, function (err, userdata) {
        if (err) return console.error(err);
        if(userdata) {
            console.log("Challenges to this eduobjective: ", userdata.length);
            res.send({success: true, error: "no error", challenges: userdata});
        }
    });
});
app.get("/api/0.1.0/challenge/set", function(req, res) {
    // Parameter
    //  id
    //
    console.log("/api/0.1.0/challenge/set", req.query);
    challengeModel.findOne({_id:req.query.id}, function (err, userdata) {
        if (err) return console.error(err);
        if(userdata) {
            console.log("1 Challenge:",userdata);
            var stageingdata = JSON.parse(req.query.challenge);
//            console.log("2 Challenge:",stageingdata);
            userdata.name = stageingdata.name;
            userdata.eduobjectives = stageingdata.eduobjectives;
            userdata.answers = stageingdata.answers;
            userdata.correct = stageingdata.correct;
            userdata.text = stageingdata.text;
            userdata.hint = stageingdata.hint;
            userdata.lang = stageingdata.lang;
            userdata.type = stageingdata.type;
            userdata.field = stageingdata.field;
            userdata.module = stageingdata.modul;
            console.log("3 Challenge:",userdata);
            userdata.save(function(err, usernewdata){
                if (err) return console.error(err);
                console.log("Save Challenge:",usernewdata);
                res.send({success: true, error: "update challenge", challenge: usernewdata});
            });
        } else {
            console.log("New Challenge:",req.query.challenge);
            stageingdata = JSON.parse(req.query.challenge);
            var Challenge1 = new challengeModel(stageingdata);
            console.log("New user data object", Challenge1);
            Challenge1.save(function(err, usernewdata){
                if (err) return console.error(err);
                console.log("Save Challenge:",usernewdata);
                res.send({success: true, error: "new challenge", challenge: usernewdata});
            });
        }
    });
});
app.get("/api/0.1.0/challenge/new", function(req, res) {
    // Parameter
    //  id
    //
//    console.log("/api/0.1.0/challenge/new", req.query);
    var stageingdata = JSON.parse(req.query.challenge);
    var Challenge1 = new challengeModel(stageingdata);
//    console.log("New user data object", Challenge1);
    Challenge1.save(function(err, usernewdata){
        if (err) return console.error(err);
        console.log("New Challenge:",usernewdata._id);
        res.send({success: true, error: "new challenge", challenge: usernewdata});
    });
});
app.get("/api/0.1.0/challenge/clone", function(req, res) {
    // Parameter
    //  id
    //
    console.log("/api/0.1.0/challenge/clone", req.query);
    challengeModel.findOne({_id:req.query.id}, function (err, userdata) {
        if (err) return console.error(err);
        if(userdata) {
//            let new_challenge = cleanId(userdata.toObject());
            let new_challenge = userdata.toObject();
            delete new_challenge._id;
            let new_challenge_doc = new challengeModel(new_challenge);
            console.log("Challenge to clone:",new_challenge_doc);
            new_challenge_doc.save(function(err, usernewdata){
                if (err) return console.error(err);
                console.log("New cloned challenge:",usernewdata);
                res.send({success: true, error: "update challenge", challenge: usernewdata});
            });
        }
    });
});

///////////////////////////////////////////////////////////////
//
// Group
//
///////////////////////////////////////////////////////////////
app.get("/api/0.1.0/group/create", function(req, res) {
    ///// Create a new group
    /// Check existance
    ///// Search for user with this token
    if(req.query) {
        var owner = JSON.parse(req.query.owner);
        var objects;
        if(req.query.objects) {
            objects = JSON.parse(req.query.objects);    
        } else {
            objects = [];
        }        
        var newGroup = new group({name:req.query.name, lang:req.query.lang, description:req.query.description, owner:owner, objecttype:req.query.objecttype,objects:objects});
        newGroup.add( (grp)=>{
            // console.log("cb",grp);
            res.send({success: true, error: "ok", data: newGroup});
        });

    } else {
        res.send({success: false, error: "no valid data: "+req.query});
    }
});
app.get("/api/0.1.0/group/read", function(req, res) {
    if(req.query.id) {
        group.findOne({_id:req.query.id},function(err, grp){
            if (err) return console.error(err);
            if(grp) {
                res.send({success: true, error: "ok", data: grp});
            } else {
                res.send({success: false, error: "group not available", data: grp}); 
            }
        });
    } else {
        res.send({success: false, error: "no valid data: "+req.query});
    }
});
app.get("/api/0.1.0/group/update", function(req, res) {
    ///// Update existing group
    ///
    /////
    
    var owner = JSON.parse(req.query.owner);
    var objects;
    if(req.query.objects) {
        objects = JSON.parse(req.query.objects);    
    } else {
        objects = [];
    }
    var data = {
        name: req.query.name,
        description: req.query.description,
        lang: req.query.lang,
        owner: owner,
        objecttype: req.query.objecttype,
        objects: objects
    };
    if(req.query.id) {
        group.findOne({_id:req.query.id},function(err, grp){
            if (err) return console.error(err);
            if(grp) {
                grp.update(data, (data)=>{
                    res.send({success: true, error: "ok", data: data});
                });
            } else {
                res.send({success: false, error: "group not available", data: grp}); 
            }
        });
    } else {
        res.send({success: false, error: "no valid data: "+req.query});
    }
});
app.get("/api/0.1.0/group/delete", function(req, res) {
    ///// Delete an existing group
    /// Check existance
    if(req.query.id) {
        group.findOne({_id:req.query.id},function(err, grp){
            if (err) return console.error(err);
            if(grp) {
                grp.delete((data)=>{
                    res.send({success: true, error: "ok", data: data});
                });
            } else {
                res.send({success: false, error: "group not available", data: grp}); 
            }
        });
    } else {
        res.send({success: false, error: "no valid data: "+req.query});
    }
});
app.get("/api/0.1.0/group/list", function(req, res) {
    ///// List all filtert grougs
    /// 
    ///// 
    if(req.query.filter) {
        var filter = JSON.parse(req.query.filter);
        group.find(filter,function(err, grp){
            if (err) return console.error(err);
            if(grp) {
                res.send({success: true, error: "ok filter", data: grp});
            } else {
                res.send({success: false, error: "group not available", data: grp}); 
            }
        });
    } else {
        group.find({},function(err, grp){
            if (err) return console.error(err);
            if(grp) {
                res.send({success: true, error: "ok all", data: grp});
            } else {
                res.send({success: false, error: "group not available", data: grp}); 
            }
        });
    }
});


//recursively remove _id fields
function cleanId(obj) {
    if (Array.isArray(obj))
        obj.forEach(cleanId);
    else {
        delete obj['_id'];
        for (let key in obj)
            if (typeof obj[key] == 'object')
                cleanId(obj[key]);
    }
}

// Challenge Ende ////////////////////////////////////////////////////////

async function getAssignment(id) {
    try {
        return await assignment.findOne({_id:id}).exec();
    } catch (err) {
        err.stack;
    }
}

app.get("/callback", function(req, res) {
    res.status(200).redirect("/");
//    res.status(200).redirect("/user");
});


app.get("/api/status", function(req, res) {
    console.log("Status requested from", req.ip);
    res.send(status);
});

var status = {
    "success":true,
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

//app.listen(process.env.PORT || 3000,'10.0.0.251');
app.listen(process.env.PORT || 3000, APP_CONFIG.BindIP);

console.log("Server started on port:",process.env.PORT || 3000);