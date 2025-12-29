const Project = require("../Model/projectModel");
const Staff = require("../../Staff/Model/staffModel");
const Material = require("../../Material/Model/materialModel");
const JobType = require("../../JobType/Model/jobTypeModel");
const Customer = require("../../Customer/Model/CustomerModel");
const Admin = require("../../Admin/Model/adminModel");
const mongoose = require("mongoose");
const CopyNumber = require("../Model/projectCopyNumber");
const FieldCopyHistory = require("../../copies/Model/FieldCopyModel");

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

function formatDate(inputDate) {
  // Split the input date (dd-mm-yyyy)
  const [day, month, year] = inputDate.split("-").map(Number);

  // Create a new Date object
  const date = new Date(year, month - 1, day); // Month is 0-indexed

  // Options for formatting
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // Format the date
  return date.toLocaleDateString("en-US", options);
}

const generateUniqueProjectId = async () => {
  let uniqueId;
  let isUnique = false;

  while (!isUnique) {
    uniqueId = generateCustomId();
    const existingProject = await Project.findOne({ projectId: uniqueId });
    if (!existingProject) {
      isUnique = true;
    }
  }

  return uniqueId;
};

// const getTotalManHours = (startTime, endTime, totalPerson) => {
//   const startHours = startTime.split(":")[0];
//   const endHours = endTime.split(":")[0];
//   let resultedHours = Math.abs(
//     Number.parseInt(startHours) - Number.parseInt(endHours)
//   );

//   const startMinutes = startTime.split(":")[1];
//   const endMinutes = endTime.split(":")[1];

//   if (startMinutes > endMinutes) {
//     resultedHours -= 1;
//   } else if (startMinutes < endMinutes) {
//     resultedHours += 1;
//   }

//   return totalPerson * resultedHours;
// };

const getTotalManHours = (startTime, endTime, totalPerson = 0) => {
  const startParts = startTime.split(":");
  const endParts = endTime.split(":");

  const startHours = Number.parseInt(startParts[0], 10);
  const startMinutes = Number.parseInt(startParts[1], 10);
  const endHours = Number.parseInt(endParts[0], 10);
  const endMinutes = Number.parseInt(endParts[1], 10);

  // Calculate total minutes for both times
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  // Calculate the difference in minutes
  let differenceInMinutes = endTotalMinutes - startTotalMinutes;

  // Ensure we have a non-negative difference
  if (differenceInMinutes < 0) {
    console.warn("End time is earlier than start time.");
    return 0; // or handle the case as needed
  }

  // Convert minutes back to hours
  const resultedHours = differenceInMinutes / 60;

  // Return the total man-hours
  return totalPerson * resultedHours;
};

// const generateUniqueIdForCopy = async (project) => {
//   const name = project.customerName[0];
//   const projectJobAddress = project.jobAddress?.trim();
//   const jobAddressLength = projectJobAddress?.split(" ")[0]?.length;
//   const jobAddress =
//     projectJobAddress.split(" ")[0][jobAddressLength - 2] +
//     projectJobAddress.split(" ")[0][jobAddressLength - 1];
//   const currentNumber = await CopyNumber.findOne({});
//   const number = Number.parseInt(currentNumber.copyNumber);

//   const uniqueCode = name + jobAddress + "-" + (30000 + number).toString();

//   return uniqueCode?.toString();
// };

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

function convertDateToMilliseconds(dateString) {
  // Split the input date string into parts
  const [day, month, year] = dateString.split("-").map(Number);

  // Create a new Date object (month is 0-indexed)
  // const date = new Date(year, month - 1, day);

  // Create a date in UTC to avoid timezone shift
  const date = new Date(Date.UTC(year, month - 1, day));

  // Convert the date to milliseconds
  return date.getTime();
}

// Controllers

