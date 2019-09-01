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
    assignmentrefs: [{
        id: String,
        name: String,
        status: String,
        active: Date,
        submitted: Date,
        due: Date,
        attempts: String,
        rating: String,
        comments: String
    }],
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
    lang: String,
    skillref: [{
        id: String,
        name: String,
        description: String,
        status: String,
        togo: String,
        rating: String
    }],
});

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;