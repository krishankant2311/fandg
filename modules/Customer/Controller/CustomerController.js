const Admin = require("../../Admin/Model/adminModel");
const Customer = require("../Model/CustomerModel");
const Staff = require("../../Staff/Model/staffModel");
const Project = require("../../Projects/Model/projectModel");

const validator = require("validator");

// Methods

const isValidEmail = (email) => {
  if (validator.isEmail(email)) {
    return true;
  }
  return false;
};

// Controllers

exports.createCustomer = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id);

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { customerName, customerEmail, customerPhone, jobAddress } = req.body;
    customerName = customerName?.trim();
    if (customerEmail) {
      customerEmail = customerEmail?.trim()?.toLowerCase();
      if (!isValidEmail(customerEmail)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid Customer Email",
          result: {},
        });
      }
    }
    if (customerPhone) {
      customerPhone = customerPhone?.trim();
    }

    if (!customerName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer Name is required",
        result: {},
      });
    }

    // if (!customerEmail) {
    //   return res.send({
    //     statusCode: 400,
    //     success: false,
    //     message: "Customer Email is required",
    //     result: {},
    //   });
    // }

    // if (!customerPhone) {
    //   return res.send({
    //     statusCode: 400,
    //     success: false,
    //     message: "Customer Phone is required",
    //     result: {},
    //   });
    // }

    if (!jobAddress) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Address is required",
        result: {},
      });
    }

    jobAddress = JSON.parse(jobAddress);

    if (jobAddress.length === 0) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Address must contain at least one job type",
        result: {},
      });
    }

    // Check customer already exist or not

    // const isCustomerExist = await Customer.findOne({ customerPhone });

    // if (isCustomerExist && isCustomerExist.status === "Delete") {
    //   isCustomerExist.status = "Active";
    //   await isCustomerExist.save();

    //   return res.send({
    //     statusCode: 201,
    //     success: true,
    //     message: "Customer created successfully",
    //     result: {},
    //   });
    // }

    // if (isCustomerExist && isCustomerExist.status === "Active") {
    //   return res.send({
    //     statusCode: 400,
    //     success: false,
    //     message: "Customer with this phone number already exist",
    //     result: {},
    //   });
    // }

    const newCustomer = new Customer({
      customerName,
      customerEmail,
      customerPhone,
      jobAddress,
      status: "Active",
    });

    const savedCustomer = await newCustomer.save();

    if (savedCustomer) {
      return res.send({
        statusCode: 201,
        success: true,
        message: "Customer created successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Failed to create customer",
        result: {},
      });
    }
  } catch (err) {
    return res.send({
      statusCode: 404,
      success: false,
      message: err.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id);

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const customerId = req.params.customerId;

    if (!customerId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer ID is required",
        result: {},
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      status: "Active",
    });

    if (!customer) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Customer not found",
        result: {},
      });
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customer found successfully",
      result: customer,
    });
  } catch (error) {
    return res.send({
      statusCode: 404,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id);

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const customerId = req.params.customerId;

    if (!customerId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer ID is required",
        result: {},
      });
    }

    let { customerName, customerEmail, customerPhone, jobAddress } = req.body;
    customerName = customerName?.trim();
    customerEmail = customerEmail?.trim()?.toLowerCase();
    customerPhone = customerPhone?.trim();

    if (!customerName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer Name is required",
        result: {},
      });
    }

    // if (!customerEmail) {
    //   return res.send({
    //     statusCode: 400,
    //     success: false,
    //     message: "Customer Email is required",
    //     result: {},
    //   });
    // }

    // if (!isValidEmail(customerEmail)) {
    //   return res.send({
    //     statusCode: 400,
    //     success: false,
    //     message: "Invalid Customer Email",
    //     result: {},
    //   });
    // }

    // if (!customerPhone) {
    //   return res.send({
    //     statusCode: 400,
    //     success: false,
    //     message: "Customer Phone is required",
    //     result: {},
    //   });
    // }

    if (!jobAddress) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Address is required",
        result: {},
      });
    }

    jobAddress = JSON.parse(jobAddress);

    if (jobAddress.length === 0) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Address must contain at least one job type",
        result: {},
      });
    }

    if (customerPhone) {
      const isPhoneAlreadyExists = await Customer.findOne({
        customerPhone,
        _id: { $ne: customerId },
        status: "Active",
      });

      if (isPhoneAlreadyExists) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Customer with this phone number already exist",
          result: {},
        });
      }
    }
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      {
        customerName,
        customerEmail,
        customerPhone,
        jobAddress,
      },
      { new: true }
    );

    if (!customer) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Customer not found",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Customer updated successfully",
        result: {},
      });
    }
  } catch (error) {
    return res.send({
      statusCode: 404,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id);

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { customerId } = req.params;

    if (!customerId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer ID is required",
        result: {},
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { status: "Delete" },
      { new: true }
    );

    if (customer) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Customer deleted successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Customer not found",
        result: {},
      });
    }
  } catch (e) {
    return res.send({
      statusCode: 404,
      success: false,
      message: e.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id);
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!admin && !staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        result: {},
      });
    }

    let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    sortBy = sortBy ? sortBy : "customerName";
    sortOrder = Number.parseInt(sortOrder) || -1;

    console.log("Sort", sortOrder, sortBy);

    const query = { status: "Active" };

    query.$or = [
      { customerName: { $regex: search, $options: "i" } },
      { customerEmail: { $regex: search, $options: "i" } },
      { customerPhone: { $regex: search, $options: "i" } },
    ];

    const customers = await Customer.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    const totalCustomers = await Customer.countDocuments(query);

    const totalPages = Math.ceil(totalCustomers / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customers fetched successfully",
      result: {
        customers,
        totalRecords: totalCustomers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (err) {
    return res.send({
      statusCode: 401,
      success: false,
      message: err.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.searchCustomersByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();
    if (!admin && !staff) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Access!",
      });
    }

    // Read the page and limit from query parameters
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Read the search term from the request body
    const { term = "" } = req.body;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Create a filter for the search term

    let filter = {
      status: {
        $in: ["Active"],
      },
    };
    if (term) {
      filter = {
        status: {
          $in: ["Active"],
        },
        $or: [
          { customerName: { $regex: term, $options: "i" } },
          { customerEmail: { $regex: term, $options: "i" } },
          { customerPhone: { $regex: term, $options: "i" } },
        ],
      };
    }

    // Fetch the notifications with pagination and search filter
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(filter);

    // Get the total count of notifications
    const totalCount = await Customer.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customers fetched successfully.",
      result: {
        customers,
        totalRecords: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (e) {
    console.error("Error :", e);
    return res.status(500).send({
      statusCode: 500,
      success: false,
      result: {},
      message: e.message || "Internal Server Error",
    });
  }
};

exports.getAllCustomersForProjects = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id);
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!admin && !staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        result: {},
      });
    }

    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const customers = await Customer.find({ status: "Active" }).sort({
      createdAt: -1,
    });
    // .skip(skip)
    // .limit(limit);
    const totalCustomers = await Customer.countDocuments({ status: "Active" });

    let updatedLists = [];

    updatedLists = await Promise.all(
      customers.map(async (customer, index) => {
        const isProjectExists = await Project.findOne({
          customerName: customer.customerName,
          status: { $in: ["Ongoing", "Completed"] },
        }).lean();
        if (isProjectExists) {
          return customer;
        } else {
          return undefined;
        }
      })
    );

    updatedLists = updatedLists.filter((customer) => {
      return customer;
    });

    console.log("Projects Customers", updatedLists.length);

    const totalPages = Math.ceil(updatedLists.length / limit);

    updatedLists = updatedLists.slice(skip, skip + limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customers fetched successfully",
      result: {
        customers: updatedLists,
        totalRecords: updatedLists.length,
        currentPage: page,
        totalPages,
      },
    });
  } catch (err) {
    return res.send({
      statusCode: 401,
      success: false,
      message: err.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getAllCustomersForProjects = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id);
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!admin && !staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        result: {},
      });
    }

    let {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = 1,
      search = "",
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Define the aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "customerId",
          as: "projects",
        },
      },
      {
        $unwind: "$projects",
      },
      {
        $match: {
          "projects.status": { $in: ["Completed", "Ongoing"] },
        },
      },
      {
        $group: {
          _id: "$_id",
          customerName: { $first: "$customerName" },
          customerEmail: { $first: "$customerEmail" },
          customerPhone: { $first: "$customerPhone" },
          projects: { $push: "$projects" },
        },
      },
      {
        $match: {
          $or: [
            { customerName: { $regex: search, $options: "i" } }, // Case-insensitive search by name
            { customerEmail: { $regex: search, $options: "i" } }, // Case-insensitive search by email
            { customerPhone: { $regex: search, $options: "i" } }, // Case-insensitive search by phone
          ],
        },
      },
      {
        $sort: {
          [sortBy]: Number.parseInt(sortOrder), // Dynamic sorting
        },
      },
      {
        $skip: skip, // Pagination: Skip documents
      },
      {
        $limit: limit, // Pagination: Limit the number of documents
      },
      {
        $project: {
          _id: 1, // Exclude the _id field
          customerName: 1,
          customerEmail: 1,
          customerPhone: 1,
        },
      },
    ];

    // Get customers and total count for pagination
    const customers = await Customer.aggregate(pipeline);
    const totalRecords = await Customer.aggregate([
      ...pipeline.slice(0, -4), // Exclude $skip, $limit, and $project for total count
      { $count: "total" },
    ]);

    const totalPages = Math.ceil((totalRecords[0]?.total || 0) / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customers fetched successfully",
      result: {
        customers,
        totalRecords: totalRecords[0]?.total || 0,
        currentPage: page,
        totalPages,
      },
    });
  } catch (err) {
    return res.send({
      statusCode: 401,
      success: false,
      message: err.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.searchCustomersForProjectsByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();
    if (!admin && !staff) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Access!",
      });
    }

    // Read the page and limit from query parameters
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Read the search term from the request body
    const { term = "" } = req.body;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Create a filter for the search term

    let filter = {
      status: {
        $in: ["Active"],
      },
    };
    if (term) {
      filter = {
        status: {
          $in: ["Active"],
        },
        $or: [
          { customerName: { $regex: term, $options: "i" } },
          { customerEmail: { $regex: term, $options: "i" } },
          { customerPhone: { $regex: term, $options: "i" } },
        ],
      };
    }

    // Fetch the notifications with pagination and search filter
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      // .skip(skip)
      // .limit(limit)
      .lean();

    // console.log(filter);

    let updatedLists = [];

    updatedLists = await Promise.all(
      customers.map(async (customer, index) => {
        const isProjectExists = await Project.findOne({
          customerName: customer.customerName,
          status: { $in: ["Ongoing", "Completed"] },
        }).lean();
        if (isProjectExists) {
          return customer;
        } else {
          return undefined;
        }
      })
    );

    updatedLists = updatedLists.filter((customer) => {
      return customer;
    });

    console.log("Projects Customers", updatedLists.length);

    const totalPages = Math.ceil(updatedLists.length / limit);

    updatedLists = updatedLists.slice(skip, skip + limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customers fetched successfully",
      result: {
        customers: updatedLists,
        totalRecords: updatedLists.length,
        currentPage: page,
        totalPages,
      },
    });

    // Get the total count of notifications
    const totalCount = await Customer.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customers fetched successfully.",
      result: {
        customers,
        totalRecords: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (e) {
    console.error("Error :", e);
    return res.status(500).send({
      statusCode: 500,
      success: false,
      result: {},
      message: e.message || "Internal Server Error",
    });
  }
};

