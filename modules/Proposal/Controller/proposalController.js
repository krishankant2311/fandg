const Staff = require("../../Staff/Model/staffModel");
const Proposal = require("../Model/proposalModel");
const Project = require("../../Projects/Model/projectModel");
const Customer = require("../../Customer/Model/CustomerModel");
const JobType = require("../../JobType/Model/jobTypeModel");
const CopyNumber = require("../../Projects/Model/projectCopyNumber");

const generateCustomId = () => {
  const length = 8;
  const characters =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};

const generateProposalId = async () => {
  let uniqueId;
  let isUnique = false;

  while (!isUnique) {
    uniqueId = generateCustomId();
    const existingProject = await Proposal.findOne({ proposalId: uniqueId });
    if (!existingProject) {
      isUnique = true;
    }
  }

  return uniqueId;
};

const generateUniqueIdForCopy = async (project) => {
  const name = project.customerName?.[0] || "X"; // Handle missing customer name
  const jobAddressParts = project.jobAddress?.trim()
    ? project.jobAddress?.trim().split(" ")
    : [];

  let jobAddress = ""; // Default to empty

  if (jobAddressParts.length > 0) {
    const firstWord = jobAddressParts[0];

    if (!isNaN(firstWord)) {
      jobAddress = firstWord.slice(-2); // Extract last two digits
    }
  }

  const currentNumberDoc = await CopyNumber.findOne({});
  const number = currentNumberDoc
    ? Number.parseInt(currentNumberDoc.copyNumber)
    : 0;

  console.log("Unique ID", `${name}${jobAddress}-${30000 + number}`);

  const uniqueCode = `${name}${jobAddress}-${30000 + number}`;

  return uniqueCode;
};

// Controllers

