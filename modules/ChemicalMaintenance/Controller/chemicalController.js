const Chemical = require("../Model/chemicalModel");
const Staff = require("../../Staff/Model/staffModel");

// Helper to verify logged-in staff
const getActiveStaffFromToken = async (token) => {
  if (!token || !token._id) {
    return null;
  }
  return Staff.findOne({
    _id: token._id,
    status: "Active",
  });
};

exports.addChemical = async (req, res) => {
  try {
    const token = req.token;
    const {
      chemicalName,
      measure,
      brandName,
      type,
      cost,
      price,
      isTaxable,
    } = req.body;

    const staff = await getActiveStaffFromToken(token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    // basic validation
    if (
      !chemicalName ||
      !measure ||
      !brandName ||
      !type ||
      cost === undefined ||
      price === undefined
    ) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "All required fields are needed",
        result: {},
      });
    }

    const existingChemical = await Chemical.findOne({
      chemicalName: chemicalName.trim(),
      brandName: brandName.trim(),
      status: "Active",
    });

    if (existingChemical) {
      return res.status(409).json({
        success: false,
        message: "Chemical already exists",
      });
    }

    const chemical = await Chemical.create({
      chemicalName,
      measure,
      brandName,
      type,
      cost,
      price,
      isTaxable: !!isTaxable,
    });

    return res.status(201).json({
      success: true,
      message: "Chemical created successfully",
      data: chemical,
    });
  } catch (error) {
    console.error("Create chemical error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Add Chemical",
      result: {},
    });
  }
};

exports.getAllChemical = async (req, res) => {
  try {
    const token = req.token;
    let {
      page = 1,
      limit =  100,
      search = "",
      sortby = "",
      sortorder = -1,
    } = req.query;
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const skip = (page - 1) * limit;
    sortby = sortby || "createdAt";
    sortorder = sortorder === "1" || sortorder === 1 || sortorder === "asc" ? 1 : -1;

    const staff = await getActiveStaffFromToken(token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const filter = {
      status: "Active",
    };

    if (search && search.length >= 2) {
      filter.$or = [
        { chemicalName: { $regex: search, $options: "i" } },
        { brandName: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { measure: { $regex: search, $options: "i" } },
      ];
    }

    const chemicals = await Chemical.find(filter)
      .sort({
        [sortby]: sortorder,
      })
      .skip(skip)
      .limit(limit);

    const totalChemicals = await Chemical.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Chemicals fetched successfully",
      result: {
        chemicals,
        totalPages: Math.ceil(totalChemicals / limit),
        currentPage: page,
        totalRecords: totalChemicals,
      },
    });
  } catch (error) {
    console.error("Get All Chemical error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Get All Chemical",
      result: {},
    });
  }
};

// Update an existing chemical
exports.updateChemical = async (req, res) => {
  try {
    const token = req.token;
    const { id } = req.params;

    const staff = await getActiveStaffFromToken(token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const {
      chemicalName,
      measure,
      brandName,
      type,
      cost,
      price,
      isTaxable,
    } = req.body;

    if (
      !chemicalName ||
      !measure ||
      !brandName ||
      !type ||
      cost === undefined ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are needed",
      });
    }

    const updated = await Chemical.findOneAndUpdate(
      { _id: id, status: "Active" },
      {
        chemicalName,
        measure,
        brandName,
        type,
        cost,
        price,
        isTaxable: !!isTaxable,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Chemical not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chemical updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update chemical error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Update Chemical",
    });
  }
};

// Soft delete a chemical (set status to Deleted)
exports.deleteChemical = async (req, res) => {
  try {
    const token = req.token;
    const { id } = req.params;

    const staff = await getActiveStaffFromToken(token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const deleted = await Chemical.findOneAndUpdate(
      { _id: id, status: "Active" },
      { status: "Deleted" },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Chemical not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chemical deleted successfully",
    });
  } catch (error) {
    console.error("Delete chemical error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Delete Chemical",
    });
  }
};