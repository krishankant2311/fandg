// const ChemicalMaintenance = require("../Model/chemicalMaintenanceModel");
// const ChemicalCustomer = require("../Model/customerModel");
// const Staff = require("../../Staff/Model/staffModel");

// // Verify active staff from JWT token (same pattern as chemicals)
// const getActiveStaffFromToken = async (token) => {
//   if (!token || !token._id) {
//     return null;
//   }
//   return Staff.findOne({
//     _id: token._id,
//     status: "Active",
//   });
// };

// // -------------------------------
// // Chemical Customer APIs
// // -------------------------------

// // Create / save a chemical-maintenance customer record
// // exports.createChemicalCustomer = async (req, res) => {
// //   try {
// //     const token = req.token;
// //     const staff = await getActiveStaffFromToken(token);

// //     if (!staff) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Unauthorized User",
// //       });
// //     }

// //     const {
// //       customerName,
// //       customerEmail,
// //       customerPhone,
// //       jobAddress,
// //       isChemicalMaintenanceEnabled,
// //       annualTreatments = [],
// //       otherTreatments = [],
// //     } = req.body;

// //     if (!customerName || !jobAddress) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Customer name and job address are required",
// //       });
// //     }

// //     const customer = await ChemicalCustomer.create({
// //       customerName,
// //       customerEmail,
// //       customerPhone,
// //       jobAddress,
// //       isChemicalMaintenanceEnabled: !!isChemicalMaintenanceEnabled,
// //       annualTreatments,
// //       otherTreatments,
// //     });

// //     return res.status(201).json({
// //       success: true,
// //       message: "Chemical customer created successfully",
// //       data: customer,
// //     });
// //   } catch (error) {
// //     console.error("Create chemical customer error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: error.message || "Create Chemical Customer",
// //     });
// //   }
// // };

// exports.createChemicalCustomer = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const {
//       customerName,
//       customerEmail,
//       customerPhone,
//       jobAddress,
//       description,
//       isChemicalMaintenanceEnabled,
//       annualTreatments = [],
//       otherTreatments = [],
//     } = req.body;

//     if (!customerName || !jobAddress) {
//       return res.status(400).json({
//         success: false,
//         message: "Customer name and job address are required",
//       });
//     }

//     const customer = await ChemicalCustomer.create({
//       customerName,
//       customerEmail,
//       customerPhone,
//       jobAddress,
//       description: description || "",
//       isChemicalMaintenanceEnabled: !!isChemicalMaintenanceEnabled,
//       annualTreatments,
//       otherTreatments,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Chemical customer created successfully",
//       data: customer,
//     });
//   } catch (error) {
//     console.error("Create chemical customer error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Create Chemical Customer",
//     });
//   }
// };

// // Simple list endpoint (can be expanded later with pagination)
// exports.getChemicalCustomers = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const customers = await ChemicalCustomer.find({ status: "Active" }).sort({
//       createdAt: -1,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Chemical customers fetched successfully",
//       data: customers,
//     });
//   } catch (error) {
//     console.error("Get chemical customers error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Get Chemical Customers",
//     });
//   }
// };

// // Get single customer by ID
// exports.getChemicalCustomerById = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const { id } = req.params;
//     const customer = await ChemicalCustomer.findOne({
//       _id: id,
//       status: "Active",
//     });

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Customer fetched successfully",
//       data: customer,
//     });
//   } catch (error) {
//     console.error("Get chemical customer by ID error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Get Chemical Customer",
//     });
//   }
// };

// // Update chemical customer
// // exports.updateChemicalCustomer = async (req, res) => {
// //   try {
// //     const token = req.token;
// //     const staff = await getActiveStaffFromToken(token);

// //     if (!staff) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Unauthorized User",
// //       });
// //     }

// //     const { id } = req.params;
// //     const {
// //       customerName,
// //       customerEmail,
// //       customerPhone,
// //       jobAddress,
// //       isChemicalMaintenanceEnabled,
// //       annualTreatments = [],
// //       otherTreatments = [],
// //     } = req.body;

// //     if (!customerName || !jobAddress) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Customer name and job address are required",
// //       });
// //     }

