var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var skillSchema = new Schema({
    name: String,
    create_date: { type: Date, default: Date.now },
    lang: { type: String, default: 'de' },
    description: String,
    modul: String,
    field: String,
    skillsetref: [{_id: String, name: String}],
    eduobjectiveref: [{_id: String, name: String}],
});

const skillModel = mongoose.model('skill', skillSchema);

module.exports = skillModel;