exports.createProject = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      let {
        billingType,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        jobAddress,
        jobType,
        foreman,
        description,
        crew,
        truckNo,
        projectManager,
        trailerNo,
        selectedType,
        credits,
        billAddress,
        jobName,
        customerType,
        billingName,
        isProjectTaxable,
        nonTaxCredits,
        nonTaxDescription,
        taxCredits,
        taxDescription,
      } = req.body;

      if (
        [
          billingType,
          customerName,
          // customerPhone,
          jobAddress,
          // customerEmail,
          // foreman,
          jobType,
          // projectManager,
          // description,
          selectedType,
        ].some((field) => !field && field.trim() === "")
      ) {
        return res.send({
          statusCode: 200,
          success: false,
          message: "All Fields are required",
          result: {},
        });
      }

      customerEmail = customerEmail?.trim()?.toLowerCase();
      customerName = customerName?.trim();
      description = description?.trim();
      billAddress = billAddress?.trim();
      customerType = customerType?.trim();

      if (jobName) {
        jobName = jobName?.trim();
      }

      if (billingName) {
        billingName = billingName?.trim();
      }

      if (isProjectTaxable === true || isProjectTaxable === "true") {
        isProjectTaxable = true;
      }

      console.log("Is project taxable", isProjectTaxable);

      selectedType = Number.parseInt(selectedType);

      let customerSavedId = "";

      if (customerId) {
        const isCustomerExist = await Customer.findOne({
          _id: customerId,
        });

        // If customer exist and selected type is 0, then check whether number is exist or not
        if (
          isCustomerExist &&
          isCustomerExist.status === "Active" &&
          selectedType === 0
        ) {
          return res.send({
            statusCode: 400,
            success: false,
            message: "Customer already exist",
            result: {},
          });
        }

        // Is customer has delete status , then update status and their value
        if (isCustomerExist && isCustomerExist.status === "Delete") {
          isCustomerExist.customerName = customerName;
          isCustomerExist.customerPhone = customerPhone;
          isCustomerExist.customerEmail = customerEmail;
          isCustomerExist.jobAddress = [jobAddress];
          isCustomerExist.status = "Active";
          await isCustomerExist.save();
        }

        // If customer job address not exist in customer account, then add this job address to customer job address list
        if (
          isCustomerExist &&
          isCustomerExist.status === "Active" &&
          !isCustomerExist.jobAddress.some(
            (address) => address?.toLowerCase() === jobAddress?.toLowerCase()
          )
        ) {
          isCustomerExist.jobAddress = [
            ...isCustomerExist.jobAddress,
            jobAddress,
          ];
          await isCustomerExist.save();
        }

        customerSavedId = customerId;
      } else {
        const newCustomer = new Customer({
          customerName,
          customerEmail,
          customerPhone,
          jobAddress: [jobAddress],
          status: "Active",
        });

        await newCustomer.save();

        customerSavedId = newCustomer._id;
      }

      // if(!customerType){
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Customer Type is required",
      //     result: {},
      //   })
      // }

      // // If customer does not exist, then create customer document
      // if (!isCustomerExist) {

      // }

      // if(!billAddress){
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Bill Address is required",
      //     result: {},
      //   })
      // }

      if (!["Bid", "No Bid"].includes(billingType)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid Billing Type. Use 'Bid' or 'No Bid'",
          result: {},
        });
      }

      if (!jobType) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Job Type is required",
          result: {},
        });
      }

      const job = await JobType.findOne({ _id: jobType });

      if (!job) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Job Type not found",
          result: {},
        });
      }

      // if (!foreman) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Foreman is required",
      //     result: {},
      //   });
      // }

      if (!crew) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Crew is required",
          result: {},
        });
      }

      crew = crew.split(",");

      // if (!truckNo) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Truck Number is required",
      //     result: {},
      //   });
      // }

      // if (!trailerNo) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Trailer Number is required",
      //     result: {},
      //   });
      // }

      if (req.body && req.body?.forms) {
        req.body.forms = JSON.parse(req.body.forms);
        console.log("Form", req.body.forms);
      }

      if (trailerNo) {
        trailerNo = trailerNo?.trim();
      }

      // if(nonTaxCredits) {
      //   nonTax
      // }

      // const projectCode = await generateUniqueProjectId();

      // const isProjectExist = await Project.findOne({
      //   billingType,
      //   jobAddress,
      //   jobType,
      //   foreman,
      //   crew,
      //   truckNo,
      //   trailerNo,
      // });

      // if (isProjectExist && isProjectExist?.status === "Delete") {
      //   isProjectExist.status = "Active";
      //   await isProjectExist.save();

      //   return res.send({
      //     statusCode: 201,
      //     success: true,
      //     message: "Project created successfully",
      //     result: {},
      //   });
      // }

      // if (isProjectExist) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Project with this details already exist",
      //     result: {},
      //   });
      // }

      let entryDate = new Date(Date.now());
      // const day = entryDate.getDate();
      // const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = entryDate.getFullYear();

      const day = entryDate.getUTCDate();
      const month = entryDate.getUTCMonth() + 1; // Months are zero-based
      const year = entryDate.getUTCFullYear();

      entryDate = `${day}-${month}-${year}`;

      const newProject = new Project({
        billingType,
        customerId: customerSavedId,
        customerName,
        customerEmail,
        customerPhone,
        customerType,
        billingName,
        jobAddress,
        jobType,
        credits,
        foreman: foreman ? foreman : null,
        description,
        projectManager: projectManager ? projectManager : "",
        crew,
        truckNo: truckNo ? truckNo : "",
        trailerNo: trailerNo ? trailerNo : "",
        staffId: token._id,
        officeFieldCopy: [],
        customerFieldCopy: [],
        bidedCopy: req.body?.forms ? req.body.forms : [],
        bidingCopy: billingType === "Bid" ? Date.now() : "",
        billAddress,
        jobName,
        isProjectTaxable,
        nonTaxCredits,
        nonTaxDescription,
        taxCredits,
        taxDescription,
      });

      const savedProject = await newProject.save();

      if (savedProject) {
        return res.send({
          statusCode: 201,
          success: true,
          message: "Project created successfully",
          result: savedProject,
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Failed to create project",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.createBid = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      let {
        billingType,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        customerType,
        jobAddress,
        jobType,
        foreman,
        description,
        crew,
        truckNo,
        projectManager,
        trailerNo,
        selectedType,
        credits,
        billAddress,
        jobName,
        isProjectTaxable,
        nonTaxCredits,
        nonTaxDescription,
        taxCredits,
        taxDescription,
      } = req.body;

      if (
        [
          billingType,
          customerName,
          // customerPhone,
          jobAddress,
          // customerEmail,
          // foreman,
          jobType,
          // projectManager,
          // description,
          selectedType,
          // billAddress
        ].some((field) => !field && field.trim() === "")
      ) {
        return res.send({
          statusCode: 200,
          success: false,
          message: "All Fields are required",
          result: {},
        });
      }

      customerEmail = customerEmail?.trim()?.toLowerCase();
      customerName = customerName?.trim();
      description = description?.trim();
      customerType = customerType?.trim();
      selectedType = Number.parseInt(selectedType);
      let customerSavedId = "";

      if (jobName) {
        jobName = jobName.trim();
      }

      if (isProjectTaxable === true || isProjectTaxable === "true") {
        isProjectTaxable = true;
      }

      if (customerId) {
        const isCustomerExist = await Customer.findOne({
          _id: customerId,
        });

        // If customer exist and selected type is 0, then check whether number is exist or not
        if (
          isCustomerExist &&
          isCustomerExist.status === "Active" &&
          selectedType === 0
        ) {
          return res.send({
            statusCode: 400,
            success: false,
            message: "Customer already exist",
            result: {},
          });
        }

        // Is customer has delete status , then update status and their value
        if (isCustomerExist && isCustomerExist.status === "Delete") {
          isCustomerExist.customerName = customerName;
          isCustomerExist.customerPhone = customerPhone;
          isCustomerExist.customerEmail = customerEmail;
          isCustomerExist.jobAddress = [jobAddress];
          isCustomerExist.status = "Active";
          await isCustomerExist.save();
        }

        // If customer job address not exist in customer account, then add this job address to customer job address list
        if (
          isCustomerExist &&
          isCustomerExist.status === "Active" &&
          isCustomerExist.jobAddress.some(
            (address) => address?.toLowerCase() !== jobAddress?.toLowerCase()
          )
        ) {
          isCustomerExist.jobAddress = [
            ...isCustomerExist.jobAddress,
            jobAddress,
          ];
          await isCustomerExist.save();
        }
        customerSavedId = customerId;
      } else {
        const newCustomer = new Customer({
          customerName,
          customerEmail,
          customerPhone,
          jobAddress: [jobAddress],
          status: "Active",
        });

        await newCustomer.save();

        customerSavedId = newCustomer._id;
      }

      // if(!customerType){
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Customer Type is required",
      //     result: {},
      //   })
      // }

      // If customer does not exist, then create customer document
      // if (!isCustomerExist) {

      // }

      if (!["Bid", "No Bid"].includes(billingType)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid Billing Type. Use 'Bid' or 'No Bid'",
          result: {},
        });
      }

      if (!jobType) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Job Type is required",
          result: {},
        });
      }

      const job = await JobType.findOne({ _id: jobType });

      if (!job) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Job Type not found",
          result: {},
        });
      }

      // if (!foreman) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Foreman is required",
      //     result: {},
      //   });
      // }

      // if (!crew) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Crew is required",
      //     result: {},
      //   });
      // }

      if (crew) {
        crew = crew.split(",");
      }

      // if (!truckNo) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Truck Number is required",
      //     result: {},
      //   });
      // }

      // if (!trailerNo) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Trailer Number is required",
      //     result: {},
      //   });
      // }

      if (req.body && req.body?.forms) {
        req.body.forms = JSON.parse(req.body.forms);
        console.log("Form", req.body.forms);
      }

      if (trailerNo) {
        trailerNo = trailerNo?.trim();
      }

      // const projectCode = await generateUniqueProjectId();

      // const isProjectExist = await Project.findOne({
      //   billingType,
      //   jobAddress,
      //   jobType,
      //   foreman,
      //   crew,
      //   truckNo,
      //   trailerNo,
      // });

      // if (isProjectExist && isProjectExist?.status === "Delete") {
      //   isProjectExist.status = "Active";
      //   await isProjectExist.save();

      //   return res.send({
      //     statusCode: 201,
      //     success: true,
      //     message: "Project created successfully",
      //     result: {},
      //   });
      // }

      // if (isProjectExist) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Project with this details already exist",
      //     result: {},
      //   });
      // }

      let entryDate = new Date(Date.now());
      // const day = entryDate.getDate();
      // const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = entryDate.getFullYear();

      const day = entryDate.getUTCDate();
      const month = entryDate.getUTCMonth() + 1; // Months are zero-based
      const year = entryDate.getUTCFullYear();

      entryDate = `${day}-${month}-${year}`;

      let bidCopyId = "";

      if (billingType === "Bid") {
        let currentNumber = await CopyNumber.findOne({});

        bidCopyId = await generateUniqueIdForCopy({
          customerName,
          jobAddress,
          copyIndex: Number.parseInt(currentNumber.copyNumber),
        });
        copyIndex = Number.parseInt(currentNumber.copyNumber) + 1;
        currentNumber.copyNumber =
          Number.parseInt(currentNumber.copyNumber) + 1;
        await currentNumber.save();
      }

      const newProject = new Project({
        billingType,
        customerId: customerSavedId,
        customerName,
        customerEmail,
        customerPhone,
        customerType,
        jobAddress,
        billAddress,
        jobType,
        credits,
        foreman: foreman ? foreman : null,
        description,
        projectManager: projectManager ? projectManager : "",
        crew: crew ? crew : [],
        truckNo: truckNo ? truckNo : "",
        trailerNo: trailerNo ? trailerNo : "",
        staffId: token._id,
        officeFieldCopy: [],
        customerFieldCopy: [],
        bidCopyId,
        copyIndex,
        bidedCopy: req.body?.forms ? req.body.forms : [],
        bidingCopy: billingType === "Bid" ? Date.now() : "",
        jobName,
        isProjectTaxable,
        nonTaxCredits,
        nonTaxDescription,
        taxCredits,
        taxDescription,
      });

      const savedProject = await newProject.save();

      if (savedProject) {
        return res.send({
          statusCode: 201,
          success: true,
          message: "Project created successfully",
          result: savedProject,
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Failed to create project",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getProjectList = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSizeNumber = parseInt(limit, 10);

      sortBy = sortBy ? sortBy : "projectStartDate";
      sortOrder = Number.parseInt(sortOrder) || -1;

      const query = {
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Active", "Ongoing", "Completed"],
            },
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Ongoing", "Completed"],
            },
          },
        ],
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

      // const totalProjects = await Project.countDocuments({
      //   staffId: token._id,
      //   status : {
      //     $or : [
      //       {$in: ["Active","Completed","Ongoing"],billingType : "No Bid"},
      //       {$in: ["Completed","Ongoing"],billingType : "No Bid"}
      //     ]
      //   }
      // });
      const totalProjects = await Project.countDocuments(query);
      // const projects = await Project.find({
      //   staffId: token._id,
      //   status: {
      //     $in: ["Active", "Completed", "Ongoing"],
      //   },
      // })
      const projects = await Project.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((pageNumber - 1) * pageSizeNumber)
        .limit(pageSizeNumber);

      if (projects) {
        return res.send({
          statusCode: 200,
          success: true,
          message: "Projects fetched successfully",
          result: {
            projects,
            totalRecords: totalProjects,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProjects / pageSizeNumber),
          },
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Projects not found",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getCompletedProjectList = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { page = 1, pageSize = 10 } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSizeNumber = parseInt(pageSize, 10);

      // const totalProjects = await Project.countDocuments({
      //   staffId: token._id,
      //   status : {
      //     $or : [
      //       {$in: ["Active","Completed","Ongoing"],billingType : "No Bid"},
      //       {$in: ["Completed","Ongoing"],billingType : "No Bid"}
      //     ]
      //   }
      // });
      const totalProjects = await Project.countDocuments({
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Completed"],
            },
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Completed"],
            },
          },
        ],
      });
      // const projects = await Project.find({
      //   staffId: token._id,
      //   status: {
      //     $in: ["Active", "Completed", "Ongoing"],
      //   },
      // })
      const projects = await Project.find({
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Completed"],
            },
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Completed"],
            },
          },
        ],
      })
        // .select("-officeFieldCopy -customerFieldCopy -bidedCopy")
        .sort({ projectStartDate: -1 })
        .skip((pageNumber - 1) * pageSizeNumber)
        .limit(pageSizeNumber);

      if (projects) {
        return res.send({
          statusCode: 200,
          success: true,
          message: "Projects fetched successfully",
          result: {
            projects,
            totalRecords: totalProjects,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProjects / pageSizeNumber),
          },
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Projects not found",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getBilledProjectList = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSizeNumber = parseInt(limit, 10);

      sortBy = sortBy ? sortBy : "projectStartDate";
      sortOrder = Number.parseInt(sortOrder) || -1;

      const query = {
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Billed"],
            },
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Billed"],
            },
          },
        ],
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

      // const totalProjects = await Project.countDocuments({
      //   staffId: token._id,
      //   status : {
      //     $or : [
      //       {$in: ["Active","Completed","Ongoing"],billingType : "No Bid"},
      //       {$in: ["Completed","Ongoing"],billingType : "No Bid"}
      //     ]
      //   }
      // });
      const totalProjects = await Project.countDocuments(query);
      // const projects = await Project.find({
      //   staffId: token._id,
      //   status: {
      //     $in: ["Active", "Completed", "Ongoing"],
      //   },
      // })
      const projects = await Project.find(query)
        .sort({ [sortBy]: sortOrder })
        .sort({ projectStartDate: -1 })
        .skip((pageNumber - 1) * pageSizeNumber)
        .limit(pageSizeNumber);

      if (projects) {
        return res.send({
          statusCode: 200,
          success: true,
          message: "Projects fetched successfully",
          result: {
            projects,
            totalRecords: totalProjects,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProjects / pageSizeNumber),
          },
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Projects not found",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getDeletedProjectList = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSizeNumber = parseInt(limit, 10);

      sortBy = sortBy ? sortBy : "projectStartDate";
      sortOrder = Number.parseInt(sortOrder) || -1;

      const query = {
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Delete"],
            },
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Delete"],
            },
          },
        ],
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

      // const totalProjects = await Project.countDocuments({
      //   staffId: token._id,
      //   status : {
      //     $or : [
      //       {$in: ["Active","Completed","Ongoing"],billingType : "No Bid"},
      //       {$in: ["Completed","Ongoing"],billingType : "No Bid"}
      //     ]
      //   }
      // });
      const totalProjects = await Project.countDocuments(query);
      // const projects = await Project.find({
      //   staffId: token._id,
      //   status: {
      //     $in: ["Active", "Completed", "Ongoing"],
      //   },
      // })
      const projects = await Project.find(query)
        .sort({ [sortBy]: sortOrder })
        .sort({ projectStartDate: -1 })
        .skip((pageNumber - 1) * pageSizeNumber)
        .limit(pageSizeNumber);

      if (projects) {
        return res.send({
          statusCode: 200,
          success: true,
          message: "Projects fetched successfully",
          result: {
            projects,
            totalRecords: totalProjects,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProjects / pageSizeNumber),
          },
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Projects not found",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getBidProjectList = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      let { page = 1, limit = 10, sortOrder, sortBy, search } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSizeNumber = parseInt(limit, 10);

      sortBy = sortBy ? sortBy : "projectStartDate";
      sortOrder = Number.parseInt(sortOrder) || -1;

      const query = {
        billingType: "Bid",
        status: {
          $in: ["Active", "Ongoing", "Completed", "Billed"],
        },
      };

      if (search) {
        query.$and = [
          {
            $or: [
              { customerName: { $regex: search, $options: "i" } },
              { jobName: { $regex: search, $options: "i" } },
            ],
          },
        ];
      }

      const totalProjects = await Project.countDocuments(query);
      const projects = await Project.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((pageNumber - 1) * pageSizeNumber)
        .limit(pageSizeNumber);

      if (projects) {
        return res.send({
          statusCode: 200,
          success: true,
          message: "Projects fetched successfully",
          result: {
            projects,
            totalRecords: totalProjects,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProjects / pageSizeNumber),
          },
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Projects not found",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;
      if (!projectId) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Project ID is required",
          result: {},
        });
      }
      const project = await Project.findById(projectId);

      if (project) {
        return res.send({
          statusCode: 200,
          success: true,
          message: "Project fetched successfully ",
          result: project,
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }
    }
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};



exports.editProjects = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      console.log("before req body", req.body);

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      const project = await Project.findOne({
        _id: projectId,
      });

      if (!project) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      let customMssg = "Project updated successfully";

      // if(req.body && req.body?.customerName, req.body.customerEmail && req.body.customerPhone && req.body.jobAddress) {
      //   const isCustomerExist = await Customer.findOne({
      //     customerPhone : req.body.customerPhone
      //   })

      //   // Is customer has delete status , then update status and their value
      //   if (isCustomerExist && isCustomerExist.status === "Delete") {
      //     isCustomerExist.customerName = req.body?.customerName;
      //     isCustomerExist.customerPhone = req.body?.customerPhone;
      //     isCustomerExist.customerEmail = req.body?.customerEmail;
      //     isCustomerExist.jobAddress = [req.body?.jobAddress];
      //     isCustomerExist.status = "Active";
      //     await isCustomerExist.save();
      //   }

      //   // If customer job address not exist in customer account, then add this job address to customer job address list
      //   if(isCustomerExist && isCustomerExist.status === "Active" && isCustomerExist.jobAddress.some(address => (address?.toLowerCase() !== req.body.jobAddress?.toLowerCase()))){
      //     isCustomerExist.jobAddress = [...isCustomerExist.jobAddress, req.body.jobAddress];
      //   }

      //   // If customer does not exist, then create customer document
      //   if (!isCustomerExist) {
      //     const newCustomer = new Customer({
      //       customerName : req.body?.customerName,
      //       customerEmail : req.body?.customerEmail,
      //       customerPhone : req.body?.customerPhone,
      //       jobAddress : [req.body?.jobAddress],
      //       status : "Active"
      //     });

      //     await newCustomer.save();
      //   }
      // }

      if (req.body && req.body?.crew) {
        req.body.crew = req.body.crew.split(",");
      }

      // if (req.body && req.body?.forms) {
      //   req.body.forms = JSON.parse(req.body.forms);
      //   req.body.officeFieldCopy = req.body?.forms ? req.body.forms : [];
      //   req.body.customerFieldCopy = req.body?.forms ? req.body.forms : [];
      // }

      if (req.body && req.body?.trailerNo) {
        req.body.trailerNo = req.body.trailerNo?.trim();
      }

      if (req.body && req.body?.credits) {
        req.body.credits = Number.parseFloat(req.body.credits);
      }

      if (req.body && req.body.projectCode) {
        req.body.projectCode = req.body.projectCode;
        if (!project.isProjectStarted) {
          req.body.projectStartDate = Date.now().toString();
        }
        req.body.isProjectStarted = true;
        if (
          req.body.projectCode?.length < 1 &&
          req.body.projectCode?.length > 12
        ) {
          return res.send({
            statusCode: 400,
            success: false,
            message:
              "Project code must have length between 1 to 12 characters long",
            result: {},
          });
        }
        const isProjectExist = await Project.findOne({
          projectCode: req.body.projectCode,
          _id: { $ne: projectId },
          status: { $ne: "Delete" },
        });
        if (isProjectExist) {
          return res.send({
            statusCode: 400,
            success: false,
            message: "Project code already exist",
            result: {},
          });
        }
      }

      if (req.body && req.body.isProjectTaxable === "true") {
        isProjectTaxable = true;
      }

      if (req.body && req.body.status === "Completed") {
        // if (project.officeFieldCopy.length === 0) {
        //   return res.send({
        //     statusCode: 400,
        //     success: false,
        //     message:
        //       "You must create field copy before completing this project",
        //     result: {},
        //   });
        // }
        if (project.customerFieldCopy.length === 0) {
          return res.send({
            statusCode: 400,
            success: false,
            message:
              "You must generate customer copy before completing this project",
            result: {},
          });
        }
        if (project.draftCopy.length > 0) {
          return res.send({
            statusCode: 400,
            success: false,
            message:
              "You cannot update the project status to completed as it has draft copy.",
            result: {},
          });
        }
        customMssg = "The project has been successfully marked as completed.";
        const lastCustomerCopyIndex = project.customerFieldCopy.length - 1;
        const completedDate = convertDateToMilliseconds(
          project?.customerFieldCopy[lastCustomerCopyIndex]?.entryDate
        );
        req.body.projectCompletedDate = completedDate;
      }

      if (req.body && req.body.status === "Billed") {
        if (project.status !== "Completed") {
          return res.send({
            statusCode: 400,
            success: false,
            message:
              "You can only update the project status to billed when the project is completed.",
            result: {},
          });
        }
        req.body.status = "Billed";
        customMssg = "The project has been successfully marked as billed.";
      }

      if (req.body && req.body.status === "Delete") {
        customMssg = "Project deleted successfully";
      }

      if (req.body && req.body.isImportant) {
        req.body.isImportant = req.body.isImportant === "true" ? true : false;
        customMssg = `Project marked as ${
          req.body.isImportant ? "important" : "not important"
        }`;
      }

      if (project.status === "Delete" && req.body.status === "Ongoing") {
        customMssg = "Project has been restored successfully.";
      }

      if (req.body && req.body.status === "Ongoing") {
        req.body.projectCompletedDate = "";
      }

      if (req.body.foreman === "null") {
        req.body.foreman = null;
      }

      if (req.body.foreman === "") {
        req.body.foreman = null;
      }

      if (req.body.jobName) {
        req.body.jobName = req.body.jobName?.trim();
      }

      console.log("after req body", req.body);

      const updatedProjects = await Project.findOneAndUpdate(
        { _id: projectId },
        {
          $set: req.body,
        },
        {
          new: true,
        }
      );

      if (updatedProjects) {
        return res.send({
          statusCode: 200,
          success: true,
          message: customMssg,
          result: updatedProjects,
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not updated",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.log("Error", error?.message);
    return res.send({
      statusCode: 500,
      success: false,
      message: error?.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.searchAllProjectByTerm = async (req, res) => {
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
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Read the search term from the request body
    const { term = "" } = req.body;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Create a filter for the search term

    let filter = {
      $or: [
        {
          billingType: "No Bid",
          status: {
            $in: ["Active", "Ongoing", "Completed"],
          },
        },
        {
          billingType: "Bid",
          status: {
            $in: ["Ongoing", "Completed"],
          },
        },
      ],
    };
    if (term) {
      filter = {
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Active", "Ongoing", "Completed"],
            },
            $or: [
              { projectCode: { $regex: term, $options: "i" } },
              { customerName: { $regex: term, $options: "i" } },
            ],
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Ongoing", "Completed"],
            },
            $or: [
              { projectCode: { $regex: term, $options: "i" } },
              { customerName: { $regex: term, $options: "i" } },
            ],
          },
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

exports.searchCompletedProjectByTerm = async (req, res) => {
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
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Read the search term from the request body
    const { term = "" } = req.body;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Create a filter for the search term

    let filter = {
      $or: [
        {
          billingType: "No Bid",
          status: {
            $in: ["Completed"],
          },
        },
        {
          billingType: "Bid",
          status: {
            $in: ["Completed"],
          },
        },
      ],
    };
    if (term) {
      filter = {
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Completed"],
            },
            $or: [
              { projectCode: { $regex: term, $options: "i" } },
              { customerName: { $regex: term, $options: "i" } },
            ],
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Completed"],
            },
            $or: [
              { projectCode: { $regex: term, $options: "i" } },
              { customerName: { $regex: term, $options: "i" } },
            ],
          },
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

exports.searchBilledProjectByTerm = async (req, res) => {
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
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Read the search term from the request body
    const { term = "" } = req.body;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Create a filter for the search term

    let filter = {
      $or: [
        {
          billingType: "No Bid",
          status: {
            $in: ["Billed"],
          },
        },
        {
          billingType: "Bid",
          status: {
            $in: ["Billed"],
          },
        },
      ],
    };
    if (term) {
      filter = {
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Billed"],
            },
            $or: [
              { projectCode: { $regex: term, $options: "i" } },
              { customerName: { $regex: term, $options: "i" } },
            ],
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Billed"],
            },
            $or: [
              { projectCode: { $regex: term, $options: "i" } },
              { customerName: { $regex: term, $options: "i" } },
            ],
          },
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

exports.searchBidProjectByTerm = async (req, res) => {
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
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Read the search term from the request body
    const { term = "" } = req.body;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Create a filter for the search term

    let filter = {
      billingType: "Bid",
      status: {
        $in: ["Active"],
      },
    };
    if (term) {
      filter = {
        billingType: "Bid",
        status: {
          $in: ["Active"],
        },
        $or: [
          { customerEmail: { $regex: term, $options: "i" } },
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

// Draft Copy

exports.addDraftCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      let { forms, entryDate } = req.body;

      entryDate = new Date(entryDate);
      // const day = entryDate.getDate();
      // const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = entryDate.getFullYear();

      const day = entryDate.getUTCDate();
      const month = entryDate.getUTCMonth() + 1; // Months are zero-based
      const year = entryDate.getUTCFullYear();

      entryDate = `${day}-${month}-${year}`;

      console.log("Entry Date", entryDate);

      if (!forms) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Draft Copy is required",
          result: {},
        });
      }
      // console.log(forms);

      try {
        forms = JSON.parse(forms);

        if (!Array.isArray(forms)) {
          throw new Error("Invalid data format: 'forms' should be an array");
        }
      } catch (error) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid JSON format for forms",
          result: {},
        });
      }

      // Find the index of the draft copy with the matching entryDate
      const draftCopyIndex = project.draftCopy.findIndex(
        (copy) => copy.entryDate === entryDate
      );

      if (draftCopyIndex == -1) {
        project.draftCopy = [
          ...project.draftCopy,
          {
            entryDate: entryDate,
            draftCopies: forms,
          },
        ];
      } else {
        project.draftCopy[draftCopyIndex].draftCopies = [
          ...forms,
          ...project.draftCopy[draftCopyIndex].draftCopies,
        ];
      }

      await project.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Draft Copy saved successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getofficeDraftCopy = async (req, res) => {
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

    const { projectId } = req.params;

    if (!projectId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }

    const [draftCopiesData, materialDataByJobType, laborDataByJobType] =
      await Promise.all([
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array to process each entry individually
            $unwind: "$draftCopy",
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: "$draftCopy.draftCopies",
          },
          {
            // Unwind the copies array inside fieldCopies
            $unwind: "$draftCopy.draftCopies.copies",
          },
          {
            // Filter only active copies
            $match: { "draftCopy.draftCopies.copies.status": "Active" },
          },
          {
            // Group the results back into a single array of active copies
            $group: {
              _id: "$_id",
              activeOfficeCopies: {
                $push: "$draftCopy.draftCopies.copies",
              },
            },
          },
        ]),
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array
            $unwind: {
              path: "$draftCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: {
              path: "$draftCopy.draftCopies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Unwind the copies array inside fieldCopies
            $unwind: {
              path: "$draftCopy.draftCopies.copies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Match only active copies
            $match: { "draftCopy.draftCopies.copies.status": "Active" },
          },
          {
            // Group by jobType and sum the totalPrice
            $group: {
              _id: "$draftCopy.draftCopies.jobType", // Group by jobType
              totalPrice: {
                $sum: "$draftCopy.draftCopies.copies.totalPrice",
              }, // Sum of totalPrice
              totalQuantity: {
                $sum: "$draftCopy.draftCopies.copies.quantity",
              }, // Sum of quantities
            },
          },
          {
            // Format the result (optional)
            $project: {
              _id: 0,
              jobType: "$_id", // Rename _id to jobType
              totalPrice: 1,
            },
          },
        ]),
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array
            $unwind: {
              path: "$draftCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: {
              path: "$draftCopy.draftCopies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$draftCopy.draftCopies.jobType", // Group by jobType
              totalPrice: { $sum: "$draftCopy.draftCopies.totalCost" }, // Sum the totalCost
              isLaborTaxable: {
                $first: "$draftCopy.draftCopies.isLaborTaxable",
              },
            },
          },
          {
            $project: {
              _id: 0, // Remove the default _id field
              jobType: "$_id", // Rename _id to jobType
              totalPrice: 1, // Include the totalCostSum
              isLaborTaxable: 1,
            },
          },
        ]),
      ]);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Field Copies retrieved successfully",
      result: {
        officeFieldCopies: draftCopiesData[0]?.activeOfficeCopies || [],
        materialData: materialDataByJobType,
        laborData: laborDataByJobType,
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getDraftCopyByDate = async (req, res) => {
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

    const { projectId, date } = req.params;

    if (!projectId || !date) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id and Date are required",
        result: {},
      });
    }

    const project = await Project.findOne({
      _id: projectId,
    });

    if (!project) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project not found",
        result: {},
      });
    }

    let draftCopy = project.draftCopy.filter((draft) => {
      return draft.entryDate === date;
    });

    if (draftCopy.length === 0) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Draft Copy not found for the given date",
        result: [],
      });
    }

    draftCopy = draftCopy[0];

    console.log("draftCopy", draftCopy);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Draft Copy retrieved successfully",
      result: draftCopy,
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.editDraftCopy = async (req, res) => {
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

    const { projectId, date } = req.params;
    let { forms } = req.body;

    if (!projectId || !date) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id and Date are required",
        result: {},
      });
    }

    const project = await Project.findOne({
      _id: projectId,
    });

    if (!project) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project not found",
        result: {},
      });
    }

    if (!forms) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Draft Copy is required",
        result: {},
      });
    }

    try {
      console.log(forms);
      forms = JSON.parse(forms);

      if (!Array.isArray(forms)) {
        throw new Error("Invalid data format: 'forms' should be an array");
      }
    } catch (error) {
      return res.send({
        statusCode: 400,
        success: false,
        message: error.message || "Invalid JSON format for forms",
        result: {},
      });
    }

    let draftCopy = project.draftCopy.map((draft) => {
      if (draft.entryDate === date) {
        draft.draftCopies = forms;
        return draft;
      }
      return draft;
    });

    await project.save();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Draft Copy updated successfully",
      result: {},
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.deleteDraftCopy = async (req, res) => {
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

    const { projectId, date } = req.params;

    if (!projectId || !date) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id and Date are required",
        result: {},
      });
    }

    const project = await Project.findOne({
      _id: projectId,
    });

    if (!project) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project not found",
        result: {},
      });
    }

    project.draftCopy = project.draftCopy.filter((draft) => {
      return draft.entryDate !== date;
    });

    await project.save();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Draft Copy deleted successfully",
      result: {},
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