exports.getCustomersDpd = async (req, res) => {
  try {
    let token = req.token;
    let staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();
    if (!staff) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Staff!",
      });
    }

    const customers = await Customer.find({}).sort({ customerName: 1 }).lean();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customers fetched successfully.",
      result: customers,
    });
  } catch (e) {
    console.error("Error :", e);
    return res.status(500).send({
      statusCode: 500,
      success: false,
      message: e.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getCustomerProjects = async (req, res) => {
  try {
    let token = req.token;
    let staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();
    if (!staff) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Staff!",
      });
    }

    let { customerId } = req.params;
    let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    sortBy = sortBy == null ? sortBy : "createdAt";
    sortOrder = Number.parseInt(sortOrder) || -1;

    if (!customerId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer ID is required.",
        result: {},
      });
    }

    const customer = await Customer.findById(customerId).lean();

    if (!customer) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Customer not found.",
        result: {},
      });
    }

    const query = {
      // customerPhone: customer.customerPhone,
      // customerEmail: customer.customerEmail,
      customerId: customerId,
      status: { $in: ["Ongoing", "Completed"] },
    };

    if (search) {
      query.$and = [
        {
          $or: [
            { projectCode: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const totalProjects = await Project.countDocuments(query);

    console.log("Query", query);

    const projects = await Project.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Projects fetched successfully.",
      result: {
        projects,
        totalRecords: totalProjects,
        currentPage: page,
        totalPages: Math.ceil(totalProjects / limit),
      },
    });
  } catch (e) {
    console.error("Error :", e);
    return res.send({
      statusCode: 500,
      success: false,
      message: e.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.searchCustomerProjectByTerm = async (req, res) => {
  try {
    let token = req.token;
    let staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();
    if (!staff) {
      return res.send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized staff!",
      });
    }

    // Read the page and limit from query parameters
    const { customerId } = req.params;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (!customerId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Customer ID is required.",
        result: {},
      });
    }

    const customer = await Customer.findById(customerId).lean();

    // Read the search term from the request body
    const { term = "" } = req.body;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Create a filter for the search term

    let filter = {
      // customerPhone: customer.customerPhone,
      // customerEmail: customer.customerEmail,
      customerName: customer.customerName,
      status: { $in: ["Ongoing", "Completed"] },
    };
    if (term) {
      filter = {
        // customerPhone: customer.customerPhone,
        // customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        status: { $in: ["Ongoing", "Completed"] },
        $or: [
          { projectCode: { $regex: term, $options: "i" } },
          { customerName: { $regex: term, $options: "i" } },
        ],
      };
    }

    // Fetch the notifications with pagination and search filter
    const projects = await Project.find(filter)
      .sort({ projectStartDate: -1 })
      .skip(skip)
      .limit(limit);

    // Get the total count of notifications
    const totalCount = await Project.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Projects fetched successfully.",
      result: {
        projects,
        totalRecords: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (e) {
    console.error("Error :", e);
    return res.status(500).send({
      statusCode: 500,
      success: false,
      result: {},
      message: e.message || "Internal Server Error",
    });
  }
};
