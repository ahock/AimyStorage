var mongoose = require("mongoose");
var Schema1 = mongoose.Schema;

var eduobjrefSchema = new Schema1({
    id: String,
    name: String
});

var assignmentSchema = new Schema1({
    name: { type: String, default: "t_test" },
    status: { type: String, default: "active" },
    type: { type: String, default: "Assessment" },
    description: { type: String, default: "..." },
    lang: { type: String, default: "de" },
    field: { type: String, default: "basic" },
    modul: { type: String, default: "Service Design" },
    rating: { type: String, default: "no content" },
    rubic: { type: String, default: "..." },
    unit: { type: String, default: "LLP" },
    unitmax: { type: Number, default: 40 },
    unitpass: { type: Number, default:  26 },
    earlieststart: { type: Date, default: Date.now },
    latestend: { type: Date },
    group: { type: String, default: "Aimy-Neueinsteiger 2018" },
    startmode: { type: String, default: "individuel" },//group, individuel, ...
    durationunit: { type: String, default: "Minuten" },
    duration: { type: Number, default: 60 },
    create_date: { type: Date, default: Date.now },
    autor: { type: String, default: "Andreas Hock" },
    coautor: { type: String, default: "Andreas Hock" },
    coach: { type: String, default: "Andreas Hock" },
    challenges: [String],
    eduobjref: [eduobjrefSchema],
    challengemode: { type: String, default: "single" },
});

const assignmentModel = mongoose.model('Assignment', assignmentSchema);
module.exports = assignmentModel;