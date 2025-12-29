const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
        default : ""
    },
    measure : {
        type : String,
        default : ""
    },
    price : {
        type : Number,
        default : 0,
        min : 0,
        required : true
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

const materialModel = mongoose.model("Material", materialSchema);

module.exports = materialModel;