// function compileOfficeAndDraftCopies(data) {
//   const officeCopy = data.officeCopy;
//   const draftCopy = data.draftCopy;

//   draftCopy.draftCopies.forEach(draftJob => {
//       // Check if the draft job type already exists in officeCopy
//       const officeJob = officeCopy.fieldCopies.find(job => job.jobType === draftJob.jobType);

//       if (officeJob) {
//           // Update totalCost for matching job types
//           officeJob.totalCost += draftJob.totalCost;

//           // Merge copies from draft job into office job
//           draftJob.copies.forEach(copy => {
//               officeJob.copies.push(copy);
//           });
//       } else {
//           // If job type does not exist in officeCopy, add it as a new entry
//           officeCopy.fieldCopies.push({
//               jobType: draftJob.jobType,
//               totalCost: draftJob.totalCost,
//               isLaborTaxable: draftJob.isLaborTaxable,
//               copies: [...draftJob.copies],
//               _id: draftJob._id
//           });
//       }
//   });

//   return officeCopy;
// }

function compileOfficeAndDraftCopies(data) {
  const officeCopy = data.officeCopy;
  const draftCopy = data.draftCopy;

  draftCopy.draftCopies.forEach((draftJob) => {
    // Find if the draft job type exists in the officeCopy
    const officeJob = officeCopy.fieldCopies.find(
      (job) => job.jobType === draftJob.jobType
    );

    if (officeJob) {
      // Update totalCost, perHourCost, and totalManHours
      console.log("Office Job Type", officeJob.jobType, officeJob.totalCost);
      console.log("Costing Before", officeJob.totalCost, draftJob.totalCost);
      officeJob.totalCost =
        Number.parseFloat(officeJob.totalCost) +
        Number.parseFloat(draftJob.totalCost);

      console.log("Costing After", officeJob.totalCost, draftJob.totalCost);

      officeJob.perHourCost =
        (officeJob.perHourCost || 0) + (draftJob.perHourCost || 0);
      officeJob.totalManHours =
        (officeJob.totalManHours || 0) + (draftJob.totalManHours || 0);

      // Merge copies from draft job into office job
      draftJob.copies.forEach((copy) => {
        officeJob.copies.push(copy);
      });
    } else {
      // If job type does not exist in officeCopy, add it as a new entry
      officeCopy.fieldCopies.push({
        jobType: draftJob.jobType,
        totalCost: draftJob.totalCost,
        perHourCost: draftJob.perHourCost || 0,
        totalManHours: draftJob.totalManHours || 0,
        isLaborTaxable: draftJob.isLaborTaxable,
        copies: [...draftJob.copies],
        _id: draftJob._id,
      });
    }
  });

  return officeCopy;
}

exports.saveDraftCopyToOfficeCopy = async (req, res) => {
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

    const { projectId, date } = req.params;
    let { forms, totalManHours } = req.body;

    if (!forms) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "forms are required",
        result: {},
      });
    }

    forms = JSON.parse(forms);

    if (!projectId || !date) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id and Date are required",
        result: {},
      });
    }

    const project = await Project.findOne({
      _id: projectId,
    });

    if (!project) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project not found",
        result: {},
      });
    }

    const draftCopy = project.draftCopy.find((draft) => {
      return draft.entryDate === date;
    });

    if (!draftCopy) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Draft copy not found",
        result: {},
      });
    }

    const officeCopy = project.officeFieldCopy.find((office) => {
      return office.entryDate === date;
    });

    if (!officeCopy) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Please make a field copy first for that date",
        result: {},
      });
    }

    const data = {
      officeCopy,
      draftCopy: {
        entryDate: draftCopy.entryDate,
        draftCopies: forms,
      },
    };

    const resultedData = compileOfficeAndDraftCopies(data);

    project.officeFieldCopy = project.officeFieldCopy.map((office) => {
      if (office.entryDate === date) {
        resultedData.draftCopies = [...resultedData.draftCopies, ...forms];
        return resultedData;
      }
      return office;
    });

    project.draftCopy = project.draftCopy.filter(
      (draft) => draft.entryDate !== date
    );

    // console.log("Total Man Hours", totalManHours)

    project.totalManHours =
      Number.parseFloat(project.totalManHours) +
      Number.parseFloat(totalManHours);

    await project.save();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Draft Copy saved successfully",
      result: {},
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

// Field copy

exports.getTodayFieldCopyTiming = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      let entryDate = new Date(Date.now());
      // const day = entryDate.getDate();
      // const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = entryDate.getFullYear();

      const day = entryDate.getUTCDate();
      const month = entryDate.getUTCMonth() + 1; // Months are zero-based
      const year = entryDate.getUTCFullYear();

      entryDate = `${day}-${month}-${year}`;

      // Find the index of the field copy with the matching entryDate
      const fieldCopyIndex = project.officeFieldCopy.findIndex(
        (fieldCopy) => fieldCopy.entryDate === entryDate
      );

      const foremanCount = project.foreman && project.foreman !== null ? 1 : 0;
      if (fieldCopyIndex == -1) {
        return res.send({
          statusCode: 200,
          success: true,
          message: "Today's field copy timing found",
          result: {
            startTime: "12:00",
            endTime: "12:00",
            totalManHours: 0,
            totalLabors: project.crew.length + foremanCount,
            isProjectStarted: project.isProjectStarted,
          },
        });
      } else {
        const totalManHours = getTotalManHours(
          project.officeFieldCopy[fieldCopyIndex].startTime,
          project.officeFieldCopy[fieldCopyIndex].endTime,
          project.crew.length + foremanCount
        );

        return res.send({
          statusCode: 200,
          success: true,
          message: "Today's field copy timing found",
          result: {
            startTime: project.officeFieldCopy[fieldCopyIndex].startTime,
            endTime: project.officeFieldCopy[fieldCopyIndex].endTime,
            totalManHours,
            totalLabors: project.crew.length + foremanCount,
            isProjectStarted: project.isProjectStarted,
          },
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Staff",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

// exports.addFieldCopy = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await Staff.findOne({
//       _id: token._id,
//       status: "Active",
//     });

//     if (staff) {
//       const { projectId } = req.params;

//       if (!projectId) {
//         return res.send({
//           statusCode: 404,
//           success: false,
//           message: "Project Id is required",
//           result: {},
//         });
//       }

//       const project = await Project.findById(projectId);

//       if (!project) {
//         return res.send({
//           statusCode: 404,
//           success: false,
//           message: "Project not found",
//           result: {},
//         });
//       }

//       let { forms, startTime, endTime, jobType } = req.body;

//       if (!jobType) {
//         return res.send({
//           statusCode: 400,
//           success: false,
//           message: "Job Type is required",
//           result: {},
//         });
//       }

//       if (!startTime || startTime.trim() === "") {
//         return res.send({
//           statusCode: 400,
//           success: false,
//           message: "Start Time is required",
//           result: {},
//         });
//       }

//       if (!endTime || endTime.trim() === "") {
//         return res.send({
//           statusCode: 400,
//           success: false,
//           message: "End Time is required",
//           result: {},
//         });
//       }

//       const [startHour, startMinute] = startTime.split(":").map(Number);
//       const [endHour, endMinute] = endTime.split(":").map(Number);

//       // Create Date objects for both times on the same day
//       const today = new Date();
//       const start = new Date(
//         today.getFullYear(),
//         today.getMonth(),
//         today.getDate(),
//         startHour,
//         startMinute
//       );
//       const end = new Date(
//         today.getFullYear(),
//         today.getMonth(),
//         today.getDate(),
//         endHour,
//         endMinute
//       );

//       if (start > end) {
//         return res.send({
//           success: false,
//           message: "Start Time should be less than End Time",
//           result: {},
//         });
//       }

//       let entryDate = new Date(Date.now());
//       const day = entryDate.getDate();
//       const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
//       const year = entryDate.getFullYear();

//       entryDate = `${day}-${month}-${year}`;

//       if (!forms) {
//         return res.send({
//           statusCode: 400,
//           success: false,
//           message: "Field Copy is required",
//           result: {},
//         });
//       }
//       // console.log(forms);

//       try {
//         forms = JSON.parse(forms);

//         console.log(forms);

//         if (!Array.isArray(forms)) {
//           throw new Error("Invalid data format: 'forms' should be an array");
//         }
//       } catch (error) {
//         return res.send({
//           statusCode: 400,
//           success: false,
//           message: "Invalid JSON format for forms",
//           result: {},
//         });
//       }

//       console.log("Office Field Copy", project.officeFieldCopy);

//       // Find the index of the field copy with the matching entryDate
//       const fieldCopyIndex = project.officeFieldCopy.findIndex(
//         (fieldCopy) => fieldCopy.entryDate === entryDate
//       );

//       if (fieldCopyIndex != -1) {
//         // Field copy exists
//         const fieldCopy = project.officeFieldCopy[fieldCopyIndex];

//         fieldCopy.startTime = startTime;
//         fieldCopy.endTime = endTime;
//         // console.log(
//         //   "-------------------------",
//         //   forms,
//         //   project.officeFieldCopy[fieldCopyIndex].fieldCopies
//         // );

//         console.log("field copy", fieldCopy);

//         const jobTypeIndex = fieldCopy.fieldCopies.findIndex(
//           (copy) => copy.jobType === jobType
//         );

//         if (jobTypeIndex === -1) {
//           fieldCopy.fieldCopies = [
//             {
//               jobType: jobType,
//               copies: forms,
//             },
//             ...project.officeFieldCopy[fieldCopyIndex].fieldCopies,
//           ];
//         } else {
//           // const copyByJobType = fieldCopy.fieldCopies[jobTypeIndex];
//           fieldCopy.fieldCopies[jobTypeIndex].copies = [
//             ...fieldCopy.fieldCopies[jobTypeIndex].copies,
//             ...forms,
//           ];
//         }

//         project.officeFieldCopy[fieldCopyIndex] = fieldCopy;
//       } else {
//         // Field copy doesn't exist

//         project.officeFieldCopy.push({
//           entryDate,
//           startTime,
//           endTime,
//           laborCount: project.crew.length + 1,
//           fieldCopies: [
//             {
//               jobType: jobType,
//               copies: forms,
//             },
//           ],
//         });
//       }

//       let filteredForms = [];

//       for (let copy of project.officeFieldCopy) {
//         filteredForms = [...filteredForms, ...copy.fieldCopies];
//       }

//       console.log("------------------", filteredForms);

//       project.customerFieldCopy = filteredForms;

//       // const otherFieldCopies = [];
//       // const fgFieldCopies = [];

//       // for (let form of forms){
//       //   if(!["F&G","Other"].includes(form.source)){
//       //     return res.send({
//       //       statusCode: 400,
//       //       success: false,
//       //       message: "Invalid source for field copy",
//       //       result: {},
//       //     });
//       //   }else{
//       //     if(form.source === "F&G"){
//       //       fgFieldCopies.push(form);
//       //     }else{
//       //       otherFieldCopies.push(form);
//       //     }
//       //   }
//       //   if(!["Material", "Labor"].includes(form.type)){
//       //     return res.send({
//       //       statusCode: 400,
//       //       success: false,
//       //       message: "Invalid type for field copy",
//       //       result: {},
//       //     });
//       //   }
//       //   if(Number.parseFloat(form.price) + Number.parseFloat(form.quantity) === Number.parseFloat(form.totalPrice)){
//       //     return res.send({
//       //       statusCode: 400,
//       //       success: false,
//       //       message: "Price and Quantity should not equal Total Price",
//       //       result: {},
//       //     });
//       //   }
//       // }

//       // const updatedCopy = [...project.officeFieldCopy, ...forms];
//       // const updatedCopy2 = [...project.customerFieldCopy, ...forms]

//       // project.officeFieldCopy = updatedCopy;
//       // project.customerFieldCopy = updatedCopy;
//       // project.startTime = startTime;
//       // project.endTime = endTime;

//       await project.save();

//       return res.send({
//         statusCode: 201,
//         success: true,
//         message: "Field Copy created successfully",
//         result: {},
//       });
//     } else {
//       return res.send({
//         statusCode: 401,
//         success: false,
//         message: "Unauthorized User",
//         result: {},
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.send({
//       statusCode: 500,
//       success: false,
//       message: error.message || "Internal Server Error",
//       result: {},
//     });
//   }
// };

exports.addCustomerFieldCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      let { forms } = req.body;

      if (!forms) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Field Copy is required",
          result: {},
        });
      }

      let entryDate = new Date(Date.now());
      // const day = entryDate.getDate();
      // const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = entryDate.getFullYear();

      const day = entryDate.getUTCDate();
      const month = entryDate.getUTCMonth() + 1; // Months are zero-based
      const year = entryDate.getUTCFullYear();

      entryDate = `${day}-${month}-${year}`;

      try {
        forms = JSON.parse(forms);

        console.log(forms);

        if (!Array.isArray(forms)) {
          throw new Error("Invalid data format: 'forms' should be an array");
        }
      } catch (error) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid JSON format for forms",
          result: {},
        });
      }

      // Find the index of the field copy with the matching entryDate
      const fieldCopyIndex = project.customerFieldCopy.findIndex(
        (fieldCopy) => fieldCopy.entryDate === entryDate
      );

      let currentNumber = await CopyNumber.findOne({});

      const latestCopyId = await generateUniqueIdForCopy(project);
      project.lastCustomerCopyId = latestCopyId;

      if (fieldCopyIndex != -1) {
        // Field copy exists
        project.customerFieldCopy[fieldCopyIndex].customerCopies = [
          ...project.customerFieldCopy[fieldCopyIndex].customerCopies,
          forms,
        ];
        const len =
          project?.customerFieldCopy[fieldCopyIndex]?.customerCopies?.length;
        project.customerFieldCopy[fieldCopyIndex].copyNames = [
          ...project.customerFieldCopy[fieldCopyIndex].copyNames,
          {
            name: `Copy ${len}`,
            uniqueId: latestCopyId,
          },
        ];
        project.copyIndex = Number.parseInt(currentNumber.copyNumber) + 1;
      } else {
        // Field copy doesn't exist

        project.customerFieldCopy.push({
          entryDate: entryDate,
          copyNames: [
            {
              name: "Copy 1",
              uniqueId: latestCopyId,
            },
          ],
          customerCopies: [forms],
        });
        project.copyIndex = Number.parseInt(currentNumber.copyNumber) + 1;
      }

      currentNumber.copyNumber = Number.parseInt(currentNumber.copyNumber) + 1;

      await currentNumber.save();

      await project.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Customer Copy generated successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getCustomerCopyList = async (req, res) => {
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

    const { projectId } = req.params;

    if (!projectId) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project not found",
        result: {},
      });
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customer Copy List fetched successfully",
      result: project.customerFieldCopy,
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.editCustomerCopyName = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    console.log("Staff found", staff);

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }

    const { projectId, entryDate, index } = req.params;

    if (!projectId || !entryDate || !index) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project Id, Entry Date and Index are required",
        result: {},
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project not found",
        result: {},
      });
    }

    console.log("Project", project);

    const fieldCopy = project.customerFieldCopy.find(
      (fieldCopy) => fieldCopy.entryDate === entryDate
    );

    if (!fieldCopy) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Field Copy not found for the given entry date",
        result: {},
      });
    }

    if (index >= fieldCopy.customerCopies.length) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Index out of range",
        result: {},
      });
    }

    let { newName } = req.body;
    newName = newName?.trim();

    if (!newName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "New Name is required",
        result: {},
      });
    }

    fieldCopy.copyNames[index] = {
      name: newName,
      uniqueId: fieldCopy.copyNames[index].uniqueId,
    };
    await project.save();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Copy name updated successfully",
      result: {},
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getCustomerCopyByIndex = async (req, res) => {
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

    const { projectId, entryDate, index } = req.params;

    if (!projectId || !entryDate || !index) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project Id, Entry Date and Index are required",
        result: {},
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      // status: "Ongoing",
    });

    if (!project) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Project not found",
        result: {},
      });
    }

    const fieldCopy = project.customerFieldCopy.find(
      (fieldCopy) => fieldCopy.entryDate === entryDate
    );

    if (!fieldCopy) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Field Copy not found for the given entry date",
        result: {},
      });
    }

    if (index >= fieldCopy.customerCopies.length) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Index out of range",
        result: {},
      });
    }

    let customerCopies = [];
    fieldCopy.customerCopies[index].forEach((data) => {
      customerCopies = [...customerCopies, ...data.copies];
    });

    // const materialData = Object.values(
    //   customerCopies.reduce((acc, item) => {
    //     const jobType = item.type;

    //     if (!acc[jobType]) {
    //       acc[jobType] = {
    //         jobType: jobType,
    //         totalPrice: 0,
    //         totalQuantity: 0,
    //         isTaxable: item.isTaxable,
    //         source: item.source,
    //       };
    //     }

    //     // Accumulate the totals
    //     acc[jobType].totalPrice += item.totalPrice;
    //     acc[jobType].totalQuantity += item.quantity;

    //     return acc;
    //   }, {})
    // );

    const materialData = Object.values(
      customerCopies.reduce((acc, item) => {
        // Determine category based on source
        const category =
          item.source === "Labor" ? "Labor" : "F&G/Other/LumpSum";
        const key = `${category}_${item.type}_${item.isTaxable}`; // Unique key for category & jobType

        if (!acc[key]) {
          acc[key] = {
            category, // Store category
            jobType: item.type,
            totalPrice: 0,
            totalQuantity: 0,
            isTaxable: item.isTaxable,
            source: item.source,
            dataType: "Material",
          };
        }

        // Accumulate totals
        acc[key].totalPrice += item.totalPrice;
        acc[key].totalQuantity += item.quantity;

        return acc;
      }, {})
    );

    const laborData = Object.values(
      fieldCopy.customerCopies[index].reduce((acc, item) => {
        const jobType = item.jobType;

        if (!acc[jobType]) {
          acc[jobType] = {
            jobType: jobType,
            totalPrice: 0,
            isLaborTaxable: item.isLaborTaxable,
            dataType: "Labor",
          };
        }

        // Accumulate the totals
        acc[jobType].totalPrice += item.totalCost;

        return acc;
      }, {})
    );

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customer Copy fetched successfully",
      result: {
        customerCopiesData: customerCopies,
        materialData: materialData,
        laborData: laborData,
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err.message || "Internal Server Error",
      result: {},
    });
  }
};

