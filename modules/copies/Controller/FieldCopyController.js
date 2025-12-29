const FieldCopyHistory = require("../Model/FieldCopyModel");

exports.getFieldCopiesByDate = async (req, res) => {
  try {
    const { date } = req.body;
    const { projectId } = req.params;
    console.log("Date",date, projectId)

    if (!projectId) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }

    if (!date) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Please provide the date",
        result: {},
      });
    }

    const copies = await FieldCopyHistory.find({
      projectId,
      entryDate: date,
      status : "Active"
    });

    return res.send({
      statusCode: 200,
      success: true,
      message: "Copies fetched successfully",
      result: copies,
    });
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};