// //     const updated = await ChemicalCustomer.findOneAndUpdate(
// //       { _id: id, status: "Active" },
// //       {
// //         customerName,
// //         customerEmail,
// //         customerPhone,
// //         jobAddress,
// //         isChemicalMaintenanceEnabled: !!isChemicalMaintenanceEnabled,
// //         annualTreatments,
// //         otherTreatments,
// //       },
// //       { new: true }
// //     );

// //     if (!updated) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Customer not found",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       message: "Customer updated successfully",
// //       data: updated,
// //     });
// //   } catch (error) {
// //     console.error("Update chemical customer error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: error.message || "Update Chemical Customer",
// //     });
// //   }
// // };

// exports.updateChemicalCustomer = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const { id } = req.params;
//     const {
//       customerName,
//       customerEmail,
//       customerPhone,
//       jobAddress,
//       description,
//       isChemicalMaintenanceEnabled,
//       annualTreatments = [],
//       otherTreatments = [],
//     } = req.body;

//     if (!customerName || !jobAddress) {
//       return res.status(400).json({
//         success: false,
//         message: "Customer name and job address are required",
//       });
//     }

//     const updated = await ChemicalCustomer.findOneAndUpdate(
//       { _id: id, status: "Active" },
//       {
//         customerName,
//         customerEmail,
//         customerPhone,
//         jobAddress,
//         description: description !== undefined ? description : undefined,
//         isChemicalMaintenanceEnabled: !!isChemicalMaintenanceEnabled,
//         annualTreatments,
//         otherTreatments,
//       },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Customer updated successfully",
//       data: updated,
//     });
//   } catch (error) {
//     console.error("Update chemical customer error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Update Chemical Customer",
//     });
//   }
// };

// // Delete chemical customer (soft delete)
// exports.deleteChemicalCustomer = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const { id } = req.params;

//     const deleted = await ChemicalCustomer.findOneAndUpdate(
//       { _id: id, status: "Active" },
//       { status: "Deleted" },
//       { new: true }
//     );

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Customer deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete chemical customer error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Delete Chemical Customer",
//     });
//   }
// };

// // Create a new chemical mix
// exports.createChemicalMix = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const { mixName, chemicals = [], totalCostPerTank, totalPricePerTank } =
//       req.body;

//     if (!mixName || !Array.isArray(chemicals) || chemicals.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Mix name and at least one chemical are required",
//       });
//     }

//     const mix = await ChemicalMaintenance.create({
//       mixName,
//       chemicals,
//       totalCostPerTank: totalCostPerTank || 0,
//       totalPricePerTank: totalPricePerTank || 0,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Chemical mix created successfully",
//       data: mix,
//     });
//   } catch (error) {
//     console.error("Create chemical mix error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Create Chemical Mix",
//     });
//   }
// };

// // Get all mixes (only Active)
// exports.getAllChemicalMixes = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const mixes = await ChemicalMaintenance.find({ status: "Active" }).sort({
//       createdAt: -1,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Chemical mixes fetched successfully",
//       data: mixes,
//     });
//   } catch (error) {
//     console.error("Get chemical mixes error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Get Chemical Mixes",
//     });
//   }
// };

// // Update an existing mix
// exports.updateChemicalMix = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const { id } = req.params;
//     const { mixName, chemicals = [], totalCostPerTank, totalPricePerTank } =
//       req.body;

//     if (!mixName || !Array.isArray(chemicals) || chemicals.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Mix name and at least one chemical are required",
//       });
//     }

//     const updated = await ChemicalMaintenance.findOneAndUpdate(
//       { _id: id, status: "Active" },
//       {
//         mixName,
//         chemicals,
//         totalCostPerTank: totalCostPerTank || 0,
//         totalPricePerTank: totalPricePerTank || 0,
//       },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: "Chemical mix not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Chemical mix updated successfully",
//       data: updated,
//     });
//   } catch (error) {
//     console.error("Update chemical mix error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Update Chemical Mix",
//     });
//   }
// };

// // Soft delete a mix
// exports.deleteChemicalMix = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await getActiveStaffFromToken(token);

//     if (!staff) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized User",
//       });
//     }

//     const { id } = req.params;

//     const deleted = await ChemicalMaintenance.findOneAndUpdate(
//       { _id: id, status: "Active" },
//       { status: "Deleted" },
//       { new: true }
//     );

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "Chemical mix not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Chemical mix deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete chemical mix error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Delete Chemical Mix",
//     });
//   }
// };

