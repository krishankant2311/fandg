const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerName : {
        type : String,
        default : ""
    },
    customerEmail : {
        type : String,
        default : ""
    },
    customerPhone : {
        type : String,
        default : ""
    },
    jobAddress : [
        {
            type: String,
            default: ""
        }
    ],
    status : {
        type : String,
        enum : ["Active", "Delete"],
        default : "Active"
    }
},{
    timestamps: true
})

const customerModel = mongoose.model('Customer', customerSchema);

module.exports = customerModel;