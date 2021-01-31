var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema({
    token: String,
    email: String,
    firstname: String,
    lastname: String,
    last_login: String,
    login_history: [String],
    groups: [String],
    assignmentrefs: [{
        id: String,
        name: String,
        status: String,

//        active: Date,
//        submitted: Date,
//        due: Date,
//        attempts: String,
//        rating: String,
//        comments: String,
        asstype: String,
        preparatory: {physically: String, mental: String, preparation: String},
        results: [{}],
        tempresult: []
    }],
    eduobjectives: [{
        _id: String,
        name: String,
        selfassess: String,
        ///////////////////
        //
        //  assessment types
        //
        //  PreKnowledge: PK
        //  SelfAtest: SA
        //  External Assessment: EA
        //  Mastery: MA
        //
        ///////////////////
        PK_asscount: Number(),
        PK_count: Number(),
        PK_ok: Number(),
        SA_asscount: Number(),
        SA_count: Number(),
        SA_ok: Number(),

        MA_asscount: Number(),
        MA_count: Number(),
        MA_ok: Number(),

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