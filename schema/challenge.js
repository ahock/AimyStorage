var mongoose = require("mongoose");
var Schema1 = mongoose.Schema;

var challengeSchema = new Schema1({
    name: String,
    text: String,
    hint: String,
    lang: String,
    type: String,
    field: String,
    module: String,
    eduobjectives: [{id: String}],
    correct: [Number],
    answers: [String],
    texturl: String,
    answersurl: [String],
    hinturl: String
},{collection: 'challenges'});

challengeSchema.methods.findSimilarTypes = function(cb) {
    return this.model('Group').find({ type: this.type }, cb);
};
challengeSchema.methods.getName = function() {
    return "Group";
};
challengeSchema.methods.add = function(cb) {

    console.log(this);

//user.findOne({token:req.query.UserToken},function(err, userdata) {

//product.sold = Date.now();
//product = await product.save();

    this.save(function (err, group) {
        if (err) return console.error(err);
        cb(group);    
    });
};
//logSchema.methods.getLogEntrys = function(entry) {
//    return this.model('Log').find({ type: this.type }, cb);    
//}
challengeSchema.methods.update = function(data, cb) {
//    console.log(this);
    
    this.name = data.name;
    this.description = data.description;
    this.lang = data.lang;
    this.owner = data.owner;
    this.objecttype = data.objecttype;
    this.objects = data.objects;
    
//user.findOne({token:req.query.UserToken},function(err, userdata) {

//product.sold = Date.now();
//product = await product.save();

    this.save(function (err, group) {
        if (err) return console.error(err);
        cb(group);    
    });
};


const challengeModel = mongoose.model('Challenge', challengeSchema);
module.exports = challengeModel;