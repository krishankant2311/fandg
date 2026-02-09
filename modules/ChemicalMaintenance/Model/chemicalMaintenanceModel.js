const mongoose = require("mongoose");

// Schema for a single chemical entry inside a mix
const chemicalItemSchema = new mongoose.Schema(
  {
    chemicalName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 }, // OZ / 100 GAL
    measure: { type: String, default: "OZ / 100 GAL" },
    brandName: { type: String, trim: true },
    type: { type: String, trim: true },
    cost: { type: Number, default: 0, min: 0 }, // total cost for this chemical
    price: { type: Number, default: 0, min: 0 }, // total price for this chemical
    costPerOz: { type: Number, default: 0, min: 0 },
    pricePerOz: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const chemicalMaintenanceSchema = new mongoose.Schema(
  {
    mixName: {
      type: String,
      required: true,
      trim: true,
    },
    chemicals: [chemicalItemSchema],
    totalCostPerTank: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPricePerTank: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Deleted"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const ChemicalMaintenance = mongoose.model(
  "ChemicalMaintenance",
  chemicalMaintenanceSchema
);

module.exports = ChemicalMaintenance;