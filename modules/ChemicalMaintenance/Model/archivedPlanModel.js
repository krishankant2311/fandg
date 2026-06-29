const mongoose = require("mongoose");

const completedTreatmentSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    treatment: { type: String, trim: true },
    qty: { type: Number, default: 0 },
    date: { type: Date },
    price: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    status: { type: String, trim: true },
    projectCode: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const archivedPlanSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChemicalCustomer",
      required: true,
    },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    customerPhone: { type: String, trim: true },
    jobAddress: { type: String, trim: true },
    planYear: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Expired", "Archived"],
      default: "Archived",
    },
    contractTotal: { type: Number, min: 0, default: 0 },
    usedAmount: { type: Number, min: 0, default: 0 },
    remainingAmount: { type: Number, min: 0, default: 0 },
    isChemicalMaintenanceEnabled: { type: Boolean, default: false },
    description: { type: String, trim: true, default: "" },
    annualTreatments: { type: Array, default: [] },
    otherTreatments: { type: Array, default: [] },
    completedTreatments: { type: [completedTreatmentSchema], default: [] },
    expiredAt: { type: Date },
    archivedAt: { type: Date, default: Date.now },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: true }
);

archivedPlanSchema.index({ customerId: 1, planYear: -1 });
archivedPlanSchema.index({ planYear: -1, customerName: 1 });

const ArchivedPlan = mongoose.model("ArchivedPlan", archivedPlanSchema);

module.exports = ArchivedPlan;
