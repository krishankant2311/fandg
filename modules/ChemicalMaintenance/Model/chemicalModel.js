const mongoose = require("mongoose");

const chemicalSchema = new mongoose.Schema(
  {
    chemicalName: {
      type: String,
    //   required: true,
      trim: true,
    //   maxlength: 100,
    },
    measure: {
      type: String,
    //   required: true,
      trim: true,
    //   maxlength: 100,
    },
    brandName: {
      type: String,
    //   required: true,
      trim: true,
    //   maxlength: 100,
    },
    status: {
      type: String,
      default: "Active",
    },
    type: {
      type: String,
    //   required: true,
      trim: true,
    //   maxlength: 100,
    },
    cost: {
      type: Number,
    //   required: true,
      min: 0,
    },
    price: {
      type: Number,
    //   required: true,
      min: 0,
    },
    isTaxable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Chemical = mongoose.model("Chemical", chemicalSchema);

module.exports = Chemical;