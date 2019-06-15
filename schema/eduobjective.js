var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var eduobjectiveSchema = new Schema({
    name: String,
    create_date: { type: Date, default: Date.now },
    lang: String,
    type: { type: String, default: "Kennen" },
    taxonomie: { type: Number, default: 1},
    skillgoal: String,
    modul: String,
    field: String
});

const eduobjectiveModel = mongoose.model('eduobjective', eduobjectiveSchema);

module.exports = eduobjectiveModel;