const mongoose = require("mongoose");

const otherTreatmentSchema = new mongoose.Schema(
  {
    treatmentName: {
      type: String,
      required: true,
      trim: true,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowerPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    programType: {
      type: String,
      enum: ["annual_program", "other"],
      default: "other",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Deleted"],
      default: "Active",
    },
  },
  { timestamps: true }
);

otherTreatmentSchema.index({ treatmentName: 1, status: 1 });

const OtherTreatment = mongoose.model("OtherTreatment", otherTreatmentSchema);

module.exports = OtherTreatment;
