const mongoose = require("mongoose");

const copyNumberSchema = new mongoose.Schema({
    copyNumber : {
        type : Number,
        required : true,
        min : 0
    }
});

const copyNumberModel = mongoose.model("CopyNumber",copyNumberSchema);

module.exports = copyNumberModel;