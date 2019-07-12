var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema({
    token: String,
    email: String,
    firstname: String,
    lastname: String,
    last_login: Date,
    login_history: [String],
    groups: [String],
    eduobjectives: [{
        _id: String,
        name: String,
        selfassess: String,
        resume: String,
        preknowledge: String,
        selfatest: String,
        extatest: String,
        mastery: String
    }],
    reviews: [{refid: String, name: String}],
    lang: String
});

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;