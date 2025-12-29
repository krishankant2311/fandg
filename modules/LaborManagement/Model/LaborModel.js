const mongoose = require('mongoose');

const laborSchema = new mongoose.Schema({
    jobType : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'JobType'
    },
    jobName : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    measure : {
        type : String,
        default : "Hrs"
    },
    isTaxable : {
        type : Boolean,
        default : true
    },
    status : {
        type : String,
        enum : ['Active', 'Delete'],
        default : 'Active'
    }
});

const LaborModel = mongoose.model('Labor', laborSchema);

module.exports = LaborModel;