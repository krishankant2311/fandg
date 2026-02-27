// const mongoose = require("mongoose");

// // Annual treatment row (fixed list in UI)
// const annualTreatmentSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     // Quantity selected for this annual treatment (can be empty / optional)
//     quantity: { type: Number, default: 0, min: 0 },
//     // Scheduled date for this annual treatment
//     scheduleDate: { type: Date },
//     // Total monthly additional cost for this treatment (already multiplied by quantity)
//     price: { type: Number, default: 0, min: 0 },
//     // Total monthly cost (cost * quantity)
//     cost: { type: Number, default: 0, min: 0 },
//     // Treatment status (free text, no enum)
//     status: { type: String, trim: true },
//   },
//   { _id: false }
// );

// // "Other Treatments" rows added dynamically in UI
// const otherTreatmentSchema = new mongoose.Schema(
//   {
//     treatment: { type: String, required: true, trim: true },
//     qty: { type: Number, required: true, min: 1 },
//     date: { type: Date, required: true },
//     // Full chemical mix data (optional, if mix was selected)
//     mixName: { type: String, trim: true },
//     mixId: { type: String, trim: true },
//     chemicals: { type: Array, default: [] }, // Array of chemicals in the mix
//     totalCostPerTank: { type: Number, default: 0 },
//     totalPricePerTank: { type: Number, default: 0 },
//     // Treatment status (free text, no enum)
//     status: { type: String, trim: true },
//   },
//   { _id: false }
// );

// const chemicalCustomerSchema = new mongoose.Schema(
//   {
//     // Basic customer info (duplicated from main Customer for isolation)
//     customerName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     customerEmail: {
//       type: String,
//       trim: true,
//       lowercase: true,
//     },
//     customerPhone: {
//       type: String,
//       trim: true,
//     },
//     jobAddress: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     // Whether Chemical Maintenance is enabled for this customer
//     isChemicalMaintenanceEnabled: {
//       type: Boolean,
//       default: false,
//     },

//     // Annual treatment program rows (fixed table)
//     annualTreatments: [annualTreatmentSchema],

//     // Additional / custom treatments from "OTHER TREATMENTS" table
//     otherTreatments: [otherTreatmentSchema],

//     status: {
//       type: String,
//       enum: ["Active", "Deleted"],
//       default: "Active",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const ChemicalCustomer = mongoose.model(
//   "ChemicalCustomer",
//   chemicalCustomerSchema
// );

// module.exports = ChemicalCustomer;



const mongoose = require("mongoose");

// Annual treatment row (fixed list in UI)
const annualTreatmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Quantity selected for this annual treatment (can be empty / optional)
    quantity: { type: Number, default: 0, min: 0 },
    // Scheduled date for this annual treatment
    scheduleDate: { type: Date },
    // Total monthly additional cost for this treatment (already multiplied by quantity)
    price: { type: Number, default: 0, min: 0 },
    // Total monthly cost (cost * quantity)
    cost: { type: Number, default: 0, min: 0 },
    // Treatment status (free text, no enum)
    status: { type: String, trim: true },
  },
  { _id: false }
);

// "Other Treatments" rows added dynamically in UI
const otherTreatmentSchema = new mongoose.Schema(
  {
    treatment: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    // Full chemical mix data (optional, if mix was selected)
    mixName: { type: String, trim: true },
    mixId: { type: String, trim: true },
    chemicals: { type: Array, default: [] }, // Array of chemicals in the mix
    totalCostPerTank: { type: Number, default: 0 },
    totalPricePerTank: { type: Number, default: 0 },
    // Treatment status (free text, no enum)
    status: { type: String, trim: true },
  },
  { _id: false }
);

const chemicalCustomerSchema = new mongoose.Schema(
  {
    // Basic customer info (duplicated from main Customer for isolation)
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    jobAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional description (from Add New Customer form)
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Whether Chemical Maintenance is enabled for this customer
    isChemicalMaintenanceEnabled: {
      type: Boolean,
      default: false,
    },

    // Annual treatment program rows (fixed table)
    annualTreatments: [annualTreatmentSchema],

    // Additional / custom treatments from "OTHER TREATMENTS" table
    otherTreatments: [otherTreatmentSchema],

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

const ChemicalCustomer = mongoose.model(
  "ChemicalCustomer",
  chemicalCustomerSchema
);

module.exports = ChemicalCustomer;