// Office Field copy

exports.addFieldCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      let {
        forms,
        startTime,
        endTime,
        jobType,
        isLabor,
        totalLaborCost,
        totalManHours,
        entryDate,
      } = req.body;

      if (!jobType) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Job Type is required",
          result: {},
        });
      }

      if (!startTime || startTime.trim() === "") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Start Time is required",
          result: {},
        });
      }

      if (!endTime || endTime.trim() === "") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "End Time is required",
          result: {},
        });
      }

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      // Create Date objects for both times on the same day
      const today = new Date();
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        startHour,
        startMinute
      );
      const end = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        endHour,
        endMinute
      );

      if (start > end) {
        return res.send({
          success: false,
          message: "Start Time should be less than End Time",
          result: {},
        });
      }

      if (typeof isLabor === "undefined") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Labor status is required",
          result: {},
        });
      }

      isLabor = isLabor === "true" ? true : false;

      if (!totalLaborCost) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Total Labor Cost is required",
          result: {},
        });
      }

      totalLaborCost = Number.parseFloat(totalLaborCost);

      entryDate = new Date(entryDate);
      // const day = entryDate.getDate();
      // const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = entryDate.getFullYear();

      const day = entryDate.getUTCDate();
      const month = entryDate.getUTCMonth() + 1; // Months are zero-based
      const year = entryDate.getUTCFullYear();

      entryDate = `${day}-${month}-${year}`;

      if (!forms) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Field Copy is required",
          result: {},
        });
      }
      // console.log(forms);

      try {
        forms = JSON.parse(forms);

        console.log(forms);

        if (!Array.isArray(forms)) {
          throw new Error("Invalid data format: 'forms' should be an array");
        }
      } catch (error) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid JSON format for forms",
          result: {},
        });
      }

      console.log("Office Field Copy", project.officeFieldCopy);

      // Find the index of the field copy with the matching entryDate
      const fieldCopyIndex = project.officeFieldCopy.findIndex(
        (fieldCopy) => fieldCopy.entryDate === entryDate
      );

      const job = await JobType.findOne({
        jobName: jobType,
        status: "Active",
      });

      if (!job) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Job Type not found",
          result: {},
        });
      }

      if (fieldCopyIndex != -1) {
        // Field copy exists
        const fieldCopy = project.officeFieldCopy[fieldCopyIndex];

        fieldCopy.startTime = startTime;
        fieldCopy.endTime = endTime;

        const jobTypeIndex = fieldCopy.fieldCopies.findIndex(
          (copy) => copy.jobType === jobType
        );

        if (jobTypeIndex === -1) {
          fieldCopy.fieldCopies = [
            {
              jobType: jobType,
              totalCost: isLabor ? totalLaborCost : 0,
              isLaborTaxable: job.isTaxable,
              copies: forms,
            },
            ...project.officeFieldCopy[fieldCopyIndex].fieldCopies,
          ];
        } else {
          // const copyByJobType = fieldCopy.fieldCopies[jobTypeIndex];
          fieldCopy.fieldCopies[jobTypeIndex].copies = [
            ...fieldCopy.fieldCopies[jobTypeIndex].copies,
            ...forms,
          ];
          fieldCopy.fieldCopies[jobTypeIndex].totalCost = isLabor
            ? fieldCopy.fieldCopies[jobTypeIndex].totalCost + totalLaborCost
            : fieldCopy.fieldCopies[jobTypeIndex].totalCost;
          fieldCopy.fieldCopies[jobTypeIndex].isLaborTaxable = job.isTaxable;
        }

        project.officeFieldCopy[fieldCopyIndex] = fieldCopy;
      } else {
        // Field copy doesn't exist

        const foremanCount =
          project.foreman && project.foreman !== null ? 1 : 0;

        project.officeFieldCopy.push({
          entryDate,
          startTime,
          endTime,
          laborCount: project.crew.length + foremanCount,
          fieldCopies: [
            {
              jobType: jobType,
              totalCost: isLabor ? totalLaborCost : 0,
              isLaborTaxable: job.isTaxable,
              copies: forms,
            },
          ],
        });
      }

      // let filteredForms = [];

      // for (let copy of project.officeFieldCopy) {
      //   filteredForms = [...filteredForms, ...copy.fieldCopies];
      // }

      // project.customerFieldCopy = filteredForms;
      if (isLabor) {
        project.totalManHours =
          Number.parseFloat(project.totalManHours) +
          Number.parseFloat(totalManHours);
      }

      await project.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Field Copy created successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

// function sanitizeData(data) {
//   return data.map(item => {
//     if (item.toObject) {
//       // Convert Mongoose objects to plain objects
//       return item.toObject();
//     }
//     return { ...item }; // Ensure a plain object
//   });
// }

// function mergeFieldCopyData(backendData, frontendData) {
//   // Sanitize both backend and frontend data
//   const sanitizedBackendData = sanitizeData(backendData);
//   const sanitizedFrontendData = sanitizeData(frontendData);

//   // Merge data based on jobType
//   const mergedData = [...sanitizedBackendData];

//   sanitizedFrontendData.forEach(frontendItem => {
//     const index = mergedData.findIndex(item => item.jobType === frontendItem.jobType);

//     if (index !== -1) {
//       // Merge existing jobType with careful merging of fields
//       mergedData[index] = {
//         ...mergedData[index],
//         ...frontendItem,
//         copies: [
//           ...(mergedData[index].copies || []),
//           ...(frontendItem.copies || [])
//         ], // Merge arrays
//       };
//     } else {
//       // Add new jobType if not found in backend
//       mergedData.push(frontendItem);
//     }
//   });

//   return mergedData;
// }

function sanitizeData(data) {
  return data.map((item) => {
    if (item.toObject) {
      // Convert Mongoose objects to plain objects
      return item.toObject();
    }
    return { ...item }; // Ensure a plain object
  });
}

function mergeFieldCopyData(backendData, frontendData) {
  // Sanitize both backend and frontend data
  const sanitizedBackendData = sanitizeData(backendData);
  const sanitizedFrontendData = sanitizeData(frontendData);

  // Merge data based on jobType
  const mergedData = [...sanitizedBackendData];

  sanitizedFrontendData.forEach((frontendItem) => {
    const index = mergedData.findIndex(
      (item) => item.jobType === frontendItem.jobType
    );

    if (index !== -1) {
      // Merge existing jobType with careful merging of fields
      mergedData[index] = {
        ...mergedData[index],
        ...frontendItem,
        manHours:
          (mergedData[index].manHours || 0) + (frontendItem.manHours || 0),
        totalCost:
          (mergedData[index].totalCost || 0) + (frontendItem.totalCost || 0), // Add totalCost
        copies: [
          ...(mergedData[index].copies || []),
          ...(frontendItem.copies || []),
        ], // Merge arrays
      };
    } else {
      // Add new jobType if not found in backend
      mergedData.push(frontendItem);
    }
  });

  return mergedData;
}

