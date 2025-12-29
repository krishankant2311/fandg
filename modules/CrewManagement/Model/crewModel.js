const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
    crewName : {
        type : String,
        required : true
    },
    // labor : {
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "Labor",
    // },
    status : {
        type : String,
        enum : ["Active", "Delete"],
        default : "Active"
    }
});

module.exports = mongoose.model('Crew', crewSchema);