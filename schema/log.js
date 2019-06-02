var mongoose = require("mongoose");
var Schema1 = mongoose.Schema;

var logSchema = new Schema1({
    token: { type: String, default: "t_test" },
    message: { type: String, default: "checkpoint" },
    type: { type: Number, default: 1 },//1 - ...
    area: { type: String, default: "basic" },
    create_date: { type: Date, default: Date.now },
    content: { type: String, default: "no content" },
    lang: { type: String, default: "de" },
});

logSchema.methods.findSimilarTypes = function(cb) {
    return this.model('Log').find({ type: this.type }, cb);
};
logSchema.methods.getName = function() {
    return "Log";
};
//logSchema.methods.addLogEntry = function(entry) {
//    return this.model('Log').({ type: this.type }, cb);    
//}
//logSchema.methods.getLogEntrys = function(entry) {
//    return this.model('Log').find({ type: this.type }, cb);    
//}

const logModel = mongoose.model('Log', logSchema);
module.exports = logModel;