exports.addFieldCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      let {
        forms,
        startTime,
        endTime,
        jobType,
        isLabor,
        totalLaborCost,
        totalManHours,
        entryDate,
      } = req.body;

      let currentManHours = totalManHours;

      if (typeof isLabor === "undefined") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Labor status is required",
          result: {},
        });
      }

      isLabor = isLabor === "true" ? true : false;

      if (!jobType && isLabor) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Job Type is required",
          result: {},
        });
      }

      if (!startTime || startTime.trim() === "") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Start Time is required",
          result: {},
        });
      }

      if (!endTime || endTime.trim() === "") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "End Time is required",
          result: {},
        });
      }

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      // Create Date objects for both times on the same day
      const today = new Date();
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        startHour,
        startMinute
      );
      const end = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        endHour,
        endMinute
      );

      if (start > end) {
        return res.send({
          success: false,
          message: "Start Time should be less than End Time",
          result: {},
        });
      }

      if (!totalLaborCost) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Total Labor Cost is required",
          result: {},
        });
      }

      totalLaborCost = Number.parseFloat(totalLaborCost);

      entryDate = new Date(entryDate);
      // const day = entryDate.getDate();
      // const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = entryDate.getFullYear();

      const day = entryDate.getUTCDate();
      const month = entryDate.getUTCMonth() + 1; // Months are zero-based
      const year = entryDate.getUTCFullYear();

      entryDate = `${day}-${month}-${year}`;

      if (!forms) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Field Copy is required",
          result: {},
        });
      }
      // console.log(forms);

      try {
        forms = JSON.parse(forms);

        if (!Array.isArray(forms)) {
          throw new Error("Invalid data format: 'forms' should be an array");
        }
      } catch (error) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid JSON format for forms",
          result: {},
        });
      }

      let currentForms = forms;

      // Find the index of the field copy with the matching entryDate
      const fieldCopyIndex = project.officeFieldCopy.findIndex(
        (fieldCopy) => fieldCopy.entryDate === entryDate
      );

      const job = await JobType.findOne({
        jobName: jobType,
        status: "Active",
      });

      if (!job && isLabor) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Job Type not found",
          result: {},
        });
      }

      if (fieldCopyIndex != -1) {
        // Field copy exists
        const fieldCopy = project.officeFieldCopy[fieldCopyIndex];

        let resultedFieldCopy = mergeFieldCopyData(
          project.officeFieldCopy[fieldCopyIndex].fieldCopies,
          forms
        );

        fieldCopy.startTime = startTime;
        fieldCopy.endTime = endTime;
        if (isLabor) {
          fieldCopy.totalHours =
            Number.parseFloat(fieldCopy.totalHours) +
            Number.parseFloat(totalManHours);
        }

        // const jobTypeIndex = fieldCopy.fieldCopies.findIndex(
        //   (copy) => copy.jobType === jobType
        // );

        // if (jobTypeIndex === -1) {
        //   fieldCopy.fieldCopies = [
        //     {
        //       jobType: jobType,
        //       totalCost: isLabor ? totalLaborCost : 0,
        //       isLaborTaxable: job.isTaxable,
        //       copies: forms,
        //     },
        //     ...project.officeFieldCopy[fieldCopyIndex].fieldCopies,
        //   ];
        // } else {
        //   // const copyByJobType = fieldCopy.fieldCopies[jobTypeIndex];
        //   fieldCopy.fieldCopies[jobTypeIndex].copies = [
        //     ...fieldCopy.fieldCopies[jobTypeIndex].copies,
        //     ...forms,
        //   ];
        //   fieldCopy.fieldCopies[jobTypeIndex].totalCost = isLabor
        //     ? fieldCopy.fieldCopies[jobTypeIndex].totalCost + totalLaborCost
        //     : fieldCopy.fieldCopies[jobTypeIndex].totalCost;
        //   fieldCopy.fieldCopies[jobTypeIndex].isLaborTaxable = job.isTaxable;
        // }

        if (isLabor) {
          const isExist = resultedFieldCopy.some((copy) => {
            return copy.jobType === jobType;
          });

          if (isExist) {
            resultedFieldCopy = resultedFieldCopy.map((copy) => {
              if (copy.jobType === jobType) {
                copy.totalCost += totalLaborCost;
                copy.manHours =
                  Number.parseFloat(copy.manHours) +
                  Number.parseFloat(totalManHours);
                return copy;
              }
              return copy;
            });
          } else {
            resultedFieldCopy.push({
              jobType,
              totalCost: totalLaborCost,
              isLaborTaxable: job.isTaxable,
              jobTypeCost: job.price,
              startTime: startTime,
              endTime: endTime,
              manHours: Number.parseFloat(totalManHours),
              copies: [],
            });
          }

          const isExistInForms = currentForms.some((copy) => {
            return copy.jobType === jobType;
          });

          if (isExistInForms) {
            currentForms = currentForms.map((copy) => {
              if (copy.jobType === jobType) {
                copy.totalCost += totalLaborCost;
                copy.manHours =
                  Number.parseFloat(copy.manHours) +
                  Number.parseFloat(currentManHours);
                return copy;
              }
              return copy;
            });
          } else {
            currentForms.push({
              jobType,
              totalCost: totalLaborCost,
              isLaborTaxable: job.isTaxable,
              jobTypeCost: job.price,
              startTime: startTime,
              endTime: endTime,
              manHours: Number.parseFloat(currentManHours),
              copies: [],
            });
          }
        }

        project.officeFieldCopy[fieldCopyIndex].fieldCopies = resultedFieldCopy;
        const foremanCount =
          project.foreman && project.foreman !== null ? 1 : 0;
        const newFieldCopy = new FieldCopyHistory({
          projectId: project._id,
          entryDate,
          startTime,
          endTime,
          totalHours: Number.parseFloat(currentManHours),
          laborCount: project.crew.length + foremanCount,
          fieldCopies: forms,
        });
        await newFieldCopy.save();
      } else {
        // Field copy doesn't exist

        let resultedFieldCopy = mergeFieldCopyData([], forms);

        if (isLabor) {
          const isExist = resultedFieldCopy.some((copy) => {
            return copy.jobType === jobType;
          });

          if (isExist) {
            resultedFieldCopy = resultedFieldCopy.map((copy) => {
              if (copy.jobType === jobType) {
                copy.totalCost += totalLaborCost;
                copy.manHours =
                  Number.parseFloat(copy.manHours) +
                  Number.parseFloat(totalManHours);
                return copy;
              }
              return copy;
            });
          } else {
            resultedFieldCopy.push({
              jobType,
              totalCost: totalLaborCost,
              isLaborTaxable: job.isTaxable,
              jobTypeCost: job.price,
              manHours: Number.parseFloat(totalManHours),
              startTime: startTime,
              endTime: endTime,
              copies: [],
            });
          }

          const isExistInForms = currentForms.some((copy) => {
            return copy.jobType === jobType;
          });

          if (isExistInForms) {
            currentForms = currentForms.map((copy) => {
              if (copy.jobType === jobType) {
                copy.totalCost += totalLaborCost;
                copy.manHours =
                  Number.parseFloat(copy.manHours) +
                  Number.parseFloat(currentManHours);
                return copy;
              }
              return copy;
            });
          } else {
            currentForms.push({
              jobType,
              totalCost: totalLaborCost,
              isLaborTaxable: job.isTaxable,
              jobTypeCost: job.price,
              startTime: startTime,
              endTime: endTime,
              manHours: Number.parseFloat(currentManHours),
              copies: [],
            });
          }
        }

        const foremanCount =
          project.foreman && project.foreman !== null ? 1 : 0;

        project.officeFieldCopy.push({
          entryDate,
          startTime,
          endTime,
          totalHours: Number.parseFloat(totalManHours),
          laborCount: project.crew.length + foremanCount,
          fieldCopies: resultedFieldCopy,
        });
        const newFieldCopy = new FieldCopyHistory({
          projectId: project._id,
          entryDate,
          startTime,
          endTime,
          totalHours: Number.parseFloat(currentManHours),
          laborCount: project.crew.length + foremanCount,
          fieldCopies: forms,
        });
        await newFieldCopy.save();
      }

      if (!project.officeCopyId) {
        let currentNumber = await CopyNumber.findOne({});
        project.officeCopyId = await generateUniqueIdForCopy(project);
        project.copyIndex = Number.parseInt(currentNumber.copyNumber) + 1;
        currentNumber.copyNumber =
          Number.parseInt(currentNumber.copyNumber) + 1;
        await currentNumber.save();
      }

      // let filteredForms = [];

      // for (let copy of project.officeFieldCopy) {
      //   filteredForms = [...filteredForms, ...copy.fieldCopies];
      // }

      // project.customerFieldCopy = filteredForms;
      if (isLabor) {
        project.totalManHours =
          Number.parseFloat(project.totalManHours) +
          Number.parseFloat(totalManHours);
      }

      await project.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Field Copy created successfully",
        result: project.officeFieldCopy,
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.addFieldCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      let {
        forms,
        startTime,
        endTime,
        jobType,
        isLabor,
        laborCount,
        totalLaborCost,
        totalManHours,
        entryDate,
        note,
        crew,
      } = req.body;

      let currentManHours = totalManHours;

      note = note?.trim();

      if (typeof isLabor === "undefined") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Labor status is required",
          result: {},
        });
      }

      isLabor = isLabor === "true" ? true : false;

      if (crew) {
        crew = JSON.parse(crew);
      }

      if (isLabor) {
        if (!laborCount) {
          return res.send({
            statusCode: 400,
            success: false,
            message: "Labor Count is required",
            result: {},
          });
        }
        laborCount = Number.parseInt(laborCount);
        if (laborCount === 0) {
          return res.send({
            statusCode: 400,
            success: false,
            message: "Please select labors",
            result: {},
          });
        }

        if (!jobType) {
          return res.send({
            statusCode: 400,
            success: false,
            message: "Job Type is required",
            result: {},
          });
        }
      }

      if (!startTime || startTime.trim() === "") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Start Time is required",
          result: {},
        });
      }

      if (!endTime || endTime.trim() === "") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "End Time is required",
          result: {},
        });
      }

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      // Create Date objects for both times on the same day
      const today = new Date();
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        startHour,
        startMinute
      );
      const end = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        endHour,
        endMinute
      );

      if (start > end) {
        return res.send({
          success: false,
          message: "Start Time should be less than End Time",
          result: {},
        });
      }

      if (!totalLaborCost) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Total Labor Cost is required",
          result: {},
        });
      }

      totalLaborCost = Number.parseFloat(totalLaborCost);

      entryDate = new Date(entryDate);
      // const day = entryDate.getDate();
      // const month = entryDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = entryDate.getFullYear();

      const day = entryDate.getUTCDate();
      const month = entryDate.getUTCMonth() + 1; // Months are zero-based
      const year = entryDate.getUTCFullYear();

      entryDate = `${day}-${month}-${year}`;

      if (!forms) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Field Copy is required",
          result: {},
        });
      }
      // console.log(forms);

      try {
        forms = JSON.parse(forms);

        if (!Array.isArray(forms)) {
          throw new Error("Invalid data format: 'forms' should be an array");
        }
      } catch (error) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid JSON format for forms",
          result: {},
        });
      }

      let currentForms = forms;

      // Find the index of the field copy with the matching entryDate
      const fieldCopyIndex = project.officeFieldCopy.findIndex(
        (fieldCopy) => fieldCopy.entryDate === entryDate
      );

      const job = await JobType.findOne({
        jobName: jobType,
        status: "Active",
      });

      if (!job && isLabor) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Job Type not found",
          result: {},
        });
      }

      if (fieldCopyIndex != -1) {
        // Field copy exists
        const fieldCopy = project.officeFieldCopy[fieldCopyIndex];

        let resultedFieldCopy = mergeFieldCopyData(
          project.officeFieldCopy[fieldCopyIndex].fieldCopies,
          forms
        );

        fieldCopy.startTime = startTime;
        fieldCopy.endTime = endTime;
        if (isLabor) {
          fieldCopy.totalHours =
            Number.parseFloat(fieldCopy.totalHours) +
            Number.parseFloat(totalManHours);
        }

        // const jobTypeIndex = fieldCopy.fieldCopies.findIndex(
        //   (copy) => copy.jobType === jobType
        // );

        // if (jobTypeIndex === -1) {
        //   fieldCopy.fieldCopies = [
        //     {
        //       jobType: jobType,
        //       totalCost: isLabor ? totalLaborCost : 0,
        //       isLaborTaxable: job.isTaxable,
        //       copies: forms,
        //     },
        //     ...project.officeFieldCopy[fieldCopyIndex].fieldCopies,
        //   ];
        // } else {
        //   // const copyByJobType = fieldCopy.fieldCopies[jobTypeIndex];
        //   fieldCopy.fieldCopies[jobTypeIndex].copies = [
        //     ...fieldCopy.fieldCopies[jobTypeIndex].copies,
        //     ...forms,
        //   ];
        //   fieldCopy.fieldCopies[jobTypeIndex].totalCost = isLabor
        //     ? fieldCopy.fieldCopies[jobTypeIndex].totalCost + totalLaborCost
        //     : fieldCopy.fieldCopies[jobTypeIndex].totalCost;
        //   fieldCopy.fieldCopies[jobTypeIndex].isLaborTaxable = job.isTaxable;
        // }

        if (isLabor) {
          const isExist = resultedFieldCopy.some((copy) => {
            return copy.jobType === jobType;
          });

          if (isExist) {
            resultedFieldCopy = resultedFieldCopy.map((copy) => {
              if (copy.jobType === jobType) {
                copy.totalCost += totalLaborCost;
                copy.manHours =
                  Number.parseFloat(copy.manHours) +
                  Number.parseFloat(totalManHours);
                return copy;
              }
              return copy;
            });
          } else {
            resultedFieldCopy.push({
              jobType,
              totalCost: totalLaborCost,
              isLaborTaxable: job.isTaxable,
              jobTypeCost: job.price,
              startTime: startTime,
              endTime: endTime,
              manHours: Number.parseFloat(totalManHours),
              copies: [],
            });
          }

          const isExistInForms = currentForms.some((copy) => {
            return copy.jobType === jobType;
          });

          if (isExistInForms) {
            currentForms = currentForms.map((copy) => {
              if (copy.jobType === jobType) {
                copy.totalCost += totalLaborCost;
                copy.manHours =
                  Number.parseFloat(copy.manHours) +
                  Number.parseFloat(currentManHours);
                return copy;
              }
              return copy;
            });
          } else {
            currentForms.push({
              jobType,
              totalCost: totalLaborCost,
              isLaborTaxable: job.isTaxable,
              jobTypeCost: job.price,
              startTime: startTime,
              endTime: endTime,
              manHours: Number.parseFloat(currentManHours),
              copies: [],
            });
          }
        }

        project.officeFieldCopy[fieldCopyIndex].fieldCopies = resultedFieldCopy;
        const foremanCount =
          project.foreman && project.foreman !== null ? 1 : 0;
        const newFieldCopy = new FieldCopyHistory({
          projectId: project._id,
          entryDate,
          startTime,
          endTime,
          crew,
          note,
          totalHours: Number.parseFloat(currentManHours),
          laborCount: laborCount,
          fieldCopies: forms,
        });
        await newFieldCopy.save();
      } else {
        // Field copy doesn't exist

        let resultedFieldCopy = mergeFieldCopyData([], forms);

        if (isLabor) {
          const isExist = resultedFieldCopy.some((copy) => {
            return copy.jobType === jobType;
          });

          if (isExist) {
            resultedFieldCopy = resultedFieldCopy.map((copy) => {
              if (copy.jobType === jobType) {
                copy.totalCost += totalLaborCost;
                copy.manHours =
                  Number.parseFloat(copy.manHours) +
                  Number.parseFloat(totalManHours);
                return copy;
              }
              return copy;
            });
          } else {
            resultedFieldCopy.push({
              jobType,
              totalCost: totalLaborCost,
              isLaborTaxable: job.isTaxable,
              jobTypeCost: job.price,
              manHours: Number.parseFloat(totalManHours),
              startTime: startTime,
              endTime: endTime,
              copies: [],
            });
          }

          const isExistInForms = currentForms.some((copy) => {
            return copy.jobType === jobType;
          });

          if (isExistInForms) {
            currentForms = currentForms.map((copy) => {
              if (copy.jobType === jobType) {
                copy.totalCost += totalLaborCost;
                copy.manHours =
                  Number.parseFloat(copy.manHours) +
                  Number.parseFloat(currentManHours);
                return copy;
              }
              return copy;
            });
          } else {
            currentForms.push({
              jobType,
              totalCost: totalLaborCost,
              isLaborTaxable: job.isTaxable,
              jobTypeCost: job.price,
              startTime: startTime,
              endTime: endTime,
              manHours: Number.parseFloat(currentManHours),
              copies: [],
            });
          }
        }

        const foremanCount =
          project.foreman && project.foreman !== null ? 1 : 0;

        project.officeFieldCopy.push({
          entryDate,
          startTime,
          endTime,
          totalHours: Number.parseFloat(totalManHours),
          laborCount: laborCount,
          fieldCopies: resultedFieldCopy,
        });
        const newFieldCopy = new FieldCopyHistory({
          projectId: project._id,
          entryDate,
          startTime,
          endTime,
          crew,
          note,
          totalHours: Number.parseFloat(currentManHours),
          laborCount: laborCount,
          fieldCopies: forms,
        });
        await newFieldCopy.save();
      }

      if (!project.officeCopyId) {
        let currentNumber = await CopyNumber.findOne({});
        project.officeCopyId = await generateUniqueIdForCopy(project);
        project.copyIndex = Number.parseInt(currentNumber.copyNumber) + 1;
        currentNumber.copyNumber =
          Number.parseInt(currentNumber.copyNumber) + 1;
        await currentNumber.save();
      }

      // let filteredForms = [];

      // for (let copy of project.officeFieldCopy) {
      //   filteredForms = [...filteredForms, ...copy.fieldCopies];
      // }

      // project.customerFieldCopy = filteredForms;
      if (isLabor) {
        project.totalManHours =
          Number.parseFloat(project.totalManHours) +
          Number.parseFloat(totalManHours);
      }

      await project.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Field Copy created successfully",
        result: project.officeFieldCopy,
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.updateFieldCopyDate = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      let { entryDate, newDate } = req.body;

      newDate = new Date(newDate);
      // const day = newDate.getDate();
      // const month = newDate.getMonth() + 1; // Months are zero-based, so add 1
      // const year = newDate.getFullYear();

      const day = newDate.getUTCDate();
      const month = newDate.getUTCMonth() + 1; // Months are zero-based
      const year = newDate.getUTCFullYear();

      newDate = `${day}-${month}-${year}`;

      // Find the index of the field copy with the matching entryDate
      const fieldCopyIndex = project.officeFieldCopy.findIndex(
        (fieldCopy) => fieldCopy.entryDate === entryDate
      );

      if (fieldCopyIndex !== -1) {
        project.officeFieldCopy[fieldCopyIndex].entryDate = newDate;
        console.log("Project", project.officeFieldCopy[fieldCopyIndex]);
      } else {
        return res.send({
          statusCode: 404,
          success: true,
          message: "Field copy not found",
          result: {},
        });
      }

      await FieldCopyHistory.updateMany(
        { entryDate, projectId },
        {
          entryDate: newDate,
        }
      );

      await project.save();

      return res.send({
        statusCode: 200,
        success: true,
        message: "Field Copy updated successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.handleFieldCopyStatus = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId, fieldId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Status is required",
          result: {},
        });
      }

      if (!["Active", "Delete"].includes(status)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid status",
          result: {},
        });
      }

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      if (!fieldId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Field Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      // if (project.staffId.toString() !== req.token._id) {
      //   return res.send({
      //     statusCode: 403,
      //     success: false,
      //     message: "Forbidden Access",
      //     result: {},
      //   });
      // }

      const updatedCopy = project.officeFieldCopy.map((field) => {
        if (field._id.toString() === fieldId) {
          field.status = status;
        }
        return field;
      });

      project.officeFieldCopy = updatedCopy;
      project.customerFieldCopy = updatedCopy;

      await project.save();

      return res.send({
        statusCode: 200,
        success: true,
        message: "Field Copy updated successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.updateFieldCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId, fieldId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      // if (project.staffId.toString() !== req.token._id) {
      //   return res.send({
      //     statusCode: 403,
      //     success: false,
      //     message: "Forbidden Access",
      //     result: {},
      //   });
      // }

      const {
        source,
        description,
        measure,
        startDate,
        endDate,
        quantity,
        price,
        totalPrice,
      } = req.body;

      if (
        [source, description, measure, quantity].some(
          (field) => !field || field.trim() === ""
        )
      ) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "All fields are required",
          result: {},
        });
      }

      if (!startDate || !endDate) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Start Date and End Date are required",
          result: {},
        });
      }

      if (!price || !totalPrice) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Price and Total Price are required",
          result: {},
        });
      }

      price = Number.parseInt(price);
      totalPrice = Number.parseInt(totalPrice);

      const requestCopy = {
        source,
        description,
        measure,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        quantity,
        price,
        totalPrice,
      };

      for (let i = 0; i < project.officeFieldCopy.length; i++) {
        if (project.officeFieldCopy[i]._id.toString() === fieldId.toString()) {
          project.officeFieldCopy[i] = requestCopy;
          break;
        }
      }

      // let {updatedCopy} = req.body;

      // if(!updatedCopy){
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Updated Copy is required",
      //     result: {},
      //   });
      // }

      // updatedCopy = JSON.parse(updatedCopy);

      // project.officeFieldCopy = updatedCopy;
      project.customerFieldCopy = project.officeFieldCopy;

      await project.save();

      return res.send({
        statusCode: 200,
        success: true,
        message: "Field Copy created successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getFieldCopyById = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId, fieldId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      // if (project.staffId.toString() !== project.staffId) {
      //   return res.send({
      //     statusCode: 403,
      //     success: false,
      //     message: "Forbidden Access",
      //     result: {},
      //   });
      // }

      const fieldCopy = project.officeFieldCopy.filter((copy) => {
        return copy._id.toString() === fieldId.toString();
      });

      return res.send({
        statusCode: 200,
        success: true,
        message: "Field Copy fetched successfully",
        result: fieldCopy,
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getofficeFieldCopyWithoutPagination = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      // if (project.staffId.toString() !== req.token._id) {
      //   return res.send({
      //     statusCode: 403,
      //     success: false,
      //     message: "Forbidden Access",
      //     result: {},
      //   });
      // }

      // Filter field copies to include only those with status "Active"
      const activeFieldCopies = project.officeFieldCopy.filter(
        (fieldCopy) => fieldCopy.status === "Active"
      );

      return res.send({
        statusCode: 200,
        success: true,
        message: "Field Copies retrieved successfully",
        result: activeFieldCopies,
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

// exports.getofficeFieldCopy = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await Staff.findOne({
//       _id: token._id,
//       status: "Active",
//     });

//     if (!staff) {
//       return res.send({
//         statusCode: 401,
//         success: false,
//         message: "Unauthorized User",
//         result: {},
//       });
//     }

//     const { projectId } = req.params;

//     if (!projectId) {
//       return res.send({
//         statusCode: 400,
//         success: false,
//         message: "Project Id is required",
//         result: {},
//       });
//     }

//     const [officeCopiesData, materialDataByJobType, laborDataByJobType] =
//       await Promise.all([
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array to process each entry individually
//             $unwind: "$officeFieldCopy",
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: "$officeFieldCopy.fieldCopies",
//           },
//           {
//             // Unwind the copies array inside fieldCopies
//             $unwind: "$officeFieldCopy.fieldCopies.copies",
//           },
//           {
//             // Filter only active copies
//             $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" },
//           },
//           {
//             // Group the results back into a single array of active copies
//             $group: {
//               _id: "$_id",
//               activeOfficeCopies: {
//                 $push: "$officeFieldCopy.fieldCopies.copies",
//               },
//             },
//           },
//         ]),
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array
//             $unwind: {
//               path: "$officeFieldCopy",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: {
//               path: "$officeFieldCopy.fieldCopies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Unwind the copies array inside fieldCopies
//             $unwind: {
//               path: "$officeFieldCopy.fieldCopies.copies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Match only active copies
//             $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" },
//           },
//           {
//             // Group by jobType and sum the totalPrice
//             $group: {
//               // _id: "$officeFieldCopy.fieldCopies.jobType", // Group by jobType
//               _id: {
//                 category: {
//                   $cond: {
//                     if: {
//                       $eq: [
//                         "$officeFieldCopy.fieldCopies.copies.source",
//                         "Labor",
//                       ],
//                     },
//                     then: "Labor",
//                     else: "F&G/Other/LumpSum",
//                   },
//                 },
//                 jobType: "$officeFieldCopy.fieldCopies.jobType", // Group by jobType
//                 isTaxable: "$officeFieldCopy.fieldCopies.copies.isTaxable",
//               },
//               totalPrice: {
//                 $sum: "$officeFieldCopy.fieldCopies.copies.totalPrice",
//               }, // Sum of totalPrice
//               totalQuantity: {
//                 $sum: "$officeFieldCopy.fieldCopies.copies.quantity",
//               }, // Sum of quantities
//               isTaxable: {
//                 $first: "$officeFieldCopy.fieldCopies.copies.isTaxable",
//               },
//               source: {
//                 $first: "$officeFieldCopy.fieldCopies.copies.source",
//               },
//             },
//           },
//           {
//             // Format the result (optional)
//             $project: {
//               _id: 0,
//               jobType: "$_id.jobType", // Rename _id to jobType
//               totalPrice: 1,
//               isTaxable: 1,
//               source: 1,
//               dataType: "Material",
//             },
//           },
//         ]),
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array
//             $unwind: {
//               path: "$officeFieldCopy",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: {
//               path: "$officeFieldCopy.fieldCopies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $group: {
//               _id: "$officeFieldCopy.fieldCopies.jobType", // Group by jobType
//               totalPrice: { $sum: "$officeFieldCopy.fieldCopies.totalCost" }, // Sum the totalCost
//               isLaborTaxable: {
//                 $first: "$officeFieldCopy.fieldCopies.isLaborTaxable",
//               },
//             },
//           },
//           {
//             $project: {
//               _id: 0, // Remove the default _id field
//               jobType: "$_id", // Rename _id to jobType
//               totalPrice: 1, // Include the totalCostSum
//               isLaborTaxable: 1,
//               dataType: "Labor",
//             },
//           },
//         ]),
//       ]);

//     const [draftCopiesData, materialDraftData, laborDraftData] =
//       await Promise.all([
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array to process each entry individually
//             $unwind: "$draftCopy",
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: "$draftCopy.draftCopies",
//           },
//           {
//             // Unwind the copies array inside fieldCopies
//             $unwind: "$draftCopy.draftCopies.copies",
//           },
//           {
//             // Filter only active copies
//             $match: { "draftCopy.draftCopies.copies.status": "Active" },
//           },
//           {
//             // Group the results back into a single array of active copies
//             $group: {
//               _id: "$_id",
//               activeOfficeCopies: {
//                 $push: "$draftCopy.draftCopies.copies",
//               },
//             },
//           },
//         ]),
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array
//             $unwind: {
//               path: "$draftCopy",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: {
//               path: "$draftCopy.draftCopies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Unwind the copies array inside fieldCopies
//             $unwind: {
//               path: "$draftCopy.draftCopies.copies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Match only active copies
//             $match: { "draftCopy.draftCopies.copies.status": "Active" },
//           },
//           {
//             // Group by jobType and sum the totalPrice
//             $group: {
//               // _id: "$draftCopy.draftCopies.jobType", // Group by jobType
//               _id: {
//                 category: {
//                   $cond: {
//                     if: {
//                       $eq: ["$draftCopy.draftCopies.copies.source", "Labor"],
//                     },
//                     then: "Labor",
//                     else: "F&G/Other/LumpSum",
//                   },
//                 },
//                 jobType: "$draftCopy.draftCopies.jobType", // Group by jobType
//                 isTaxable: "$draftCopy.draftCopies.copies.isTaxable",
//               },
//               totalPrice: {
//                 $sum: "$draftCopy.draftCopies.copies.totalPrice",
//               }, // Sum of totalPrice
//               totalQuantity: {
//                 $sum: "$draftCopy.draftCopies.copies.quantity",
//               }, // Sum of quantities
//               isTaxable: {
//                 $first: "$draftCopy.draftCopies.copies.isTaxable",
//               },
//               source: {
//                 $first: "$draftCopy.draftCopies.copies.source",
//               },
//             },
//           },
//           {
//             // Format the result (optional)
//             $project: {
//               _id: 0,
//               jobType: "$_id", // Rename _id to jobType
//               totalPrice: 1,
//               isTaxable: 1,
//               source: 1,
//               dataType: "Material",
//             },
//           },
//         ]),
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array
//             $unwind: {
//               path: "$draftCopy",
//               // preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: {
//               path: "$draftCopy.draftCopies",
//               // preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $group: {
//               _id: "$draftCopy.draftCopies.jobType", // Group by jobType
//               totalPrice: { $sum: "$draftCopy.draftCopies.totalCost" }, // Sum the totalCost
//               isLaborTaxable: {
//                 $first: "$draftCopy.draftCopies.isLaborTaxable",
//               },
//             },
//           },
//           {
//             $project: {
//               _id: 0, // Remove the default _id field
//               jobType: "$_id", // Rename _id to jobType
//               totalPrice: 1, // Include the totalCostSum
//               isLaborTaxable: 1,
//               dataType: "Labor",
//             },
//           },
//         ]),
//       ]);

//     return res.send({
//       statusCode: 200,
//       success: true,
//       message: "Field Copies retrieved successfully",
//       result: {
//         officeFieldCopies: officeCopiesData[0]?.activeOfficeCopies || [],
//         materialData: materialDataByJobType,
//         laborData: laborDataByJobType,
//         officeDraftCopies: draftCopiesData[0]?.activeOfficeCopies || [],
//         materialDraftData: materialDraftData,
//         laborDraftData: laborDraftData,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     return res.send({
//       statusCode: 500,
//       success: false,
//       message: err?.message || "Internal Server Error",
//       result: {},
//     });
//   }
// };


exports.getofficeFieldCopy = async (req, res) => {
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

    const { projectId } = req.params;

    if (!projectId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }

    const [officeCopiesData, materialDataByJobType, laborDataByJobType] =
      await Promise.all([
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: "$officeFieldCopy" },
          { $unwind: "$officeFieldCopy.fieldCopies" },
          { $unwind: "$officeFieldCopy.fieldCopies.copies" },
          { $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" } },
          {
            $group: {
              _id: "$_id",
              activeOfficeCopies: { $push: "$officeFieldCopy.fieldCopies.copies" },
            },
          },
        ]),
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: { path: "$officeFieldCopy", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$officeFieldCopy.fieldCopies", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$officeFieldCopy.fieldCopies.copies", preserveNullAndEmptyArrays: true } },
          { $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" } },
          {
            $group: {
              _id: {
                category: {
                  $cond: {
                    if: { $eq: ["$officeFieldCopy.fieldCopies.copies.source", "Labor"] },
                    then: "Labor",
                    else: "F&G/Other/LumpSum",
                  },
                },
                jobType: "$officeFieldCopy.fieldCopies.jobType",
                isTaxable: "$officeFieldCopy.fieldCopies.copies.isTaxable",
              },
              totalPrice: { $sum: "$officeFieldCopy.fieldCopies.copies.totalPrice" },
              totalQuantity: { $sum: "$officeFieldCopy.fieldCopies.copies.quantity" },
              isTaxable: { $first: "$officeFieldCopy.fieldCopies.copies.isTaxable" },
              source: { $first: "$officeFieldCopy.fieldCopies.copies.source" },
            },
          },
          {
            $project: {
              _id: 0,
              jobType: "$_id.jobType",
              totalPrice: 1,
              isTaxable: 1,
              source: 1,
              dataType: "Material",
            },
          },
        ]),
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: { path: "$officeFieldCopy", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$officeFieldCopy.fieldCopies", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$officeFieldCopy.fieldCopies.jobType",
              totalPrice: { $sum: "$officeFieldCopy.fieldCopies.totalCost" },
              isLaborTaxable: { $first: "$officeFieldCopy.fieldCopies.isLaborTaxable" },
            },
          },
          {
            $project: {
              _id: 0,
              jobType: "$_id",
              totalPrice: 1,
              isLaborTaxable: 1,
              dataType: "Labor",
            },
          },
        ]),
      ]);

    const [draftCopiesData, materialDraftData, laborDraftData] =
      await Promise.all([
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: "$draftCopy" },
          { $unwind: "$draftCopy.draftCopies" },
          { $unwind: "$draftCopy.draftCopies.copies" },
          { $match: { "draftCopy.draftCopies.copies.status": "Active" } },
          {
            $group: {
              _id: "$_id",
              activeOfficeCopies: { $push: "$draftCopy.draftCopies.copies" },
            },
          },
        ]),
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: { path: "$draftCopy", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$draftCopy.draftCopies", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$draftCopy.draftCopies.copies", preserveNullAndEmptyArrays: true } },
          { $match: { "draftCopy.draftCopies.copies.status": "Active" } },
          {
            $group: {
              _id: {
                category: {
                  $cond: {
                    if: { $eq: ["$draftCopy.draftCopies.copies.source", "Labor"] },
                    then: "Labor",
                    else: "F&G/Other/LumpSum",
                  },
                },
                jobType: "$draftCopy.draftCopies.jobType",
                isTaxable: "$draftCopy.draftCopies.copies.isTaxable",
              },
              totalPrice: { $sum: "$draftCopy.draftCopies.copies.totalPrice" },
              totalQuantity: { $sum: "$draftCopy.draftCopies.copies.quantity" },
              isTaxable: { $first: "$draftCopy.draftCopies.copies.isTaxable" },
              source: { $first: "$draftCopy.draftCopies.copies.source" },
            },
          },
          {
            $project: {
              _id: 0,
              jobType: "$_id.jobType",
              totalPrice: 1,
              isTaxable: 1,
              source: 1,
              dataType: "Material",
            },
          },
        ]),
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: { path: "$draftCopy" } },
          { $unwind: { path: "$draftCopy.draftCopies" } },
          {
            $group: {
              _id: "$draftCopy.draftCopies.jobType",
              totalPrice: { $sum: "$draftCopy.draftCopies.totalCost" },
              isLaborTaxable: { $first: "$draftCopy.draftCopies.isLaborTaxable" },
            },
          },
          {
            $project: {
              _id: 0,
              jobType: "$_id",
              totalPrice: 1,
              isLaborTaxable: 1,
              dataType: "Labor",
            },
          },
        ]),
      ]);

    // -----------------------------
    // Merge PICK UP/DELIVERY entries
    // -----------------------------
    function mergePickUpDelivery(dataArray) {
      if (!Array.isArray(dataArray) || dataArray.length === 0) return [];
      let merged = [];
      let pickUpDelivery = null;

      dataArray.forEach((item) => {
        const normalizedRef = (item.reference || item.jobType || "")
          .replace(/\s+/g, "")
          .replace(/\//g, "")
          .toLowerCase();

        if (normalizedRef.includes("pickupdelivery")) {
          if (!pickUpDelivery) {
            pickUpDelivery = { ...item };
          } else {
            pickUpDelivery.totalPrice += item.totalPrice || 0;
            if ("totalQuantity" in item) {
              pickUpDelivery.totalQuantity =
                (pickUpDelivery.totalQuantity || 0) + (item.totalQuantity || 0);
            }
          }
        } else {
          merged.push(item);
        }
      });

      if (pickUpDelivery) merged.push(pickUpDelivery);
      return merged;
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Field Copies retrieved successfully",
      result: {
        officeFieldCopies: mergePickUpDelivery(officeCopiesData[0]?.activeOfficeCopies || []),
        materialData: mergePickUpDelivery(materialDataByJobType),
        laborData: mergePickUpDelivery(laborDataByJobType),
        officeDraftCopies: mergePickUpDelivery(draftCopiesData[0]?.activeOfficeCopies || []),
        materialDraftData: mergePickUpDelivery(materialDraftData),
        laborDraftData: mergePickUpDelivery(laborDraftData),
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};



exports.getOfficeCopiesByJobType = async (req, res) => {
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

    const { projectId } = req.params;

    if (!projectId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }

    const [jobTypeData, laborDataByJobType] = await Promise.all([
      Project.aggregate([
        {
          // Match the specific project by its _id
          $match: { _id: new mongoose.Types.ObjectId(projectId) },
        },
        {
          // Unwind the officeFieldCopy array
          $unwind: {
            path: "$officeFieldCopy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          // Unwind the fieldCopies array inside officeFieldCopy
          $unwind: {
            path: "$officeFieldCopy.fieldCopies",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          // Unwind the copies array inside fieldCopies
          $unwind: {
            path: "$officeFieldCopy.fieldCopies.copies",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          // Match only active copies
          $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" },
        },
        {
          // Group by jobType and sum the totalPrice
          $group: {
            _id: "$officeFieldCopy.fieldCopies.jobType", // Group by jobType
            totalPrice: {
              $sum: "$officeFieldCopy.fieldCopies.copies.totalPrice",
            }, // Sum of totalPrice
            totalQuantity: {
              $sum: "$officeFieldCopy.fieldCopies.copies.quantity",
            }, // Sum of quantities
          },
        },
        {
          // Format the result (optional)
          $project: {
            _id: 0,
            jobType: "$_id", // Rename _id to jobType
            totalPrice: 1,
          },
        },
      ]),
      Project.aggregate([
        {
          // Match the specific project by its _id
          $match: { _id: new mongoose.Types.ObjectId(projectId) },
        },
        {
          // Unwind the officeFieldCopy array
          $unwind: {
            path: "$officeFieldCopy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          // Unwind the fieldCopies array inside officeFieldCopy
          $unwind: {
            path: "$officeFieldCopy.fieldCopies",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$officeFieldCopy.fieldCopies.jobType", // Group by jobType
            totalPrice: { $sum: "$officeFieldCopy.fieldCopies.totalCost" }, // Sum the totalCost
          },
        },
        {
          $project: {
            _id: 0, // Remove the default _id field
            jobType: "$_id", // Rename _id to jobType
            totalPrice: 1, // Include the totalCostSum
          },
        },
      ]),
    ]);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Field Copies retrieved successfully",
      result: {
        materialData: jobTypeData,
        laborData: laborDataByJobType,
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.deleteFieldCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      let { projectId, fieldId } = req.params;
      projectId = projectId?.trim();
      fieldId = fieldId?.trim();

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      if (!fieldId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Field Id is required",
          result: {},
        });
      }

      let manHours = 0;
      let entryDate = "";

      project.officeFieldCopy = project.officeFieldCopy.filter((copy) => {
        if (copy._id.toString() === fieldId) {
          manHours = getTotalManHours(
            copy.startTime,
            copy.endTime,
            copy.laborCount
          );
          entryDate = copy.entryDate;
        }
        return copy._id.toString() !== fieldId;
      });

      await FieldCopyHistory.updateMany(
        { projectId: projectId, entryDate: entryDate },
        {
          $set: {
            status: "Delete",
          },
        }
      );

      if (project.totalManHours - manHours >= 0) {
        project.totalManHours = project.totalManHours - manHours;
      }

      await project.save();

      return res.send({
        statusCode: 200,
        success: true,
        message: "Field Copy deleted successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

// exports.getofficeFieldCopy = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await Staff.findOne({
//       _id: token._id,
//       status: "Active",
//     });

//     if (staff) {
//       const { projectId } = req.params;
//       const { page = 1, pageSize = 10 } = req.query;

//       if (!projectId) {
//         return res.send({
//           statusCode: 404,
//           success: false,
//           message: "Project Id is required",
//           result: {},
//         });
//       }

//       const project = await Project.findById(projectId);

//       if (!project) {
//         return res.send({
//           statusCode: 404,
//           success: false,
//           message: "Project not found",
//           result: {},
//         });
//       }

//       // if (project.staffId.toString() !== req.token._id) {
//       //   return res.send({
//       //     statusCode: 403,
//       //     success: false,
//       //     message: "Forbidden Access",
//       //     result: {},
//       //   });
//       // }

//       // Filter field copies to include only those with status "Active"
//       // const activeFieldCopies = project.officeFieldCopy.filter(fieldCopy => fieldCopy.status === "Active");
//       const activeFieldCopies = project.officeFieldCopy;

//       // Pagination logic
//       const totalFieldCopies = activeFieldCopies.length;
//       const totalPages = Math.ceil(totalFieldCopies / pageSize);
//       const start = (page - 1) * pageSize;
//       const end = start + pageSize;
//       const paginatedFieldCopies = activeFieldCopies.slice(start, end);

//       return res.send({
//         statusCode: 200,
//         success: true,
//         message: "Active Field Copies retrieved successfully",
//         result: {
//           fieldCopies: paginatedFieldCopies,
//           totalRecords: totalFieldCopies,
//           totalPages,
//           currentPage: page,
//         },
//       });
//     } else {
//       return res.send({
//         statusCode: 401,
//         success: false,
//         message: "Unauthorized User",
//         result: {},
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     return res.send({
//       statusCode: 500,
//       success: false,
//       message: err?.message || "Internal Server Error",
//       result: {},
//     });
//   }
// };

exports.getCustomerFieldCopy = async (req, res) => {
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

    const { projectId } = req.params;

    if (!projectId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }

    const [customerCopiesData, materialDataByJobType, laborDataByJobType] =
      await Promise.all([
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array to process each entry individually
            $unwind: "$customerFieldCopy",
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: "$customerFieldCopy.copies",
          },
          // {
          //   // Unwind the copies array inside fieldCopies
          //   $unwind: "$officeFieldCopy.fieldCopies.copies"
          // },
          {
            // Filter only active copies
            $match: { "customerFieldCopy.copies.status": "Active" },
          },
          {
            // Group the results back into a single array of active copies
            $group: {
              _id: "$_id",
              activeCopies: { $push: "$customerFieldCopy.copies" },
            },
          },
        ]),
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array
            $unwind: {
              path: "$customerFieldCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: {
              path: "$customerFieldCopy.copies",
              preserveNullAndEmptyArrays: true,
            },
          },
          // {
          //   // Unwind the copies array inside fieldCopies
          //   $unwind: {
          //     path: "$officeFieldCopy.fieldCopies.copies",
          //     preserveNullAndEmptyArrays: true
          //   }
          // },
          {
            // Match only active copies
            $match: { "customerFieldCopy.copies.status": "Active" },
          },
          {
            // Group by jobType and sum the totalPrice
            $group: {
              _id: "$customerFieldCopy.jobType", // Group by jobType
              totalPrice: { $sum: "$customerFieldCopy.copies.totalPrice" }, // Sum of totalPrice
              totalQuantity: { $sum: "$customerFieldCopy.copies.quantity" }, // Sum of quantities
            },
          },
          {
            // Format the result (optional)
            $project: {
              jobType: "$_id", // Rename _id to jobType
              totalPrice: 1,
              totalQuantity: 1,
            },
          },
        ]),
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array
            $unwind: {
              path: "$customerFieldCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$customerFieldCopy.jobType", // Group by jobType
              totalPrice: { $sum: "$customerFieldCopy.totalCost" }, // Sum the totalCost
              isLaborTaxable: { $first: "$customerFieldCopy.isLaborTaxable" },
            },
          },
          {
            $project: {
              _id: 0, // Remove the default _id field
              jobType: "$_id", // Rename _id to jobType
              totalPrice: 1, // Include the totalCostSum
              isLaborTaxable: 1,
            },
          },
        ]),
      ]);

    const [draftCopiesData, materialDraftData, laborDraftData] =
      await Promise.all([
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array to process each entry individually
            $unwind: "$draftCopy",
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: "$draftCopy.draftCopies",
          },
          {
            // Unwind the copies array inside fieldCopies
            $unwind: "$draftCopy.draftCopies.copies",
          },
          {
            // Filter only active copies
            $match: { "draftCopy.draftCopies.copies.status": "Active" },
          },
          {
            // Group the results back into a single array of active copies
            $group: {
              _id: "$_id",
              activeOfficeCopies: {
                $push: "$draftCopy.draftCopies.copies",
              },
            },
          },
        ]),
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array
            $unwind: {
              path: "$draftCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: {
              path: "$draftCopy.draftCopies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Unwind the copies array inside fieldCopies
            $unwind: {
              path: "$draftCopy.draftCopies.copies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Match only active copies
            $match: { "draftCopy.draftCopies.copies.status": "Active" },
          },
          {
            // Group by jobType and sum the totalPrice
            $group: {
              _id: "$draftCopy.draftCopies.jobType", // Group by jobType
              totalPrice: {
                $sum: "$draftCopy.draftCopies.copies.totalPrice",
              }, // Sum of totalPrice
              totalQuantity: {
                $sum: "$draftCopy.draftCopies.copies.quantity",
              }, // Sum of quantities
            },
          },
          {
            // Format the result (optional)
            $project: {
              _id: 0,
              jobType: "$_id", // Rename _id to jobType
              totalPrice: 1,
            },
          },
        ]),
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array
            $unwind: {
              path: "$draftCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: {
              path: "$draftCopy.draftCopies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$draftCopy.draftCopies.jobType", // Group by jobType
              totalPrice: { $sum: "$draftCopy.draftCopies.totalCost" }, // Sum the totalCost
              isLaborTaxable: {
                $first: "$draftCopy.draftCopies.isLaborTaxable",
              },
            },
          },
          {
            $project: {
              _id: 0, // Remove the default _id field
              jobType: "$_id", // Rename _id to jobType
              totalPrice: 1, // Include the totalCostSum
              isLaborTaxable: 1,
            },
          },
        ]),
      ]);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Field Copies retrieved successfully",
      result: {
        customerCopiesData: customerCopiesData[0]?.activeCopies || [],
        materialData: materialDataByJobType,
        laborData: laborDataByJobType,
        officeDraftCopies: draftCopiesData[0]?.activeOfficeCopies || [],
        materialDraftData: materialDraftData,
        laborDraftData: laborDraftData,
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getBidedFieldCopy = async (req, res) => {
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

    const { projectId } = req.params;

    if (!projectId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }

    const [bidedCopiesData, materialDataByJobType, laborDataByJobType] =
      await Promise.all([
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array to process each entry individually
            $unwind: "$bidedCopy",
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: "$bidedCopy.copies",
          },
          // {
          //   // Unwind the copies array inside fieldCopies
          //   $unwind: "$officeFieldCopy.fieldCopies.copies"
          // },
          {
            // Filter only active copies
            $match: { "bidedCopy.copies.status": "Active" },
          },
          {
            // Group the results back into a single array of active copies
            $group: {
              _id: "$_id",
              activeCopies: { $push: "$bidedCopy.copies" },
            },
          },
        ]),
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array
            $unwind: {
              path: "$bidedCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Unwind the fieldCopies array inside officeFieldCopy
            $unwind: {
              path: "$bidedCopy.copies",
              preserveNullAndEmptyArrays: true,
            },
          },
          // {
          //   // Unwind the copies array inside fieldCopies
          //   $unwind: {
          //     path: "$officeFieldCopy.fieldCopies.copies",
          //     preserveNullAndEmptyArrays: true
          //   }
          // },
          {
            // Match only active copies
            $match: { "bidedCopy.copies.status": "Active" },
          },
          {
            // Group by jobType and sum the totalPrice
            $group: {
              // _id: "$bidedCopy.jobType", // Group by jobType
              _id: {
                category: {
                  $cond: {
                    if: { $eq: ["$bidedCopy.copies.source", "Labor"] },
                    then: "Labor",
                    else: "F&G/Other/LumpSum",
                  },
                },
                jobType: "$bidedCopy.copies.type", // Group by jobType
                isTaxable: "$bidedCopy.copies.isTaxable",
              },
              totalPrice: { $sum: "$bidedCopy.copies.totalPrice" }, // Sum of totalPrice
              totalQuantity: { $sum: "$bidedCopy.copies.quantity" }, // Sum of quantities
              source: { $first: "$bidedCopy.copies.source" },
              isTaxable: { $first: "$bidedCopy.copies.isTaxable" },
            },
          },
          {
            // Format the result (optional)
            $project: {
              _id: 0,
              jobType: "$_id.jobType", // Rename _id to jobType
              totalPrice: 1,
              totalQuantity: 1,
              source: 1,
              isTaxable: 1,
              dataType: "Material",
            },
          },
        ]),
        Project.aggregate([
          {
            // Match the specific project by its _id
            $match: { _id: new mongoose.Types.ObjectId(projectId) },
          },
          {
            // Unwind the officeFieldCopy array
            $unwind: {
              path: "$bidedCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$bidedCopy.jobType", // Group by jobType
              totalPrice: { $sum: "$bidedCopy.totalCost" }, // Sum the totalCost
              isLaborTaxable: { $first: "$bidedCopy.isLaborTaxable" },
            },
          },
          {
            $project: {
              _id: 0, // Remove the default _id field
              jobType: "$_id", // Rename _id to jobType
              totalPrice: 1, // Include the totalCostSum
              isLaborTaxable: 1,
              dataType: "Labor",
            },
          },
        ]),
      ]);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Field Copies retrieved successfully",
      result: {
        bidedCopiesData: bidedCopiesData[0]?.activeCopies || [],
        materialData: materialDataByJobType,
        laborData: laborDataByJobType,
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getCustomerCopiesByJobType = async (req, res) => {
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

    const { projectId } = req.params;

    if (!projectId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }

    const [jobTypeData, laborDataByJobType] = await Promise.all([
      Project.aggregate([
        {
          // Match the specific project by its _id
          $match: { _id: new mongoose.Types.ObjectId(projectId) },
        },
        {
          // Unwind the officeFieldCopy array
          $unwind: {
            path: "$customerFieldCopy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          // Unwind the fieldCopies array inside officeFieldCopy
          $unwind: {
            path: "$customerFieldCopy.copies",
            preserveNullAndEmptyArrays: true,
          },
        },
        // {
        //   // Unwind the copies array inside fieldCopies
        //   $unwind: {
        //     path: "$officeFieldCopy.fieldCopies.copies",
        //     preserveNullAndEmptyArrays: true
        //   }
        // },
        {
          // Match only active copies
          $match: { "customerFieldCopy.copies.status": "Active" },
        },
        {
          // Group by jobType and sum the totalPrice
          $group: {
            _id: "$customerFieldCopy.jobType", // Group by jobType
            totalPrice: { $sum: "$customerFieldCopy.copies.totalPrice" }, // Sum of totalPrice
            totalQuantity: { $sum: "$customerFieldCopy.copies.quantity" }, // Sum of quantities
          },
        },
        {
          // Format the result (optional)
          $project: {
            jobType: "$_id", // Rename _id to jobType
            totalPrice: 1,
            totalQuantity: 1,
          },
        },
      ]),
      Project.aggregate([
        {
          // Match the specific project by its _id
          $match: { _id: new mongoose.Types.ObjectId(projectId) },
        },
        {
          // Unwind the officeFieldCopy array
          $unwind: {
            path: "$customerFieldCopy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$customerFieldCopy.jobType", // Group by jobType
            totalCostSum: { $sum: "$customerFieldCopy.totalCost" }, // Sum the totalCost
          },
        },
        {
          $project: {
            _id: 0, // Remove the default _id field
            jobType: "$_id", // Rename _id to jobType
            totalCostSum: 1, // Include the totalCostSum
          },
        },
      ]),
    ]);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Field Copies retrieved successfully",
      result: {
        materialData: jobTypeData,
        laborData: laborDataByJobType,
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

// exports.getCustomerFieldCopy = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await Staff.findOne({
//       _id: token._id,
//       status: "Active",
//     });

//     if (staff) {
//       const { projectId } = req.params;

//       if (!projectId) {
//         return res.send({
//           statusCode: 404,
//           success: false,
//           message: "Project Id is required",
//           result: {},
//         });
//       }

//       const project = await Project.findById(projectId);

//       if (!project) {
//         return res.send({
//           statusCode: 404,
//           success: false,
//           message: "Project not found",
//           result: {},
//         });
//       }

//       // if (project.staffId.toString() !== project.staffId) {
//       //   return res.send({
//       //     statusCode: 403,
//       //     success: false,
//       //     message: "Forbidden Access",
//       //     result: {},
//       //   });
//       // }

//       return res.send({
//         statusCode: 200,
//         success: true,
//         message: "Field Copies retrieved successfully",
//         result: project.customerFieldCopy,
//       });
//     } else {
//       return res.send({
//         statusCode: 401,
//         success: false,
//         message: "Unauthorized User",
//         result: {},
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     return res.send({
//       statusCode: 500,
//       success: false,
//       message: err?.message || "Internal Server Error",
//       result: {},
//     });
//   }
// };

exports.editCustomerFieldCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      // if (project.staffId.toString() !== req.token._id) {
      //   return res.send({
      //     statusCode: 403,
      //     success: false,
      //     message: "Forbidden Access",
      //     result: {},
      //   });
      // }

      let { forms } = req.body;

      if (!forms) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Updated Copy is required",
          result: {},
        });
      }

      forms = JSON.parse(forms);

      project.customerFieldCopy = forms;
      // const len = project.customerFieldCopy.length

      await project.save();

      return res.send({
        statusCode: 200,
        success: true,
        message: "Customer copy updated successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.editBidedFieldCopy = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { projectId } = req.params;

      if (!projectId) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project Id is required",
          result: {},
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Project not found",
          result: {},
        });
      }

      // if (project.staffId.toString() !== req.token._id) {
      //   return res.send({
      //     statusCode: 403,
      //     success: false,
      //     message: "Forbidden Access",
      //     result: {},
      //   });
      // }

      let { forms } = req.body;

      if (!forms) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Updated Copy is required",
          result: {},
        });
      }

      forms = JSON.parse(forms);

      project.bidedCopy = forms;

      await project.save();

      return res.send({
        statusCode: 200,
        success: true,
        message: "Bided copy updated successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

// Others

exports.getAllMaterials = async (req, res) => {
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
        message: "Unauthorized Staff",
        result: {},
      });
    }

    const materials = await Material.find({}).sort({ name: 1 }).lean();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Materials fetched successfully",
      result: materials,
    });
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getJobTypeById = async (req, res) => {
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
        message: "Unauthorized staff",
        result: {},
      });
    }

    const { jobId } = req.params;

    if (!jobId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job ID is required",
        result: {},
      });
    }

    const jobType = await JobType.findById(jobId).lean();

    if (!jobType) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Job Type not found",
        result: {},
      });
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Job Type fetched successfully",
      result: jobType,
    });
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

