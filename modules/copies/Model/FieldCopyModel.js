const mongoose = require("mongoose");

const fieldCopySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  crew: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "crews",
      },
      crewName: {
        type: String,
      },
    },
  ],
  note: {
    type: String,
    default: "",
  },
  entryDate: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startTime: {
    type: String,
    default: "",
  },
  endTime: {
    type: String,
    default: "",
  },
  laborCount: {
    type: Number,
    default: 0,
  },
  totalHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  draftCopies: [
    {
      jobType: {
        type: String,
        default: "",
      },
      totalCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      perHourCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalManHours: {
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
            enum: [
              "F&G",
              "Other",
              "Lump Sum",
              "Labor",
              "Drainage Lump Sum",
              "Electrical Lump Sum",
              "Hardscape Lump Sum",
              "Irrigation Lump Sum",
              "Landscape Lump Sum",
              "Mosquito Lump Sum",
              "Plumbing Lump Sum",
              "Pool Lump Sum",
            ],
          },
          type: {
            type: String,
            default: "",
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
          startTime: {
            type: String,
            default: "",
          },
          endTime: {
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
    },
  ],
  fieldCopies: [
    {
      jobType: {
        type: String,
        default: "",
      },
      totalCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      jobTypeCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      manHours: {
        type: Number,
        default: 0,
        min: 0,
      },
      isLaborTaxable: {
        type: Boolean,
        default: false,
      },
      startTime: {
        type: String,
        default: "",
      },
      endTime: {
        type: String,
        default: "",
      },
      copies: [
        {
          source: {
            type: String,
            enum: [
              "F&G",
              "Other",
              "Lump Sum",
              "Labor",
              "Drainage Lump Sum",
              "Electrical Lump Sum",
              "Hardscape Lump Sum",
              "Irrigation Lump Sum",
              "Landscape Lump Sum",
              "Mosquito Lump Sum",
              "Plumbing Lump Sum",
              "Pool Lump Sum",
            ],
          },
          type: {
            type: String,
            default: "",
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
          startTime: {
            type: String,
            default: "",
          },
          endTime: {
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
    },
  ],
  status : {
    type : String,
    enum : ["Active", "Delete"],
    default : "Active"
  }
});

const fieldCopyModel = mongoose.model("FieldCopyHistory", fieldCopySchema);

module.exports = fieldCopyModel;
