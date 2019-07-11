var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var contentSchema = new Schema({
    name: String,
    create_date: { type: Date, default: Date.now },
    lang: { type: String, default: 'de' },
    description: String,
    type: Number,
    type_text: String,
    url: String,
    eduobjectiveref: [{
        _id: String,
        name: String
    }]
});

const contentModel = mongoose.model('content', contentSchema);

module.exports = contentModel;