// Compiled Resources

exports.getCustomerProjectList = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (staff) {
      const { page = 1, limit = 10 } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSizeNumber = parseInt(limit, 10);

      // const totalProjects = await Project.countDocuments({
      //   staffId: token._id,
      //   status : {
      //     $or : [
      //       {$in: ["Active","Completed","Ongoing"],billingType : "No Bid"},
      //       {$in: ["Completed","Ongoing"],billingType : "No Bid"}
      //     ]
      //   }
      // });
      const totalProjects = await Project.countDocuments({
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Active", "Ongoing"],
            },
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Ongoing"],
            },
          },
        ],
      });
      // const projects = await Project.find({
      //   staffId: token._id,
      //   status: {
      //     $in: ["Active", "Completed", "Ongoing"],
      //   },
      // })
      const projects = await Project.find({
        $or: [
          {
            billingType: "No Bid",
            status: {
              $in: ["Active", "Ongoing"],
            },
          },
          {
            billingType: "Bid",
            status: {
              $in: ["Ongoing"],
            },
          },
        ],
      })
        // .select("-officeFieldCopy -customerFieldCopy -bidedCopy")
        .sort({ projectStartDate: -1 })
        .skip((pageNumber - 1) * pageSizeNumber)
        .limit(pageSizeNumber);

      if (projects) {
        return res.send({
          statusCode: 200,
          success: true,
          message: "Projects fetched successfully",
          result: {
            projects,
            totalRecords: totalProjects,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProjects / pageSizeNumber),
          },
        });
      } else {
        return res.send({
          statusCode: 404,
          success: false,
          message: "Projects not found",
          result: {},
        });
      }
    } else {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
        result: {},
      });
    }
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

