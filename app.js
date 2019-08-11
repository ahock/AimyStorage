var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var path = require("path");

var dialog = require("./schema/dialog.js");
var assignment = require("./schema/assignment.js");
var assignresult = require("./schema/assignresult.js");
var log = require("./schema/log.js");
var eduobjective = require("./schema/eduobjective.js");
var skill = require("./schema/skill.js");
var skillset  = require("./schema/skillset.js");
var content = require("./schema/content.js");
var user = require("./schema/user.js");

var APP_CONFIG = require("./app-variables.js");

console.log("NODE_ENV", process.env.NODE_ENV || "test");

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
// Skillset Ende ////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////
//
// Content
//
///////////////////////////////////////////////////////////////
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
                type: req.query.ctype,
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
                    res.send({success: true, error: "no error", "skill": result});
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
app.get("/api/0.1.0/skill/upsert", function(req, res) {
    console.log("Skill add/update", req.query.id);
    skill.findByIdAndUpdate(req.query.id,{ $set: { name: req.query.name, description: req.query.description, modul: req.query.modul, field: req.query.field }},{upsert:true},function(err, result) {
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
        log.find({token:req.query.token},null,{sort:{create_date: -1}},function(err, logentries) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(logentries.length > 0) {
                res.send({success: true, error: "dialogs for "+req.query.token, logentries:logentries});
            } else {
                res.send({success: false, error: "no dialogs for "+req.query.token});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.token});
    }
});
app.get("/api/0.1.0/log/add", function(req, res) {
    var token = req.query.token;

    console.log("Log add", token, req.query.type, req.query.message);

    if(token) {
        var log1 = new log();
        
        log1.token = token;
        log1.message = req.query.message;
        log1.type = req.query.type;
        log1.area = req.query.area;
        log1.content = req.query.content;
        log1.lang = req.query.lang;

        log1.save(function (err, dia) {
            console.log("Save:", dia);
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
        user.find({token:req.query.UserToken},null,{sort:{token: -1}},function(err, userdata) {
            if (err) {
                res.send({success: false, error: "error "+err+" from db"});
                return console.error(err);
            }
            if(userdata[0]) {
                console.log("User:", userdata[0]);
                res.send({success: true, error: "data for user "+req.query.UserToken, user:userdata[0]});
            } else {
                res.send({success: false, error: "no user with token "+req.query.UserToken});
            }
        }); 
    } else {
        res.send({success: false, error: "no valid token: "+req.query.UserToken});
    }
});
app.get("/api/0.1.0/user/add", function(req, res) {
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
        // Create default User
        stageuserdata.token = req.query.UserToken;
        stageuserdata.last_login = new Date();

//        newuserflag = false;
    }
    else {
        console.log("User with token:", userList[j].token);
        res.send({success: false, error: "user exists"});
    }
    /// Create object and save
    if(newuserflag) {
        var User1 = new userDataModel(stageuserdata);
        // Create default Dialog
        var Dialog1 = new dialog();
        Dialog1.token = User1.token;
        // TODO: set to selected language of user and update default text accordingly
        Dialog1.lang = "de";
        Dialog1.state = 1;
        Dialog1.type = 1;
        Dialog1.content = "Willkommen bei Aimy. Geniesse deine Entwicklung.";
        Dialog1.save();
        
        // Create default Skill
        User1.skillref[0] = JSON.parse("{id:'5cc491863af9f00acc95c435'}");

        console.log("New user data object", User1);
        User1.save();
        userList.push(User1);
        console.log("Save new user!", User1, userList);
        res.send({success: true, error: "user created"});
    }
});
app.get("/api/0.1.0/user/reload", function(req, res) {
    ///// Reload data from DB

    userDataModel.find(function (err, user) {
        if (err) return console.error(err);
        userList = user;
        console.log("userList aus MongoDB:", userList);
        res.send({success: true, function: "reload"});
    });
});
app.get("/api/0.1.0/user/list", function(req, res) {
    ///// List with all users

    console.log("userList from memory:", userList.length);
    res.send(userList);
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
// User v0.1.0 Ende ////////////////////////////////////////////////////////


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
    eduobjectives: [{id: String, name: String, selfassess: String, field: String, notes: String}],
    masteries: [masteryData],
    reviews: [{refid: String, name: String}],
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

    console.log("userList from memory:", userList.length);
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
app.get("/api/0.0.1/user/seteduoselfassess", function(req, res) {
    userDataModel.findOne({token:req.query.token}, function (err, user) {
        if (err) return console.error(err);
        // Found user with this token in database
        console.log("Query:",req.query, user.eduobjectives);
        if(user) {
            var i = 0;
            for(i=0;i<user.eduobjectives.length;i++) {
//                console.log(user.eduobjectives[i].id);
                if(user.eduobjectives[i].id==req.query.eduoid) {
                    user.eduobjectives[i].selfassess = req.query.value;
                    user.save(function (err, user) {
                        if (err) return console.error(err);
                    });
                    break;
                }
            }
            if(i==user.eduobjectives.length) {
                //New Selfassessment
                user.eduobjectives.push({id: req.query.eduoid, name:'New EduObjective', selfassess: req.query.value});
//                console.log(user.eduobjectives);
                user.save(function (err, user) {
                    if (err) return console.error(err);
                });
            }
        }
        // TODO
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

app.listen(process.env.PORT || 3000,'10.0.0.251');

console.log("Server started on port:",process.env.PORT || 3000);