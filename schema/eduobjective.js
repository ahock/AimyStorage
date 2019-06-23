var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var eduobjectiveSchema = new Schema({
    name: String,
    create_date: { type: Date, default: Date.now },
    lang: String,
    type: { type: Number, default: 1 },
    taxonomie: { type: Number, default: 1},
    modul: String,
    field: String,
    skillref: [{_id: String, name: String}],
    assignmentref: [{_id: String, name: String}],
    challengeref: [{_id: String, name: String}],
    contentref: [{
        _id: String,
        name: String,
        priority: Number,
        locator: { type: String, default: "mm.ss" }
    }]
});

const eduobjectiveModel = mongoose.model('eduobjective', eduobjectiveSchema);

module.exports = eduobjectiveModel;