// I will Provide you an array of project Ids and we have to get the compiled data for each project
exports.getCompiledProjects = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });

    if (!staff) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Unauthorized Staff",
        result: {},
      });
    }

    let { projectIds } = req.body;

    console.log("Project Ids", projectIds);

    if (!projectIds) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Ids are required",
        result: {},
      });
    }

    projectIds = JSON.parse(projectIds);

    let projects = await Promise.all(
      projectIds.map(async (projectId) => {
        const project = await Project.findOne({
          _id: projectId,
        })
          .populate("jobType")
          .select(
            "customerFieldCopy _id jobAddress projectCode credits jobType description lastCustomerCopyId projectCompletedDate"
          )
          .lean();

        // get customer copy with latest changes
        let customerFieldCopy =
          project.customerFieldCopy[project.customerFieldCopy.length - 1];
        customerFieldCopy =
          customerFieldCopy.customerCopies[
            customerFieldCopy.customerCopies.length - 1
          ];
        let copies = [];
        for (let copy of customerFieldCopy) {
          copies = [...copies, ...copy.copies];
        }

        console.log("Copies ======", copies);

        // const materialData = Object.values(
        //   copies.reduce((acc, item) => {
        //     const jobType = item.type;
        //     const isLabor = item.source === "Labor" ? "Labor" : "F&G/Other/LumpSum";

        //     if (!acc[jobType]) {
        //         acc[jobType] = {
        //         jobType: jobType,
        //         totalPrice: isLabor ? item.totalPrice : 0,
        //         totalQuantity: 0,
        //         dataType : isLabor ? "Labor" : "Material"
        //       }
        //     }

        //     // Accumulate the totals
        //     acc[jobType].totalPrice += item.totalPrice;
        //     acc[jobType].totalQuantity += item.quantity;

        //     return acc;
        //   }, {})
        // );

        const materialData = Object.values(
          copies.reduce((acc, item) => {
            const isLabor = item.source === "Labor";
            const category = isLabor ? "Labor" : "Material";
            const key = `${item.type}-${category}`;

            if (!acc[key]) {
              acc[key] = {
                jobType: item.type,
                // category: category,
                totalPrice: 0,
                totalQuantity: 0,
                dataType: category, // You can also keep this as isLabor ? "Labor" : "Material"
              };
            }

            acc[key].totalPrice += item.totalPrice || 0;
            acc[key].totalQuantity += item.quantity || 0;

            return acc;
          }, {})
        );

        console.log("Material Data", materialData);

        const laborData = Object.values(
          customerFieldCopy.reduce((acc, item) => {
            const jobType = item.jobType;

            if (!acc[jobType]) {
              acc[jobType] = {
                jobType: jobType,
                totalPrice: 0,
                isLaborTaxable: item.isLaborTaxable,
                dataType: "Labor",
              };
            }

            // Accumulate the totals
            acc[jobType].totalPrice += item.totalCost;

            return acc;
          }, {})
        );

        return {
          projectData: {
            _id: project._id,
            jobAddress: project.jobAddress,
            projectCode: project.projectCode,
            credits: project.credits,
            jobType: project.jobType,
            description: project.description,
            lastCustomerCopyId: project.lastCustomerCopyId,
            projectCompletedDate: project.projectCompletedDate,
          },
          customerCopiesData: copies || [],
          materialData: materialData || [],
          laborData: laborData || [],
        };
      })
    );

    // const [customerCopiesData, materialDataByJobType, laborDataByJobType] =
    //   await Promise.all([
    //     Project.aggregate([
    //       {
    //         // Match the specific project by its _id
    //         $match: { _id: new mongoose.Types.ObjectId(projectId) },
    //       },
    //       {
    //         // Unwind the officeFieldCopy array to process each entry individually
    //         $unwind: "$customerFieldCopy",
    //       },
    //       {
    //         // Unwind the fieldCopies array inside officeFieldCopy
    //         $unwind: "$customerFieldCopy.copies",
    //       },
    //       // {
    //       //   // Unwind the copies array inside fieldCopies
    //       //   $unwind: "$officeFieldCopy.fieldCopies.copies"
    //       // },
    //       {
    //         // Filter only active copies
    //         $match: { "customerFieldCopy.copies.status": "Active" },
    //       },
    //       {
    //         // Group the results back into a single array of active copies
    //         $group: {
    //           _id: "$_id",
    //           activeCopies: { $push: "$customerFieldCopy.copies" },
    //         },
    //       },
    //     ]),
    //     Project.aggregate([
    //       {
    //         // Match the specific project by its _id
    //         $match: { _id: new mongoose.Types.ObjectId(projectId) },
    //       },
    //       {
    //         // Unwind the officeFieldCopy array
    //         $unwind: {
    //           path: "$customerFieldCopy",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //       {
    //         // Unwind the fieldCopies array inside officeFieldCopy
    //         $unwind: {
    //           path: "$customerFieldCopy.copies",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //       // {
    //       //   // Unwind the copies array inside fieldCopies
    //       //   $unwind: {
    //       //     path: "$officeFieldCopy.fieldCopies.copies",
    //       //     preserveNullAndEmptyArrays: true
    //       //   }
    //       // },
    //       {
    //         // Match only active copies
    //         $match: { "customerFieldCopy.copies.status": "Active" },
    //       },
    //       {
    //         // Group by jobType and sum the totalPrice
    //         $group: {
    //           _id: "$customerFieldCopy.jobType", // Group by jobType
    //           totalPrice: { $sum: "$customerFieldCopy.copies.totalPrice" }, // Sum of totalPrice
    //           totalQuantity: { $sum: "$customerFieldCopy.copies.quantity" }, // Sum of quantities
    //         },
    //       },
    //       {
    //         // Format the result (optional)
    //         $project: {
    //           jobType: "$_id", // Rename _id to jobType
    //           totalPrice: 1,
    //           totalQuantity: 1,
    //         },
    //       },
    //     ]),
    //     Project.aggregate([
    //       {
    //         // Match the specific project by its _id
    //         $match: { _id: new mongoose.Types.ObjectId(projectId) },
    //       },
    //       {
    //         // Unwind the officeFieldCopy array
    //         $unwind: {
    //           path: "$customerFieldCopy",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //       {
    //         $group: {
    //           _id: "$customerFieldCopy.jobType", // Group by jobType
    //           totalPrice: { $sum: "$customerFieldCopy.totalCost" }, // Sum the totalCost
    //           isLaborTaxable: { $first: "$customerFieldCopy.isLaborTaxable" },
    //         },
    //       },
    //       {
    //         $project: {
    //           _id: 0, // Remove the default _id field
    //           jobType: "$_id", // Rename _id to jobType
    //           totalPrice: 1, // Include the totalCostSum
    //           isLaborTaxable: 1,
    //         },
    //       },
    //     ]),
    //   ]);

    return res.send({
      statusCode: 200,
      success: false,
      message: "Projects fetched successfully",
      // result: {
      //   customerCopiesData: customerCopiesData[0]?.activeCopies || [],
      //   materialData: materialDataByJobType,
      //   laborData: laborDataByJobType,
      // },
      result: projects,
    });
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.getCustomerProjectData = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findById(token._id).lean();
    const admin = await Admin.findOne({}).lean();

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        result: {},
      });
    }

    const project = await Project.findOne({
      _id: req.params.projectId,
    }).lean();

    const data = {
      customerName: project.customerName,
      customerEmail: project.customerEmail,
      customerPhone: project.customerPhone,
      companyAddress: admin?.fgAddress || "",
    };

    return res.send({
      statusCode: 200,
      success: true,
      message: "Customer Data fetched successfully",
      result: data,
    });
  } catch (err) {
    return res.send({
      statusCode: 500,
      success: false,
      message: err.message || "Internal Server Error",
      result: {},
    });
  }
};

