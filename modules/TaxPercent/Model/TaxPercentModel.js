const mongoose = require('mongoose');

const taxPercentSchema = new mongoose.Schema({
    taxPercent : {
        type : Number,
        required : true,
        default : 0
    }
})

const TextPercentModel = mongoose.model('TextPercent', taxPercentSchema);

module.exports = TextPercentModel;

TextPercentModel.findOne()
  .then(async (result) => {
    if (result) {
      console.log("Default admin already exist");
    } else {
      let createTax = {
        taxPercent : 0
      };
      let saveResult = TextPercentModel(createTax).save();
      if (saveResult) {
        console.log("Tax saved successfully");
      } else {
        console.log("Failed to create ADMIN! ABORTING");
        return;
      }
    }
  })
  .catch((adminErr) => {
    console.log({ errror: adminErr });
    return;
});