exports.createProposal = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    let { customerId, customerName, customerEmail, customerPhone, forms } =
      req.body;

    customerId = customerId?.trim();
    customerName = customerName?.trim();

    if (!customerId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer ID is required",
        result: {},
      });
    }

    if (!customerName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer Name is required",
        result: {},
      });
    }

    if (!forms) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "No data provided",
        result: {},
      });
    }

    forms = JSON.parse(forms);

    // console.log("Forms", forms);

    // return res.send({forms})

    if (forms && forms.length === 0) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Forms are required",
        result: {},
      });
    }

    const proposalId = await generateProposalId();

    const updatedForms = forms.map((form) => {
      return {
        proposalId: proposalId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        customerId: customerId,
        jobType: form.jobType,
        jobAddress: form.jobAddress || "",
        description: form.description,
        bidedCopy: form.copies,
        billingType: "Bid",
      };
    });

    // return res.send({
    //   updatedForms
    // })

    await Project.insertMany(updatedForms);

    return res.send({
      statusCode: 201,
      success: true,
      message: "Proposal created successfully",
      result: {},
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

exports.getAllProposals = async (req, res) => {
  try {
    const token = req.token;

    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSizeNumber = parseInt(limit, 10);
    sortBy = sortBy || "createdAt";
    sortOrder = parseInt(sortOrder) || -1;

    const matchConditions = {
      status: { $ne: "Delete" }, // Exclude deleted projects
    };
    if (search) {
      matchConditions.$or = [
        { proposalId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }

    const aggregatePipeline = [
      { $match: matchConditions },

      // Populate jobType
      {
        $lookup: {
          from: "jobtypes", // collection name in MongoDB (usually plural and lowercase)
          localField: "jobType",
          foreignField: "_id",
          as: "jobTypeData",
        },
      },
      {
        $unwind: {
          path: "$jobTypeData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Group by proposalId
      {
        $group: {
          _id: "$proposalId",
          projects: {
            $push: {
              $mergeObjects: [
                "$$ROOT",
                { jobType: "$jobTypeData" }, // Overwrite jobType field with populated data
              ],
            },
          },
          customerName: { $first: "$customerName" },
          customerEmail: { $first: "$customerEmail" },
          createdAt: { $first: "$createdAt" },
        },
      },

      // Sort dynamically
      {
        $sort: {
          [sortBy]: sortOrder,
        },
      },

      // Pagination
      {
        $facet: {
          data: [
            { $skip: (pageNumber - 1) * pageSizeNumber },
            { $limit: pageSizeNumber },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Project.aggregate(aggregatePipeline);

    const proposals = result[0]?.data || [];
    const totalRecords = result[0]?.totalCount[0]?.count || 0;

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposals fetched successfully",
      result: {
        proposals,
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / pageSizeNumber),
      },
    });
  } catch (error) {
    console.error("getAllProposals error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getProposalCopies = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { proposalId } = req.params;

    if (!proposalId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Proposal ID is required",
        result: {},
      });
    }

    const proposals = await Project.find({ proposalId, status: "Active" });

    if (!proposals) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Proposal not found",
        result: {},
      });
    }

    if (proposals.length < 0) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "No active proposals found",
        result: {},
      });
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposals fetched successfully",
      result: proposals,
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

exports.convertProposalToProject = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });
    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { proposalId } = req.params;
    let { forms } = req.body;

    if (!proposalId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Proposal ID is required",
        result: {},
      });
    }

    if (!forms) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Form is required",
        result: {},
      });
    }

    forms = JSON.parse(forms);

    for (let form of forms) {
      await Project.updateOne(
        { proposalId, status: { $ne: "Delete" } },
        { $set: { ...form, status: "Ongoing" } }
      );
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposals converted to projects successfully",
      result: {},
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

exports.convertProposalToProject = async (req, res) => {
  try {
    const token = req.token;

    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { proposalId } = req.params;
    let { forms } = req.body;

    if (!proposalId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Proposal ID is required",
        result: {},
      });
    }

    if (!forms) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Form is required",
        result: {},
      });
    }

    // Only parse if form is sent as a string
    if (typeof forms === "string") {
      forms = JSON.parse(forms);
    }

    for (const form of forms) {
      if (!form._id) continue; // Ensure each form has project ID

      await Project.updateOne(
        { _id: form._id, proposalId, status: { $ne: "Delete" } },
        {
          $set: {
            ...form,
            status: "Ongoing",
            isProjectStarted: true,
            projectStartDate: Date.now(),
          },
        }
      );
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposals converted to projects successfully",
      result: {},
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

exports.editProposal = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({ _id: token._id, status: "Active" });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { forms, customerId, customerName, customerEmail, customerPhone } =
      req.body;
    const projects = JSON.parse(forms);
    console.log("Formsejrhehfi", forms);
    // return res.send({
    //   forms,
    // });
    const { proposalId } = req.params;

    if (!proposalId || !Array.isArray(projects) || projects.length === 0) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Proposal ID and projects are required",
        result: {},
      });
    }

    for (const proj of projects) {
      if (proj && proj._id) {
        console.log("Proj ----------------", proj);
        let updatedCopies = [];
        if (proj.copies) {
          updatedCopies = proj.copies.map((copy) => {
            if (!copy._id) {
              delete copy._id;
            }
            return copy;
          });
        }
        console.log("projectCopy",proj.copies)
        console.log("plkofcmermcr",proj)
        await Project.updateOne(
          { _id: proj._id },
          {
            $set: {
              bidedCopy: proj.copies,
              jobAddress:proj.jobAddress,
              description:proj.description
            },
          }
        );
      } else {
        console.log("Called");
        const updatedCopies = proj.copies.map((copy) => {
          delete copy._id;
          return copy;
        });

        console.log("Updated Copy --------", updatedCopies);
        const newProject = new Project({
          proposalId: proposalId,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          customerId: customerId,
          jobType: proj.jobType,
          description: proj.description,
          bidedCopy: updatedCopies,
          billingType: "Bid",
        });

        await newProject.save();
      }
    }

    // console.log("Project Req body", projects);
    // return res.send({})

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposal updated successfully",
      result: {},
    });
  } catch (error) {
    console.error("editProposal error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.deleteProposal = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({ _id: token._id, status: "Active" });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { proposalId } = req.params;

    if (!proposalId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Proposal ID is required",
        result: {},
      });
    }

    const projects = await Project.find({
      proposalId,
      status: { $ne: "Delete" },
    });

    // if (!projects.length) {
    //   return res.send({
    //     statusCode: 404,
    //     success: false,
    //     message: "No active projects found for the given proposal ID",
    //     result: {},
    //   });
    // }

    console.log("Propsject", projects);

    await Project.updateMany({ proposalId }, { $set: { status: "Delete" } });

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposal deleted successfully",
      result: {},
    });
  } catch (error) {
    console.error("deleteProposal error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.viewProposal = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({ _id: token._id, status: "Active" });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { proposalId } = req.params;

    if (!proposalId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Proposal Id is required",
        result: {},
      });
    }

    const projects = await Project.find({
      proposalId,
      status: { $ne: "Delete" },
    }).lean();

    console.log("Projects", projects);

    if (!projects || projects.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "No proposal found.",
        result: {},
      });
    }

    const firstProject = projects[0];

    // Load all jobTypes in memory to avoid multiple DB calls
    const allJobTypes = await JobType.find({}).lean();

    const salesOrderNumber = await generateUniqueIdForCopy(firstProject);

    const formData = {
      customerName: firstProject.customerName || "",
      customerId: firstProject.customerId || "",
      customerEmail: firstProject.customerEmail || "",
      customerPhone: firstProject.customerPhone || "",
      bidProjectId: firstProject.bidProjectId || "",
      bidCompletedDate: firstProject.bidCompletedDate || "",
      salesOrderNumber,
      forms: [],
    };

    let resultedForms = [];

    projects.forEach((project) => {
      let currentCopies = [];
      if (Array.isArray(project.bidedCopy)) {
        project.bidedCopy.forEach((copy) => {
          currentCopies = [...currentCopies, ...copy.copies];
        });
      }

      // Find jobType name
      const matchedJob = allJobTypes.find(
        (jt) => jt._id.toString() === project.jobType.toString()
      );

      resultedForms = [
        ...resultedForms,
        {
          _id: project._id,
          jobType: project.jobType,
          jobAddress: project.jobAddress,
          jobName: matchedJob?.jobName || "",
          description: project.description,
          copies: currentCopies,
        },
      ];
    });

    formData.forms = resultedForms;

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposal fetched successfully",
      result: {
        formData,
        projectDetail: {
          customerId: projects[0].customerId,
          customerName: projects[0].customerName,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getAllProposals = async (req, res) => {
  try {
    const token = req.token;

    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSizeNumber = parseInt(limit, 10);
    sortBy = sortBy || "createdAt";
    sortOrder = parseInt(sortOrder) || -1;

    const matchConditions = {
      status: { $ne: "Delete" },
    };

    if (search) {
      matchConditions.$or = [
        { proposalId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }

    const aggregatePipeline = [
      { $match: matchConditions },

      {
        $lookup: {
          from: "jobtypes",
          localField: "jobType",
          foreignField: "_id",
          as: "jobTypeData",
        },
      },
      {
        $unwind: {
          path: "$jobTypeData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: "$proposalId",
          projects: {
            $push: {
              $mergeObjects: ["$$ROOT", { jobType: "$jobTypeData" }],
            },
          },
          customerName: { $first: "$customerName" },
          customerEmail: { $first: "$customerEmail" },
          createdAt: { $first: "$createdAt" },
          statuses: { $addToSet: "$status" },
        },
      },

      {
        $addFields: {
          canConvertToProject: {
            $setIsSubset: ["$statuses", ["Ongoing", "Completed", "Billed"]],
          },
        },
      },

      {
        $sort: {
          [sortBy]: sortOrder,
        },
      },

      {
        $facet: {
          data: [
            { $skip: (pageNumber - 1) * pageSizeNumber },
            { $limit: pageSizeNumber },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Project.aggregate(aggregatePipeline);

    const proposals = result[0]?.data || [];
    const totalRecords = result[0]?.totalCount[0]?.count || 0;

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposals fetched successfully",
      result: {
        proposals,
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / pageSizeNumber),
      },
    });
  } catch (error) {
    console.error("getAllProposals error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getAllProposals = async (req, res) => {
  try {
    const token = req.token;

    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSizeNumber = parseInt(limit, 10);
    sortBy = sortBy || "createdAt";
    sortOrder = parseInt(sortOrder) || -1;

    const matchConditions = {
      status: { $ne: "Delete" },
      isProposalClosed: false,
    };

    if (search) {
      matchConditions.$or = [
        { proposalId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }

    const aggregatePipeline = [
      { $match: matchConditions },

      {
        $lookup: {
          from: "jobtypes",
          localField: "jobType",
          foreignField: "_id",
          as: "jobTypeData",
        },
      },
      {
        $unwind: {
          path: "$jobTypeData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: "$proposalId",
          projects: {
            $push: {
              $mergeObjects: ["$$ROOT", { jobType: "$jobTypeData" }],
            },
          },
          customerName: { $first: "$customerName" },
          customerEmail: { $first: "$customerEmail" },
          bidProjectId: { $first: "$bidProjectId" },
          bidCompletedDate: { $first: "$bidCompletedDate" },
          createdAt: { $first: "$createdAt" },
          statuses: { $addToSet: "$status" },
        },
      },

      {
        $addFields: {
          canConvertToProject: {
            $in: ["Active", "$statuses"], // true if "Active" is in statuses
          },
        },
      },

      {
        $sort: {
          [sortBy]: sortOrder,
        },
      },

      {
        $facet: {
          data: [
            { $skip: (pageNumber - 1) * pageSizeNumber },
            { $limit: pageSizeNumber },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Project.aggregate(aggregatePipeline);

    const proposals = result[0]?.data || [];
    const totalRecords = result[0]?.totalCount[0]?.count || 0;

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposals fetched successfully",
      result: {
        proposals,
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / pageSizeNumber),
      },
    });
  } catch (error) {
    console.error("getAllProposals error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.saveDateAndCode = async (req, res) => {
  try {
    const { proposalId } = req.params;
    let { bidProjectId, bidCompletedDate } = req.body;
    bidProjectId = bidProjectId?.trim();
    bidCompletedDate = bidCompletedDate?.trim();

    // console.log("body", bidProjectId, bidCompletedDate);

    if (!proposalId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Proposal Id is required",
        result: {},
      });
    }

    await Project.updateMany(
      {
        proposalId,
        // status: "Active",
      },
      {
        $set: {
          bidProjectId,
          bidCompletedDate,
        },
      }
    );

    return res.send({
      statusCode: 200,
      success: false,
      message: "Data Saved Successfully",
      result: {},
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

exports.markProposalAsClosed = async (req, res) => {
  try {
    const token = req.token;

    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { proposalId } = req.body;

    console.log("Proposal Id", proposalId);

    if (!proposalId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Please enter proposal Id",
        result: {},
      });
    }

    await Project.updateMany(
      { proposalId },
      {
        $set: {
          isProposalClosed: true,
        },
      }
    );

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposal closed successfully",
      result: {},
    });
  } catch (error) {
    console.error(" error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getClosedProposals = async (req, res) => {
  try {
    const token = req.token;

    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSizeNumber = parseInt(limit, 10);
    sortBy = sortBy || "createdAt";
    sortOrder = parseInt(sortOrder) || -1;

    const matchConditions = {
      status: { $in: ["Active", "Ongoing", "Completed", "Billed"] },
      isProposalClosed: true,
    };

    if (search) {
      matchConditions.$or = [
        { proposalId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }

    const aggregatePipeline = [
      { $match: matchConditions },

      {
        $lookup: {
          from: "jobtypes",
          localField: "jobType",
          foreignField: "_id",
          as: "jobTypeData",
        },
      },
      {
        $unwind: {
          path: "$jobTypeData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: "$proposalId",
          projects: {
            $push: {
              $mergeObjects: ["$$ROOT", { jobType: "$jobTypeData" }],
            },
          },
          customerName: { $first: "$customerName" },
          customerEmail: { $first: "$customerEmail" },
          bidProjectId: { $first: "$bidProjectId" },
          bidCompletedDate: { $first: "$bidCompletedDate" },
          createdAt: { $first: "$createdAt" },
          statuses: { $addToSet: "$status" },
        },
      },

      {
        $addFields: {
          canConvertToProject: {
            $in: ["Active", "$statuses"], // true if "Active" is in statuses
          },
        },
      },

      {
        $sort: {
          [sortBy]: sortOrder,
        },
      },

      {
        $facet: {
          data: [
            { $skip: (pageNumber - 1) * pageSizeNumber },
            { $limit: pageSizeNumber },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Project.aggregate(aggregatePipeline);

    const proposals = result[0]?.data || [];
    const totalRecords = result[0]?.totalCount[0]?.count || 0;

    return res.send({
      statusCode: 200,
      success: true,
      message: "Proposals fetched successfully",
      result: {
        proposals,
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / pageSizeNumber),
      },
    });
  } catch (error) {
    console.error("getAllProposals error:", error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

// const assignProposalIdsToProjects = async () => {
//   try {
//     const projectsToUpdate = await Project.find({
//       billingType: "Bid",
//       $or: [{ proposalId: { $exists: false } }, { proposalId: "" }],
//     });

//     for (const project of projectsToUpdate) {
//       const newProposalId = await generateProposalId();

//       await Project.updateOne(
//         { _id: project._id },
//         { $set: { proposalId: newProposalId } }
//       );

//       console.log(`Updated project ${project._id} with proposalId: ${newProposalId}`);
//     }

//     console.log("✅ All applicable projects have been updated.");
//   } catch (error) {
//     console.error("❌ Error while updating proposalIds:", error.message);
//   }
// };
// assignProposalIdsToProjects();

// const updateProposal = async () => {
//   try {
//     // const projectsToUpdate = await Project.find({
//     //   billingType: "Bid",
//     //   $or: [{ isProposalClosed : { $exists: false } }, { proposalId: "" }],
//     // });

//     // const projects = await Project.find({isProposalClosed : { $exists: false }, billingType : "Bid"});

//     // for (const project of projects) {
//     //   // const newProposalId = await generateProposalId();

//     //   if(project.status === "Active"){
//     //     await Project.updateOne(
//     //     { _id: project._id },
//     //     { $set: { isProposalClosed: newProposalId } }
//     //   );
//     //   }

//     //   console.log(`Updated project ${project._id} with proposalId: ${newProposalId}`);
//     // }

//     await Project.updateMany({isProposalClosed : { $exists: false }}, {
//       $set : {
//         isProposalClosed : false
//       }
//     })

//     console.log("✅ All applicable projects have been updated.");
//   } catch (error) {
//     console.error("❌ Error while updating proposalIds:", error.message);
//   }
// };

// updateProposal();
