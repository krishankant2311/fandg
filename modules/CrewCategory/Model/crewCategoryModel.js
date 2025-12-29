const mongoose = require('mongoose');

const crewCategorySchema = new mongoose.Schema({
    crewCategoryName : {
        type : String,
        required : true,
        unique : true
    },
    status : {
        type : String,
        enum : ["Active", "Delete"],
        default : "Active"
    }
});

const CrewCategoryModel = mongoose.model("CrewCategory", crewCategorySchema);

module.exports = CrewCategoryModel;