const ChemicalMaintenance = require("../Model/chemicalMaintenanceModel");
const ChemicalCustomer = require("../Model/customerModel");
const Staff = require("../../Staff/Model/staffModel");
const Project = require("../../Projects/Model/projectModel");

// Verify active staff from JWT token (same pattern as chemicals)
const getActiveStaffFromToken = async (token) => {
  if (!token || !token._id) {
    return null;
  }
  return Staff.findOne({
    _id: token._id,
    status: "Active",
  });
};

// -------------------------------
// Chemical Customer APIs
// -------------------------------

// Create / save a chemical-maintenance customer record
exports.createChemicalCustomer = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      jobAddress,
      description,
      isChemicalMaintenanceEnabled,
      annualTreatments = [],
      otherTreatments = [],
    } = req.body;

    if (!customerName || !jobAddress) {
      return res.status(400).json({
        success: false,
        message: "Customer name and job address are required",
      });
    }

    const customer = await ChemicalCustomer.create({
      customerName,
      customerEmail,
      customerPhone,
      jobAddress,
      description: description || "",
      isChemicalMaintenanceEnabled: !!isChemicalMaintenanceEnabled,
      annualTreatments,
      otherTreatments,
    });

    return res.status(201).json({
      success: true,
      message: "Chemical customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create chemical customer error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Create Chemical Customer",
    });
  }
};

// Simple list endpoint (can be expanded later with pagination)
exports.getChemicalCustomers = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const customers = await ChemicalCustomer.find({ status: "Active" }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Chemical customers fetched successfully",
      data: customers,
    });
  } catch (error) {
    console.error("Get chemical customers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Get Chemical Customers",
    });
  }
};

// Get single customer by ID
exports.getChemicalCustomerById = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const { id } = req.params;
    const customer = await ChemicalCustomer.findOne({
      _id: id,
      status: "Active",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Get chemical customer by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Get Chemical Customer",
    });
  }
};

// Update chemical customer
exports.updateChemicalCustomer = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const { id } = req.params;
    const {
      customerName,
      customerEmail,
      customerPhone,
      jobAddress,
      description,
      isChemicalMaintenanceEnabled,
      annualTreatments = [],
      otherTreatments = [],
    } = req.body;

    if (!customerName || !jobAddress) {
      return res.status(400).json({
        success: false,
        message: "Customer name and job address are required",
      });
    }

    // Validate that project codes across all treatments are unique (non-empty)
    const allCodes = [];
    (annualTreatments || []).forEach((t) => {
      if (t && typeof t.projectCode === "string") {
        const code = t.projectCode.trim();
        if (code) allCodes.push(code);
      }
    });
    (otherTreatments || []).forEach((t) => {
      if (t && typeof t.projectCode === "string") {
        const code = t.projectCode.trim();
        if (code) allCodes.push(code);
      }
    });

    const codeSet = new Set(allCodes);
    if (codeSet.size !== allCodes.length) {
      return res.status(400).json({
        success: false,
        message: "Each treatment must have a unique Project Code.",
      });
    }

    // Fetch existing customer to detect newly assigned project codes per treatment
    const existingCustomer = await ChemicalCustomer.findOne({
      _id: id,
      status: "Active",
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const newlyAssignedProjectCodes = [];

    // Check annual treatments
    (annualTreatments || []).forEach((t, index) => {
      const newCode =
        t && typeof t.projectCode === "string"
          ? t.projectCode.trim()
          : "";
      const oldCode =
        existingCustomer.annualTreatments &&
        existingCustomer.annualTreatments[index] &&
        typeof existingCustomer.annualTreatments[index].projectCode ===
          "string"
          ? existingCustomer.annualTreatments[index].projectCode.trim()
          : "";

      if (newCode && !oldCode) {
        newlyAssignedProjectCodes.push({
          kind: "annual",
          index,
          projectCode: newCode,
          treatmentName: t.name || "",
          scheduledDate: t.scheduleDate || null,
          quantity: t.quantity || 0,
        });
      }
    });

    // Check other treatments
    (otherTreatments || []).forEach((t, index) => {
      const newCode =
        t && typeof t.projectCode === "string"
          ? t.projectCode.trim()
          : "";
      const oldCode =
        existingCustomer.otherTreatments &&
        existingCustomer.otherTreatments[index] &&
        typeof existingCustomer.otherTreatments[index].projectCode ===
          "string"
          ? existingCustomer.otherTreatments[index].projectCode.trim()
          : "";

      if (newCode && !oldCode) {
        newlyAssignedProjectCodes.push({
          kind: "other",
          index,
          projectCode: newCode,
          treatmentName: t.treatment || "",
          scheduledDate: t.date || null,
          quantity: t.qty || 0,
        });
      }
    });

    const updated = await ChemicalCustomer.findOneAndUpdate(
      { _id: id, status: "Active" },
      {
        customerName,
        customerEmail,
        customerPhone,
        jobAddress,
        description: description !== undefined ? description : undefined,
        isChemicalMaintenanceEnabled: !!isChemicalMaintenanceEnabled,
        annualTreatments,
        otherTreatments,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // For each newly assigned project code, create a corresponding Project.
    // Project codes can be reused only if ALL existing projects with that code
    // are Completed or Delete. If there is any Active/Ongoing/Billed project
    // using the same code, we reject the update.
    for (const item of newlyAssignedProjectCodes) {
      try {
        // Check if any non-deleted / non-completed project already uses this code
        const existingProject = await Project.findOne({
          projectCode: item.projectCode,
          status: { $nin: ["Delete", "Completed"] },
        });
        if (existingProject) {
          return res.status(400).json({
            success: false,
            message: `Project Code "${item.projectCode}" is already in use by an active project and cannot be assigned.`,
          });
        }

        const project = new Project({
          projectCode: item.projectCode,
          billingType: "No Bid",
          customerName,
          customerEmail,
          customerPhone,
          jobAddress,
          jobName: item.treatmentName,
          description: `Chemical Maintenance - ${item.treatmentName}`,
        });

        await project.save();
      } catch (e) {
        // Log but don't fail the whole request if project creation has an issue
        console.error(
          "Failed to create project for chemical treatment:",
          e
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update chemical customer error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Update Chemical Customer",
    });
  }
};

// Delete chemical customer (soft delete)
exports.deleteChemicalCustomer = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const { id } = req.params;

    const deleted = await ChemicalCustomer.findOneAndUpdate(
      { _id: id, status: "Active" },
      { status: "Deleted" },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete chemical customer error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Delete Chemical Customer",
    });
  }
};

