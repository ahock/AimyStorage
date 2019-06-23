var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var skillsetSchema = new Schema({
    name: String,
    create_date: { type: Date, default: Date.now },
    lang: { type: String, default: 'de' },
    description: String,
    field: String,
    skillref: [{id: String, name: String}],
});

const skillsetModel = mongoose.model('skillset', skillsetSchema);

module.exports = skillsetModel;