// exports.getFieldCopiesByDate = async (req, res) => {
//   try {
//     const token = req.token;
//     const staff = await Staff.findOne({
//       _id: token?._id,
//       status: "Active",
//     });

//     if (!staff) {
//       return res.send({
//         statusCode: 401,
//         success: false,
//         message: "Unauthorized User",
//         result: {},
//       });
//     }

//     const { projectId } = req.params;
//     const { date } = req.body;

//     if (!projectId) {
//       return res.send({
//         statusCode: 400,
//         success: false,
//         message: "Project Id is required",
//         result: {},
//       });
//     }
//     if (!date) {
//       return res.send({
//         statusCode: 400,
//         success: false,
//         message: "Date is required",
//         result: {},
//       });
//     }

//     const [officeCopiesData, materialDataByJobType, laborDataByJobType] =
//       await Promise.all([
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array to process each entry individually
//             $unwind: "$officeFieldCopy",
//           },
//           {
//             $match: {
//               "officeFieldCopy.entryDate": date, // Ensuring only matching entryDate is processed
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: "$officeFieldCopy.fieldCopies",
//           },
//           {
//             // Unwind the copies array inside fieldCopies
//             $unwind: "$officeFieldCopy.fieldCopies.copies",
//           },
//           {
//             // Filter only active copies
//             $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" },
//           },
//           {
//             // Group the results back into a single array of active copies
//             $group: {
//               _id: "$_id",
//               activeOfficeCopies: {
//                 $push: "$officeFieldCopy.fieldCopies.copies",
//               },
//             },
//           },
//         ]),
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array
//             $unwind: {
//               path: "$officeFieldCopy",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $match: {
//               "officeFieldCopy.entryDate": date, // Ensuring only matching entryDate is processed
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: {
//               path: "$officeFieldCopy.fieldCopies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Unwind the copies array inside fieldCopies
//             $unwind: {
//               path: "$officeFieldCopy.fieldCopies.copies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Match only active copies
//             $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" },
//           },
//           {
//             // Group by jobType and sum the totalPrice
//             $group: {
//               // _id: "$officeFieldCopy.fieldCopies.jobType", // Group by jobType
//               _id: {
//                 category: {
//                   $cond: {
//                     if: {
//                       $eq: [
//                         "$officeFieldCopy.fieldCopies.copies.source",
//                         "Labor",
//                       ],
//                     },
//                     then: "Labor",
//                     else: "F&G/Other/LumpSum",
//                   },
//                 },
//                 jobType: "$officeFieldCopy.fieldCopies.jobType", // Group by jobType
//                 isTaxable: "$officeFieldCopy.fieldCopies.copies.isTaxable",
//               },
//               totalPrice: {
//                 $sum: "$officeFieldCopy.fieldCopies.copies.totalPrice",
//               }, // Sum of totalPrice
//               totalQuantity: {
//                 $sum: "$officeFieldCopy.fieldCopies.copies.quantity",
//               }, // Sum of quantities
//               isTaxable: {
//                 $first: "$officeFieldCopy.fieldCopies.copies.isTaxable",
//               },
//               source: {
//                 $first: "$officeFieldCopy.fieldCopies.copies.source",
//               },
//             },
//           },
//           {
//             // Format the result (optional)
//             $project: {
//               _id: 0,
//               jobType: "$_id.jobType", // Rename _id to jobType
//               totalPrice: 1,
//               isTaxable: 1,
//               source: 1,
//               dataType: "Material",
//             },
//           },
//         ]),
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array
//             $unwind: {
//               path: "$officeFieldCopy",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $match: {
//               "officeFieldCopy.entryDate": date, // Ensuring only matching entryDate is processed
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: {
//               path: "$officeFieldCopy.fieldCopies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $group: {
//               _id: "$officeFieldCopy.fieldCopies.jobType", // Group by jobType
//               totalPrice: { $sum: "$officeFieldCopy.fieldCopies.totalCost" }, // Sum the totalCost
//               isLaborTaxable: {
//                 $first: "$officeFieldCopy.fieldCopies.isLaborTaxable",
//               },
//             },
//           },
//           {
//             $project: {
//               _id: 0, // Remove the default _id field
//               jobType: "$_id", // Rename _id to jobType
//               totalPrice: 1, // Include the totalCostSum
//               isLaborTaxable: 1,
//               dataType: "Labor",
//             },
//           },
//         ]),
//       ]);

//     const [draftCopiesData, materialDraftData, laborDraftData] =
//       await Promise.all([
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array to process each entry individually
//             $unwind: "$draftCopy",
//           },
//           {
//             $match: {
//               "draftCopy.entryDate": date, // Ensuring only matching entryDate is processed
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: "$draftCopy.draftCopies",
//           },
//           {
//             // Unwind the copies array inside fieldCopies
//             $unwind: "$draftCopy.draftCopies.copies",
//           },
//           {
//             // Filter only active copies
//             $match: { "draftCopy.draftCopies.copies.status": "Active" },
//           },
//           {
//             // Group the results back into a single array of active copies
//             $group: {
//               _id: "$_id",
//               activeOfficeCopies: {
//                 $push: "$draftCopy.draftCopies.copies",
//               },
//             },
//           },
//         ]),
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array
//             $unwind: {
//               path: "$draftCopy",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $match: {
//               "draftCopy.entryDate": date, // Ensuring only matching entryDate is processed
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: {
//               path: "$draftCopy.draftCopies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Unwind the copies array inside fieldCopies
//             $unwind: {
//               path: "$draftCopy.draftCopies.copies",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Match only active copies
//             $match: { "draftCopy.draftCopies.copies.status": "Active" },
//           },
//           {
//             // Group by jobType and sum the totalPrice
//             $group: {
//               // _id: "$draftCopy.draftCopies.jobType", // Group by jobType
//               _id: {
//                 category: {
//                   $cond: {
//                     if: {
//                       $eq: ["$draftCopy.draftCopies.copies.source", "Labor"],
//                     },
//                     then: "Labor",
//                     else: "F&G/Other/LumpSum",
//                   },
//                 },
//                 jobType: "$draftCopy.draftCopies.jobType", // Group by jobType
//                 isTaxable: "$draftCopy.draftCopies.copies.isTaxable",
//               },
//               totalPrice: {
//                 $sum: "$draftCopy.draftCopies.copies.totalPrice",
//               }, // Sum of totalPrice
//               totalQuantity: {
//                 $sum: "$draftCopy.draftCopies.copies.quantity",
//               }, // Sum of quantities
//               isTaxable: {
//                 $first: "$draftCopy.draftCopies.copies.isTaxable",
//               },
//               source: {
//                 $first: "$draftCopy.draftCopies.copies.source",
//               },
//             },
//           },
//           {
//             // Format the result (optional)
//             $project: {
//               _id: 0,
//               jobType: "$_id", // Rename _id to jobType
//               totalPrice: 1,
//               isTaxable: 1,
//               source: 1,
//               dataType: "Material",
//             },
//           },
//         ]),
//         Project.aggregate([
//           {
//             // Match the specific project by its _id
//             $match: { _id: new mongoose.Types.ObjectId(projectId) },
//           },
//           {
//             // Unwind the officeFieldCopy array
//             $unwind: {
//               path: "$draftCopy",
//               // preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $match: {
//               "draftCopy.entryDate": date, // Ensuring only matching entryDate is processed
//             },
//           },
//           {
//             // Unwind the fieldCopies array inside officeFieldCopy
//             $unwind: {
//               path: "$draftCopy.draftCopies",
//               // preserveNullAndEmptyArrays: true,
//             },
//           },

//           {
//             $group: {
//               _id: "$draftCopy.draftCopies.jobType", // Group by jobType
//               totalPrice: { $sum: "$draftCopy.draftCopies.totalCost" }, // Sum the totalCost
//               isLaborTaxable: {
//                 $first: "$draftCopy.draftCopies.isLaborTaxable",
//               },
//             },
//           },
//           {
//             $project: {
//               _id: 0, // Remove the default _id field
//               jobType: "$_id", // Rename _id to jobType
//               totalPrice: 1, // Include the totalCostSum
//               isLaborTaxable: 1,
//               dataType: "Labor",
//             },
//           },
//         ]),
//       ]);

//     return res.send({
//       statusCode: 200,
//       success: true,
//       message: "Field Copies retrieved successfully",
//       result: {
//         officeFieldCopies: officeCopiesData[0]?.activeOfficeCopies || [],
//         materialData: materialDataByJobType,
//         laborData: laborDataByJobType,
//         officeDraftCopies: draftCopiesData[0]?.activeOfficeCopies || [],
//         materialDraftData: materialDraftData,
//         laborDraftData: laborDraftData,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     return res.send({
//       statusCode: 500,
//       success: false,
//       message: err?.message || "Internal Server Error",
//       result: {},
//     });
//   }
// };


exports.getFieldCopiesByDate = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token?._id,
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

    const { projectId } = req.params;
    const { date } = req.body;

    if (!projectId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Project Id is required",
        result: {},
      });
    }
    if (!date) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Date is required",
        result: {},
      });
    }

    const [officeCopiesData, materialDataByJobType, laborDataByJobType] =
      await Promise.all([
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: "$officeFieldCopy" },
          { $match: { "officeFieldCopy.entryDate": date } },
          { $unwind: "$officeFieldCopy.fieldCopies" },
          { $unwind: "$officeFieldCopy.fieldCopies.copies" },
          { $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" } },
          {
            $group: {
              _id: "$_id",
              activeOfficeCopies: {
                $push: "$officeFieldCopy.fieldCopies.copies",
              },
            },
          },
        ]),
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          {
            $unwind: {
              path: "$officeFieldCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $match: { "officeFieldCopy.entryDate": date } },
          {
            $unwind: {
              path: "$officeFieldCopy.fieldCopies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$officeFieldCopy.fieldCopies.copies",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $match: { "officeFieldCopy.fieldCopies.copies.status": "Active" } },
          {
            $group: {
              _id: {
                category: {
                  $cond: {
                    if: {
                      $eq: ["$officeFieldCopy.fieldCopies.copies.source", "Labor"],
                    },
                    then: "Labor",
                    else: "F&G/Other/LumpSum",
                  },
                },
                jobType: "$officeFieldCopy.fieldCopies.jobType",
                isTaxable: "$officeFieldCopy.fieldCopies.copies.isTaxable",
              },
              totalPrice: {
                $sum: "$officeFieldCopy.fieldCopies.copies.totalPrice",
              },
              totalQuantity: {
                $sum: "$officeFieldCopy.fieldCopies.copies.quantity",
              },
              isTaxable: {
                $first: "$officeFieldCopy.fieldCopies.copies.isTaxable",
              },
              source: {
                $first: "$officeFieldCopy.fieldCopies.copies.source",
              },
            },
          },
          {
            $project: {
              _id: 0,
              jobType: "$_id.jobType",
              totalPrice: 1,
              isTaxable: 1,
              source: 1,
              dataType: "Material",
            },
          },
        ]),
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          {
            $unwind: {
              path: "$officeFieldCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $match: { "officeFieldCopy.entryDate": date } },
          {
            $unwind: {
              path: "$officeFieldCopy.fieldCopies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$officeFieldCopy.fieldCopies.jobType",
              totalPrice: { $sum: "$officeFieldCopy.fieldCopies.totalCost" },
              isLaborTaxable: {
                $first: "$officeFieldCopy.fieldCopies.isLaborTaxable",
              },
            },
          },
          {
            $project: {
              _id: 0,
              jobType: "$_id",
              totalPrice: 1,
              isLaborTaxable: 1,
              dataType: "Labor",
            },
          },
        ]),
      ]);

    const [draftCopiesData, materialDraftData, laborDraftData] =
      await Promise.all([
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: "$draftCopy" },
          { $match: { "draftCopy.entryDate": date } },
          { $unwind: "$draftCopy.draftCopies" },
          { $unwind: "$draftCopy.draftCopies.copies" },
          { $match: { "draftCopy.draftCopies.copies.status": "Active" } },
          {
            $group: {
              _id: "$_id",
              activeOfficeCopies: {
                $push: "$draftCopy.draftCopies.copies",
              },
            },
          },
        ]),
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          {
            $unwind: {
              path: "$draftCopy",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $match: { "draftCopy.entryDate": date } },
          {
            $unwind: {
              path: "$draftCopy.draftCopies",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$draftCopy.draftCopies.copies",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $match: { "draftCopy.draftCopies.copies.status": "Active" } },
          {
            $group: {
              _id: {
                category: {
                  $cond: {
                    if: { $eq: ["$draftCopy.draftCopies.copies.source", "Labor"] },
                    then: "Labor",
                    else: "F&G/Other/LumpSum",
                  },
                },
                jobType: "$draftCopy.draftCopies.jobType",
                isTaxable: "$draftCopy.draftCopies.copies.isTaxable",
              },
              totalPrice: {
                $sum: "$draftCopy.draftCopies.copies.totalPrice",
              },
              totalQuantity: {
                $sum: "$draftCopy.draftCopies.copies.quantity",
              },
              isTaxable: {
                $first: "$draftCopy.draftCopies.copies.isTaxable",
              },
              source: {
                $first: "$draftCopy.draftCopies.copies.source",
              },
            },
          },
          {
            $project: {
              _id: 0,
              jobType: "$_id",
              totalPrice: 1,
              isTaxable: 1,
              source: 1,
              dataType: "Material",
            },
          },
        ]),
        Project.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
          { $unwind: "$draftCopy" },
          { $match: { "draftCopy.entryDate": date } },
          { $unwind: "$draftCopy.draftCopies" },
          {
            $group: {
              _id: "$draftCopy.draftCopies.jobType",
              totalPrice: { $sum: "$draftCopy.draftCopies.totalCost" },
              isLaborTaxable: {
                $first: "$draftCopy.draftCopies.isLaborTaxable",
              },
            },
          },
          {
            $project: {
              _id: 0,
              jobType: "$_id",
              totalPrice: 1,
              isLaborTaxable: 1,
              dataType: "Labor",
            },
          },
        ]),
      ]);

    // 🧩 Merge only Labor material + Labor data
    const mergedData = [];

    (materialDataByJobType || []).forEach((mat) => {
      if (mat.source === "Labor") {
        const matchingLabor = (laborDataByJobType || []).find(
          (lab) => lab.jobType === mat.jobType
        );

        if (matchingLabor) {
          mergedData.push({
            jobType: mat.jobType,
            totalPrice: (mat.totalPrice || 0) + (matchingLabor.totalPrice || 0),
            isTaxable: mat.isTaxable || matchingLabor.isLaborTaxable || false,
            source: "Labor",
            dataType: "Merged",
          });
        } else {
          mergedData.push(mat);
        }
      } else {
        mergedData.push(mat);
      }
    });

    (laborDataByJobType || []).forEach((lab) => {
      const alreadyIncluded = mergedData.some(
        (item) => item.jobType === lab.jobType && item.source === "Labor"
      );
      if (!alreadyIncluded) {
        mergedData.push({
          jobType: lab.jobType,
          totalPrice: lab.totalPrice,
          isTaxable: lab.isLaborTaxable || false,
          source: "Labor",
          dataType: "Merged",
        });
      }
    });

    return res.send({
      statusCode: 200,
      success: true,
      message: "Field Copies retrieved successfully",
      result: {
        officeFieldCopies: officeCopiesData[0]?.activeOfficeCopies || [],
        materialData: materialDataByJobType,
        laborData: laborDataByJobType,
        mergedData, // ✅ merged result (Labor + Labor)
        officeDraftCopies: draftCopiesData[0]?.activeOfficeCopies || [],
        materialDraftData: materialDraftData,
        laborDraftData: laborDraftData,
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      statusCode: 500,
      success: false,
      message: err?.message || "Internal Server Error",
      result: {},
    });
  }
};

async function setDefaultStatus() {
  const result = await Project.updateMany(
    { lastCustomerCopyId: { $exists: false } }, // only update documents missing the field
    { $set: { lastCustomerCopyId: "" } }
  );
  console.log(`${result.modifiedCount} documents updated.`);
}

// setDefaultStatus();
