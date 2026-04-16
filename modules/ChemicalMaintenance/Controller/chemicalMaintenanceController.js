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

    // Normalize annualTreatments schedule dates (support both scheduleDate and scheduleDates[]),
    // and EXPAND multi-date annual treatments into multiple entries (1 per date).
    const normalizedAnnualTreatments = (annualTreatments || [])
      .map((t) => {
      if (!t) return t;
      const scheduleDatesRaw = Array.isArray(t.scheduleDates)
        ? t.scheduleDates
        : t.scheduleDate
          ? [t.scheduleDate]
          : [];
      const scheduleDates = scheduleDatesRaw
        .filter(Boolean)
        .map((d) => new Date(d))
        .filter((d) => !Number.isNaN(d.getTime()));
      const first = scheduleDates[0] || (t.scheduleDate ? new Date(t.scheduleDate) : null);
      return {
        ...t,
        scheduleDates,
        scheduleDate: first && !Number.isNaN(first.getTime()) ? first : undefined,
      };
      })
      .flatMap((t) => {
        if (!t) return [];
        const ds = Array.isArray(t.scheduleDates) ? t.scheduleDates.filter(Boolean) : [];
        if (ds.length <= 1) {
          // Ensure scheduleDates is consistent (0 or 1 element)
          const one = ds[0] || t.scheduleDate || undefined;
          return [
            {
              ...t,
              scheduleDates: one ? [one] : [],
              scheduleDate: one,
            },
          ];
        }
        // Expand: one entry per date
        return ds.map((d) => ({
          ...t,
          scheduleDates: [d],
          scheduleDate: d,
        }));
      });

    const customer = await ChemicalCustomer.create({
      customerName,
      customerEmail,
      customerPhone,
      jobAddress,
      description: description || "",
      isChemicalMaintenanceEnabled: !!isChemicalMaintenanceEnabled,
      annualTreatments: normalizedAnnualTreatments,
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
    // Normalize annualTreatments schedule dates (support both scheduleDate and scheduleDates[]),
    // and EXPAND multi-date annual treatments into multiple entries (1 per date).
    const normalizedAnnualTreatments = (annualTreatments || [])
      .map((t) => {
      if (!t) return t;
      const scheduleDatesRaw = Array.isArray(t.scheduleDates)
        ? t.scheduleDates
        : t.scheduleDate
          ? [t.scheduleDate]
          : [];
      const scheduleDates = scheduleDatesRaw
        .filter(Boolean)
        .map((d) => new Date(d))
        .filter((d) => !Number.isNaN(d.getTime()));
      const first = scheduleDates[0] || (t.scheduleDate ? new Date(t.scheduleDate) : null);
      return {
        ...t,
        scheduleDates,
        scheduleDate: first && !Number.isNaN(first.getTime()) ? first : undefined,
      };
      })
      .flatMap((t) => {
        if (!t) return [];
        const ds = Array.isArray(t.scheduleDates) ? t.scheduleDates.filter(Boolean) : [];
        if (ds.length <= 1) {
          const one = ds[0] || t.scheduleDate || undefined;
          return [
            {
              ...t,
              scheduleDates: one ? [one] : [],
              scheduleDate: one,
            },
          ];
        }
        return ds.map((d) => ({
          ...t,
          scheduleDates: [d],
          scheduleDate: d,
        }));
      });


    if (!customerName || !jobAddress) {
      return res.status(400).json({
        success: false,
        message: "Customer name and job address are required",
      });
    }

    // Helper: normalize a date to YYYY-MM-DD (date-only) key.
    const toDateKey = (value) => {
      if (!value) return "";
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const getAnnualFirstDateKey = (t) => {
      if (!t) return "";
      const sd =
        Array.isArray(t.scheduleDates) && t.scheduleDates.length > 0
          ? t.scheduleDates[0]
          : t.scheduleDate;
      return toDateKey(sd);
    };

    const getOtherDateKey = (t) => toDateKey(t?.date);

    // Validate project code uniqueness with an exception:
    // the SAME Project Code is allowed when the scheduled date is the SAME (date-only).
    // If date is missing/invalid, we keep strict uniqueness to avoid accidental collisions.
    const codeToDateKey = new Map(); // code -> first dateKey we saw
    const pushOrValidate = (code, dateKey) => {
      if (!code) return true;
      const prev = codeToDateKey.get(code);
      if (!prev) {
        codeToDateKey.set(code, dateKey);
        return true;
      }
      // allow duplicates only when both have a dateKey AND dateKey matches
      if (prev && dateKey && prev === dateKey) return true;
      return false;
    };

    for (const t of normalizedAnnualTreatments || []) {
      const code = t && typeof t.projectCode === "string" ? t.projectCode.trim() : "";
      const dateKey = getAnnualFirstDateKey(t);
      if (!pushOrValidate(code, dateKey)) {
        return res.status(400).json({
          success: false,
          message:
            "Project Code must be unique unless multiple treatments are scheduled on the same date.",
        });
      }
    }
    for (const t of otherTreatments || []) {
      const code = t && typeof t.projectCode === "string" ? t.projectCode.trim() : "";
      const dateKey = getOtherDateKey(t);
      if (!pushOrValidate(code, dateKey)) {
        return res.status(400).json({
          success: false,
          message:
            "Project Code must be unique unless multiple treatments are scheduled on the same date.",
        });
      }
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
    const changedProjectCodes = [];

    // Check annual treatments
    (normalizedAnnualTreatments || []).forEach((t, index) => {
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
        const scheduledDate =
          (Array.isArray(t.scheduleDates) && t.scheduleDates.length > 0
            ? t.scheduleDates[0]
            : t.scheduleDate) || null;
        newlyAssignedProjectCodes.push({
          kind: "annual",
          index,
          projectCode: newCode,
          treatmentName: t.name || "",
          scheduledDate,
          quantity: t.quantity || 0,
        });
      } else if (newCode && oldCode && newCode !== oldCode) {
        const scheduledDate =
          (Array.isArray(t.scheduleDates) && t.scheduleDates.length > 0
            ? t.scheduleDates[0]
            : t.scheduleDate) || null;
        changedProjectCodes.push({
          kind: "annual",
          index,
          oldCode,
          newCode,
          treatmentName: t.name || "",
          scheduledDate,
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
      } else if (newCode && oldCode && newCode !== oldCode) {
        changedProjectCodes.push({
          kind: "other",
          index,
          oldCode,
          newCode,
          treatmentName: t.treatment || "",
          scheduledDate: t.date || null,
          quantity: t.qty || 0,
        });
      }
    });

    // If any project codes are being changed, validate the new codes are not in use
    // by an active project, and also that there are no duplicates within this update.
    const checkedChangedNewCodes = new Set();
    for (const ch of changedProjectCodes) {
      const newCode = (ch.newCode || "").trim();
      const dateKey = toDateKey(ch.scheduledDate);
      const uniq = `${newCode}__${dateKey}`;
      if (!newCode || checkedChangedNewCodes.has(uniq)) continue;
      checkedChangedNewCodes.add(uniq);

      const existingProject = await Project.findOne({
        projectCode: newCode,
        status: { $nin: ["Delete", "Completed"] },
      });
      if (existingProject) {
        const isChemicalProject =
          typeof existingProject.description === "string" &&
          /^Chemical Maintenance\s*-/i.test(existingProject.description);
        const isSameCustomerJob =
          (existingProject.customerName || "") === (customerName || "") &&
          (existingProject.jobAddress || "") === (jobAddress || "");

        // Allow reuse only for Chemical Maintenance projects (or same customer/jobAddress).
        // This keeps normal project flows protected.
        if (!isChemicalProject && !isSameCustomerJob) {
          return res.status(400).json({
            success: false,
            message: `Project Code "${newCode}" is already in use by an active project and cannot be assigned.`,
          });
        }
      }
    }
    const updated = await ChemicalCustomer.findOneAndUpdate(
      { _id: id, status: "Active" },
      {
        customerName,
        customerEmail,
        customerPhone,
        jobAddress,
        description: description !== undefined ? description : undefined,
        isChemicalMaintenanceEnabled: !!isChemicalMaintenanceEnabled,
        annualTreatments: normalizedAnnualTreatments,
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

    // Billing type for projects created from Chemical Maintenance only.
    // This does NOT affect normal project flows.
    const billingTypeForChemicalProjects = isChemicalMaintenanceEnabled
      ? "CNB"
      : "No Bid";
    // For each newly assigned project code, create a corresponding Project.
    // Project codes can be reused only if ALL existing projects with that code
    // are Completed or Delete. If there is any Active/Ongoing/Billed project
    // using the same code, we reject the update.
    // If multiple treatments on the same date share a code, create only ONE Project.
    const groupedNewProjects = new Map(); // `${code}__${dateKey}` -> { projectCode, treatmentNames: [] }
    for (const item of newlyAssignedProjectCodes) {
      const code = (item.projectCode || "").trim();
      const dateKey = toDateKey(item.scheduledDate);
      const key = `${code}__${dateKey}`;
      if (!code) continue;
      if (!groupedNewProjects.has(key)) {
        groupedNewProjects.set(key, {
          projectCode: code,
          treatmentNames: [],
        });
      }
      const group = groupedNewProjects.get(key);
      const name = (item.treatmentName || "").trim();
      if (name && !group.treatmentNames.includes(name)) group.treatmentNames.push(name);
    }

    for (const item of groupedNewProjects.values()) {
      try {
        // Check if any non-deleted / non-completed project already uses this code
        const existingProject = await Project.findOne({
          projectCode: item.projectCode,
          status: { $nin: ["Delete", "Completed"] },
        });
        if (existingProject) {
          const isChemicalProject =
            typeof existingProject.description === "string" &&
            /^Chemical Maintenance\s*-/i.test(existingProject.description);
          const isSameCustomerJob =
            (existingProject.customerName || "") === (customerName || "") &&
            (existingProject.jobAddress || "") === (jobAddress || "");

          // Allow attaching additional treatments to an existing Chemical Maintenance project (same code),
          // but do not allow collisions with unrelated normal projects.
          if (!isChemicalProject && !isSameCustomerJob) {
            return res.status(400).json({
              success: false,
              message: `Project Code "${item.projectCode}" is already in use by an active project and cannot be assigned.`,
            });
          }
          // If it already exists and is acceptable, update name/description to include grouped treatments.
          if (isChemicalProject && isSameCustomerJob) {
            const treatmentNames = Array.isArray(item.treatmentNames)
              ? item.treatmentNames.filter(Boolean)
              : [];
            const first = treatmentNames[0] || existingProject.jobName || "";
            const rest = treatmentNames.slice(1);

            // Keep wall name as the first treatment (only set if empty).
            if (!existingProject.jobName && first) {
              existingProject.jobName = first;
            }

            // Append other treatments into description (avoid duplicates; preserve any existing edits as much as possible).
            const currentDesc = String(existingProject.description || "");
            const basePrefix = first ? `Chemical Maintenance - ${first}` : "Chemical Maintenance";
            let nextDesc = currentDesc && /^Chemical Maintenance\s*-/i.test(currentDesc)
              ? currentDesc
              : basePrefix;

            if (rest.length > 0) {
              const otherLinePrefix = "Other treatments (same day):";
              const alreadyHasOtherLine = nextDesc.toLowerCase().includes(otherLinePrefix.toLowerCase());
              const missing = rest.filter((n) => !nextDesc.toLowerCase().includes(n.toLowerCase()));
              if (missing.length > 0) {
                if (alreadyHasOtherLine) {
                  nextDesc = `${nextDesc}, ${missing.join(", ")}`;
                } else {
                  nextDesc = `${nextDesc}\n${otherLinePrefix} ${missing.join(", ")}`;
                }
              }
            }

            if (nextDesc !== currentDesc) {
              existingProject.description = nextDesc;
            }

            await existingProject.save();
          }
          // If it already exists and is acceptable, don't create another project.
          continue;
        }

        const treatmentNames = Array.isArray(item.treatmentNames)
          ? item.treatmentNames.filter(Boolean)
          : [];
        const first = treatmentNames[0] || "";
        const rest = treatmentNames.slice(1);

        const description =
          rest.length > 0
            ? `Chemical Maintenance - ${first}\nOther treatments (same day): ${rest.join(", ")}`
            : `Chemical Maintenance - ${first}`;

        const project = new Project({
          projectCode: item.projectCode,
          billingType: billingTypeForChemicalProjects,
          customerName,
          customerEmail,
          customerPhone,
          jobAddress,
          jobName: first,
          description,
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

    // Apply changed project codes to existing projects (Chemical Maintenance flow only).
    for (const item of changedProjectCodes) {
      try {
        // Update the corresponding Project for this chemical treatment.
        // Prefer projects clearly created from Chemical Maintenance, but also allow matching
        // by (customer + jobAddress + jobName) in case description was edited later.
        // This still does NOT affect normal project flows because this runs only inside
        // Chemical Maintenance customer update.
        const project = await Project.findOne({
          projectCode: item.oldCode,
          status: { $nin: ["Delete", "Completed"] },
          $or: [
            { description: { $regex: /^Chemical Maintenance\s*-/i } },
            {
              customerName,
              jobAddress,
              jobName: item.treatmentName || "",
            },
          ],
        });

        if (project) {
          project.projectCode = item.newCode;
          // Keep billing type consistent for chemical projects
          project.billingType = billingTypeForChemicalProjects;
          await project.save();
        } else {
          // If another project already exists for the new code (same day group), don't create duplicates.
          const existingNew = await Project.findOne({
            projectCode: item.newCode,
            status: { $nin: ["Delete", "Completed"] },
            description: { $regex: /^Chemical Maintenance\s*-/i },
          });
          if (existingNew) continue;

          // If the old project doesn't exist (or is completed/deleted), create a new one for the new code
          const newProject = new Project({
            projectCode: item.newCode,
            billingType: billingTypeForChemicalProjects,
            customerName,
            customerEmail,
            customerPhone,
            jobAddress,
            jobName: item.treatmentName,
            description: `Chemical Maintenance - ${item.treatmentName}`,
          });
          await newProject.save();
        }
      } catch (e) {
        console.error("Failed to update project code for chemical treatment:", e);
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

    const { mixName, chemicals = [], totalCostPerTank, totalPricePerTank, notes } =
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
      notes: notes || "",
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
      pdfOrder: 1,
      createdAt: 1,
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
    const { mixName, chemicals = [], totalCostPerTank, totalPricePerTank, notes } =
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
        notes: notes || "",
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