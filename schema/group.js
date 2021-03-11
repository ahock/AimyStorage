var mongoose = require("mongoose");
var Schema1 = mongoose.Schema;

var groupSchema = new Schema1({
  name: String,
  create_date: { type: Date, default: Date.now },
  description: String,
  lang: { type: String, default: 'de' },
  owner: {
    type: { type: String, default: 'user' },
    id: String
  },
  objecttype: String,
  objects: [String]
});

groupSchema.methods.findSimilarTypes = function(cb) {
    return this.model('Group').find({ type: this.type }, cb);
};
groupSchema.methods.getName = function() {
    return "Group";
};
groupSchema.methods.add = function(cb) {

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
groupSchema.methods.update = function(data, cb) {
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




const groupModel = mongoose.model('Group', groupSchema);
module.exports = groupModel;