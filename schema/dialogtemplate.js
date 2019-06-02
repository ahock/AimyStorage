var mongoose = require("mongoose");
var Schema1 = mongoose.Schema;

var dialogtemplateSchema = new Schema1({
    token: String,
    lang: String,
    create_date: { type: Date, default: Date.now },
    state: { type: Number, min: 1, max: 2, default: 1 },
    type: Number,
    content: Buffer, // oder String
    
    rating: String
});

//,{collection: 'dialog'});

// assign a function to the "methods" object of our animalSchema
dialogtemplateSchema.methods.findSimilarTypes = function(cb) {
    return this.model('Dialog').find({ type: this.type }, cb);
};

const dialogtemplateModel = mongoose.model('DialogTemplate', dialogtemplateSchema);





/*
console.log("User1", User1);
User1.save(function (err, User1) {
    if (err) return console.error(err);
});
*/

/*
var userList = [];

userDataModel.find(function (err, user) {
  if (err) return console.error(err);
  userList = user;
  console.log("Anzahl User geladen:", userList.length);
  // console.log("userList aus MongoDB:", userList);
});
*/

module.exports = dialogtemplateModel;