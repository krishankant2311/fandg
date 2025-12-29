const mongoose = require('mongoose');

const jobTypeSchema = new mongoose.Schema({
    jobName : {
        type : String,
        default : ""
    },
    price : {
        type : Number,
        default : 0,
        min : 0,
    },
    isTaxable : {
        type : Boolean,
        default : false
    },
    status : {
        type : String,
        enum : ["Active", "Delete"],
        default : "Active"
    }
})

const JobTypeModel = mongoose.model("JobType", jobTypeSchema);

module.exports = JobTypeModel;