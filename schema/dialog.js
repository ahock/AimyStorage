var mongoose = require("mongoose");
var Schema1 = mongoose.Schema;

var reactionSchema = new Schema1({
    reaction_data: Date,
    type: Number, //1:confirm, 2:comment, 3:postpone
    reponse: String
});

var dialogSchema = new Schema1({
    token: { type: String, default: "t_test" },
    lang: { type: String, default: "de" },
    create_date: { type: Date, default: Date.now },
    delay: Date,
    state: { type: Number, min: 1, max: 4, default: 1 },
    type: { type: Number, default: 1 },//1 - ...
    content: { type: String, default: "" },// Buffer oder String
    reaction: [reactionSchema],
    rating: String
});

//,{collection: 'dialog'});

// assign a function to the "methods" object of our animalSchema
dialogSchema.methods.findSimilarTypes = function(cb) {
    return this.model('Dialog').find({ type: this.type }, cb);
};
dialogSchema.methods.getName = function() {
    return "Dialog";
};


const dialogModel = mongoose.model('Dialog', dialogSchema);





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

module.exports = dialogModel;