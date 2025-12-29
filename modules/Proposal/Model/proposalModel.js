const mongoose = require("mongoose");

const otherfieldCopySchema = new mongoose.Schema({
  jobType: {
    type: String,
    default: "",
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  isLaborTaxable: {
    type: Boolean,
    default: false,
  },
  copies: [
    {
      source: {
        type: String,
        enum: ["F&G", "Other", "Lump Sum","Labor","Drainage Lump Sum","Electrical Lump Sum","Hardscape Lump Sum","Irrigation Lump Sum","Landscape Lump Sum","Mosquito Lump Sum","Plumbing Lump Sum","Pool Lump Sum"],
      },
      type: {
        type: String,
        default: "",
        required: true,
      },
      vendorName: {
        type: String,
        default: "",
      },
      markup: {
        type: Number,
        default: 0,
        min: 0,
      },
      reference: {
        type: String,
        default: "",
      },
      measure: {
        type: String,
        default: "",
      },
      quantity: {
        type: Number,
        default: 0,
      },
      price: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalPrice: {
        type: Number,
        default: 0,
        min: 0,
      },
      invoice: {
        type: String,
        default: "",
      },
      PO: {
        type: String,
        default: "",
      },
      startDate: {
        type: String,
        default: "",
      },
      endDate: {
        type: String,
        default: "",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      isTaxable: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ["Active", "Delete"],
        default: "Active",
      },
    },
  ],
});

const proposalSchema = new mongoose.Schema(
  {
    projectCode: {
      type: String,
    },
    proposalId : {
      type: String,
      default : ""
    },
    copyIndex: {
      type: Number,
      default: 0,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    billingType: {
      type: String,
      enum: ["Bid", "No Bid"],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
      deafult: "",
    },
    customerEmail: {
      type: String,
      deafult: "",
    },
    customerType: {
      type: String,
      enum: ["Normal", "Commercial", "Exempt"],
      default: "Normal",
    },
    customerPhone: {
      type: String,
      default: "",
    },
    jobAddress: {
      type: String,
      default: "",
    },
    billAddress: {
      type: String,
      default: "",
    },
    jobName: {
      type: String,
      default: "",
    },
    foreman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
      default: null,
    },
    jobType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobType",
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    crew: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crew",
      },
    ],
    truckNo: {
      type: String,
      default: "",
    },
    trailerNo: {
      type: String,
      default: "",
    },
    projectManager: {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: "Crew",
      type: String,
      default: "",
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalManHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    officeFieldCopy: {
      type: [],
      default: [],
    },
    customerFieldCopy: {
      type: [],
      default: [],
    },
    bidedCopy: {
      type: [otherfieldCopySchema],
      default: [],
    },
    bidCopyId: {
      type: String,
      default: "",
    },
    officeCopyId: {
      type: String,
      default: "",
    },
    draftCopy: {
      type: [],
      default: [],
    },
    bidingDate: {
      type: String,
      default: "",
    },
    isProjectStarted: {
      type: Boolean,
      default: false,
    },
    projectStartDate: {
      type: String,
      default: "",
    },
    projectCompletedDate: {
      type: String,
      default: "",
    },
    startTime: {
      type: String,
      default: "",
    },
    endTime: {
      type: String,
      default: "",
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    isProjectTaxable: {
      type: Boolean,
      default: false,
    },
    nonTaxCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    nonTaxDescription: {
      type: String,
      default: "",
    },
    taxCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxDescription: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Ongoing", "Completed", "Delete", "Billed"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const ProposalModel = mongoose.model("Proposal", proposalSchema);

module.exports = ProposalModel;
