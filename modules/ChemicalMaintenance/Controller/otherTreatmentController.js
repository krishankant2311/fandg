const OtherTreatment = require("../Model/otherTreatmentModel");
const Staff = require("../../Staff/Model/staffModel");
const { DEFAULT_OTHER_TREATMENTS } = require("../data/defaultOtherTreatments");

const getActiveStaffFromToken = async (token) => {
  if (!token || !token._id) return null;
  return Staff.findOne({ _id: token._id, status: "Active" });
};

const parseMoney = (value) => {
  const n = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const upsertDefaultTreatments = async () => {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of DEFAULT_OTHER_TREATMENTS) {
    const existing = await OtherTreatment.findOne({
      treatmentName: item.treatmentName,
      status: "Active",
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    const deleted = await OtherTreatment.findOne({
      treatmentName: item.treatmentName,
      status: "Deleted",
    });

    if (deleted) {
      await OtherTreatment.findByIdAndUpdate(deleted._id, {
        ...item,
        status: "Active",
      });
      updated += 1;
    } else {
      await OtherTreatment.create(item);
      created += 1;
    }
  }

  return { created, updated, skipped };
};

const seedDefaultTreatmentsIfEmpty = async () => {
  const activeCount = await OtherTreatment.countDocuments({ status: "Active" });
  if (activeCount > 0) return null;
  return upsertDefaultTreatments();
};

exports.addOtherTreatment = async (req, res) => {
  try {
    const staff = await getActiveStaffFromToken(req.token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const {
      treatmentName,
      cost,
      price,
      lowerPrice,
      programType = "other",
      sortOrder = 0,
    } = req.body;

    if (!treatmentName || String(treatmentName).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Treatment name is required",
      });
    }

    const costNum = parseMoney(cost);
    const priceNum = parseMoney(price);
    const lowerPriceNum = parseMoney(lowerPrice ?? 0);

    if (costNum === null || priceNum === null || lowerPriceNum === null) {
      return res.status(400).json({
        success: false,
        message: "Cost, price, and lower price must be valid numbers",
      });
    }

    const name = String(treatmentName).trim();
    const existing = await OtherTreatment.findOne({
      treatmentName: name,
      status: "Active",
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Treatment already exists",
      });
    }

    const payload = {
      treatmentName: name,
      cost: costNum,
      price: priceNum,
      lowerPrice: lowerPriceNum,
      programType:
        programType === "annual_program" ? "annual_program" : "other",
      sortOrder: Number(sortOrder) || 0,
      status: "Active",
    };

    const deleted = await OtherTreatment.findOne({
      treatmentName: name,
      status: "Deleted",
    });

    const created = deleted
      ? await OtherTreatment.findByIdAndUpdate(deleted._id, payload, {
          new: true,
        })
      : await OtherTreatment.create(payload);

    return res.status(201).json({
      success: true,
      message: "Treatment created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Add other treatment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Add Treatment",
    });
  }
};

exports.getAllOtherTreatments = async (req, res) => {
  try {
    const staff = await getActiveStaffFromToken(req.token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    let {
      page = 1,
      limit = 100,
      search = "",
      sortby = "",
      sortorder = -1,
      programType = "",
    } = req.query;

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(Math.max(1, Number(limit) || 100), 500);
    const skip = (page - 1) * limit;
    sortby = sortby || "sortOrder";
    sortorder =
      sortorder === "1" || sortorder === 1 || sortorder === "asc" ? 1 : -1;

    const filter = { status: "Active" };
    if (programType === "annual_program" || programType === "other") {
      filter.programType = programType;
    }
    if (search && String(search).length >= 1) {
      filter.treatmentName = { $regex: search, $options: "i" };
    } else if (!programType) {
      await seedDefaultTreatmentsIfEmpty();
    }

    const treatments = await OtherTreatment.find(filter)
      .sort({ [sortby]: sortorder, treatmentName: 1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await OtherTreatment.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Treatments fetched successfully",
      result: {
        treatments,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Get all other treatments error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Get All Treatments",
      result: {},
    });
  }
};

exports.updateOtherTreatment = async (req, res) => {
  try {
    const staff = await getActiveStaffFromToken(req.token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { id } = req.params;
    const {
      treatmentName,
      cost,
      price,
      lowerPrice,
      programType,
      sortOrder,
    } = req.body;

    if (!treatmentName || String(treatmentName).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Treatment name is required",
      });
    }

    const costNum = parseMoney(cost);
    const priceNum = parseMoney(price);
    const lowerPriceNum = parseMoney(lowerPrice ?? 0);
    if (costNum === null || priceNum === null || lowerPriceNum === null) {
      return res.status(400).json({
        success: false,
        message: "Cost, price, and lower price must be valid numbers",
      });
    }

    const name = String(treatmentName).trim();
    const duplicate = await OtherTreatment.findOne({
      _id: { $ne: id },
      treatmentName: name,
      status: "Active",
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another treatment with this name already exists",
      });
    }

    const update = {
      treatmentName: name,
      cost: costNum,
      price: priceNum,
      lowerPrice: lowerPriceNum,
    };
    if (programType === "annual_program" || programType === "other") {
      update.programType = programType;
    }
    if (sortOrder !== undefined && sortOrder !== null && sortOrder !== "") {
      update.sortOrder = Number(sortOrder) || 0;
    }

    const updated = await OtherTreatment.findOneAndUpdate(
      { _id: id, status: "Active" },
      update,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Treatment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Treatment updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update other treatment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Update Treatment",
    });
  }
};

exports.deleteOtherTreatment = async (req, res) => {
  try {
    const staff = await getActiveStaffFromToken(req.token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { id } = req.params;
    const deleted = await OtherTreatment.findOneAndUpdate(
      { _id: id, status: "Active" },
      { status: "Deleted" },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Treatment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Treatment deleted successfully",
    });
  } catch (error) {
    console.error("Delete other treatment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Delete Treatment",
    });
  }
};

exports.seedDefaultOtherTreatments = async (req, res) => {
  try {
    const staff = await getActiveStaffFromToken(req.token);
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { created, updated, skipped } = await upsertDefaultTreatments();

    return res.status(200).json({
      success: true,
      message: "Default treatments loaded",
      data: { created, updated, skipped },
    });
  } catch (error) {
    console.error("Seed other treatments error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Seed Treatments",
    });
  }
};
