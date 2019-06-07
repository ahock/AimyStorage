var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var assignresultSchema = new Schema({
    token: String,
    assignid: String,
    create_date: { type: Date, default: Date.now },
    rating: String
});

const assignresultModel = mongoose.model('AssignResult', assignresultSchema);

module.exports = assignresultModel;