// Create a new chemical mix
exports.createChemicalMix = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const { mixName, chemicals = [], totalCostPerTank, totalPricePerTank } =
      req.body;

    if (!mixName || !Array.isArray(chemicals) || chemicals.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Mix name and at least one chemical are required",
      });
    }

    const mix = await ChemicalMaintenance.create({
      mixName,
      chemicals,
      totalCostPerTank: totalCostPerTank || 0,
      totalPricePerTank: totalPricePerTank || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Chemical mix created successfully",
      data: mix,
    });
  } catch (error) {
    console.error("Create chemical mix error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Create Chemical Mix",
    });
  }
};

// Get all mixes (only Active)
exports.getAllChemicalMixes = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const mixes = await ChemicalMaintenance.find({ status: "Active" }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Chemical mixes fetched successfully",
      data: mixes,
    });
  } catch (error) {
    console.error("Get chemical mixes error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Get Chemical Mixes",
    });
  }
};

// Update an existing mix
exports.updateChemicalMix = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const { id } = req.params;
    const { mixName, chemicals = [], totalCostPerTank, totalPricePerTank } =
      req.body;

    if (!mixName || !Array.isArray(chemicals) || chemicals.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Mix name and at least one chemical are required",
      });
    }

    const updated = await ChemicalMaintenance.findOneAndUpdate(
      { _id: id, status: "Active" },
      {
        mixName,
        chemicals,
        totalCostPerTank: totalCostPerTank || 0,
        totalPricePerTank: totalPricePerTank || 0,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Chemical mix not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chemical mix updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update chemical mix error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Update Chemical Mix",
    });
  }
};

// Soft delete a mix
exports.deleteChemicalMix = async (req, res) => {
  try {
    const token = req.token;
    const staff = await getActiveStaffFromToken(token);

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const { id } = req.params;

    const deleted = await ChemicalMaintenance.findOneAndUpdate(
      { _id: id, status: "Active" },
      { status: "Deleted" },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Chemical mix not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chemical mix deleted successfully",
    });
  } catch (error) {
    console.error("Delete chemical mix error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Delete Chemical Mix",
    });
  }
};