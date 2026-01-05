const Admin = require("../Model/adminModel");
const Staff = require("../../Staff/Model/staffModel");
const JobType = require("../../JobType/Model/jobTypeModel");
const Material = require("../../Material/Model/materialModel");
const CrewCategory = require("../../CrewCategory/Model/crewCategoryModel");
const Crew = require("../../CrewManagement/Model/crewModel");
const Project = require("../../Projects/Model/projectModel");
const TaxPercent = require("../../TaxPercent/Model/TaxPercentModel");
const Labor = require("../../LaborManagement/Model/LaborModel");

const bcrypt = require("bcryptjs");
const jwt = require("../../../middleware/jwt");
const validator = require("validator");
require("dotenv").config();

const generateOTP = require("../../../utils/generateOTP/generateOTP");
const sendEmail = require("../../../utils/nodemailer/sendEmail");

// Methods

const isValidEmail = (email) => {
  if (validator.isEmail(email)) {
    return true;
  }
  return false;
};

function isStrongPassword(password) {
  const options = {
    minLength: 8, // Minimum length
    minLowercase: 1, // Minimum number of lowercase letters
    minUppercase: 1, // Minimum number of uppercase letters
    minNumbers: 1, // Minimum number of digits
    minSymbols: 1, // Minimum number of special characters
    returnScore: false, // Return a score indicating the password strength (optional)
  };

  return validator.isStrongPassword(password, options);
}

// Controllers

// Admin side

exports.adminLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.toLowerCase()?.trim();

    if (!email) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Email is required",
        result: {},
      });
    }

    if (!password) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Password is required",
        result: {},
      });
    }

    let admin = await Admin.findOne({ email });

    if (!admin) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Admin not found",
        result: {},
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Invalid Password",
        result: {},
      });
    }

    const token = await jwt.generateAuthJwt({
      email: admin.email,
      _id: admin._id,
      expires_in: process.env.TOKEN_EXPIRES_IN,
    });

    return res.send({
      statusCode: 200,
      success: true,
      message: "Login successful",
      result: { token },
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

exports.forgetPassword = async (req, res) => {
  try {
    let { email } = req.body;
    email = email?.toLowerCase()?.trim();

    if (!email) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Email is required",
        result: {},
      });
    }

    if (!isValidEmail(email)) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Invalid Email",
        result: {},
      });
    }

    let admin = await Admin.findOne({ email });

    if (!admin) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Admin not found",
        result: {},
      });
    }

    // Generate and send password reset token
    const expiryTime = Date.now();
    const otp = generateOTP();

    admin.otp = otp;
    admin.otpExpiryTime = expiryTime + 600000; // 1 minutes

    let saveResult = await admin.save();

    if (saveResult) {
      // Send email with otp
      let subject = "OTP Password Reset";
      let html = `<body style="background-color: #f7fafc; margin: 0; padding: 0;">
  <div style="max-width: 24rem; margin: 2rem auto; padding: 1rem; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; text-align: center;">
    <h1 style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">F&amp;G</h1>
    <p style="color: #718096; margin-top: 0.5rem;">We received a request to verify your account with an OTP.</p>
    <p style="color: #718096; margin-top: 1rem;">Your OTP is:</p>
    <p style="font-size: 1.25rem; font-weight: bold; color: #3182ce; margin-top: 0.5rem;"> ${otp}</p>
    <p style="color: #718096; margin-top: 1rem;">If you did not request this, please ignore this email.</p>
  </div>
</body>`;

      await sendEmail(email, subject, html);

      return res.send({
        statusCode: 200,
        success: true,
        message: "OTP sent successfully",
        result: { otp },
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to send OTP",
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

exports.resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword, confirmPassword } = req.body;
    email = email.toLowerCase().trim();

    if (!isValidEmail(email)) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Invalid Email",
        result: {},
      });
    }

    if (!otp) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "OTP is required",
        result: {},
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "New Password and Confirm Password are required",
        result: {},
      });
    }

    if (otp.length < 5) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "OTP must be at least 5 characters",
        result: {},
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.send({
        statusCode: 400,
        success: false,
        message:
          "Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        result: {},
      });
    }

    if (newPassword !== confirmPassword) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Password and Confirm Password must match",
        result: {},
      });
    }

    otp = Number.parseInt(otp);

    let admin = await Admin.findOne({ email });

    if (!admin) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Admin not found",
        result: {},
      });
    }

    if (Date.now() > admin.otpExpiryTime) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "OTP has expired",
        result: {},
      });
    }

    console.log("OTP has expired", otp, admin.otp);

    if (otp !== admin.otp) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Invalid OTP",
        result: {},
      });
    }

    admin.password = bcrypt.hashSync(newPassword, 10);
    admin.otp = "";
    admin.otpExpiryTime = "";

    let savedAdmin = await admin.save();

    if (savedAdmin) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Password reset successfully",
        result: {},
      });
    }
  } catch (error) {
    return res.send({
      statusCode: 400,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

exports.changePassword = async (req, res) => {
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

    let { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Old Password is required",
        result: {},
      });
    }

    if (!newPassword) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "New Password is required",
        result: {},
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.send({
        statusCode: 400,
        success: false,
        message:
          "New Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        result: {},
      });
    }
    // Check whther the new password is same as the old password

    if (newPassword === oldPassword) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "New Password same as old password",
        result: {},
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);

    if (!isMatch) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Old Password is incorrect",
        result: {},
      });
    }

    admin.password = bcrypt.hashSync(newPassword, 10);

    let savedAdmin = await admin.save();

    if (savedAdmin) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Password changed successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to change password",
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

exports.getAllCounts = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({ _id: token._id }).lean();
    if (admin) {
      const [
        activeStaffs,
        blockStaffs,
        totalStaffs,
        deleteStaffs,
        ongoingProjects,
        completedProjects,
        bidProjects,
      ] = await Promise.all([
        Staff.countDocuments({ status: "Active" }).lean(),
        Staff.countDocuments({ status: "Block" }).lean(),
        Staff.countDocuments({ status: { $in: ["Active", "Block"] } }).lean(),
        Staff.countDocuments({ status: "Delete" }).lean(),
        Project.countDocuments({ status: "Ongoing" }).lean(),
        Project.countDocuments({ status: "Completed" }).lean(),
        Project.countDocuments({
          billingType: "Bid",
          status: { $ne: "Delete" },
        }).lean(),
      ]);

      const result = {
        activeStaffs,
        blockStaffs,
        totalStaffs,
        deleteStaffs,
        ongoingProjects,
        completedProjects,
        bidProjects,
      };
      return res.send({
        statusCode: 200,
        success: true,
        message: "Data Fetched Successfully.",
        result: result,
      });
    } else
      return res.send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
      });
  } catch (error) {
    return res.send({
      statusCode: 500,
      success: false,
      result: {},
      message: error.message || "Internal Server Error",
    });
  }
};

exports.updateFGAddress = async (req, res) => {
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

    let { fgAddress } = req.body;

    if (!fgAddress) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Address is required",
        result: {},
      });
    }

    admin.fgAddress = fgAddress;

    let savedAdmin = await admin.save();

    if (savedAdmin) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Address changed successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to change address",
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

exports.getFGAddress = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    });
    let admin = await Admin.findById(token._id);

    if (!staff && !admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized access",
        result: {},
      });
    }

    admin = await Admin.findOne();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Address fetched successfully",
      result: admin.fgAddress,
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

// Staff Side handle by admin

exports.addStaffMember = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { staffName, email, password } = req.body;
    staffName = staffName?.trim();
    email = email?.toLowerCase()?.trim();

    const plainTextPassword = password;

    if (!staffName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Staff Name is required",
        result: {},
      });
    }

    if (!email) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Email is required",
        result: {},
      });
    }

    if (!isValidEmail(email)) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Invalid Email",
        result: {},
      });
    }

    if (!password) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Password is required",
        result: {},
      });
    }

    if (!isStrongPassword(password)) {
      return res.send({
        statusCode: 400,
        success: false,
        message:
          "Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        result: {},
      });
    }

    password = bcrypt.hashSync(password, 10);

    // Is Staff already exist
    const staff = await Staff.findOne({ email });

    if (staff && staff?.status === "Delete") {
      staff.status = "Active";

      await staff.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Staff created successfully",
        result: staff,
      });
    }

    if (staff) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Staff with this email already exist",
        result: {},
      });
    }

    console.log("Requset Body", req.body);

    // Generate a unique staffId
    const staffId = await Staff.generateUniqueStaffId();

    console.log("StaffId");

    const newStaff = new Staff({
      staffId,
      staffName,
      email,
      password,
    });

    console.log("New staff", newStaff);

    const savedStaff = await newStaff.save();

    if (savedStaff) {
      let subject = "Staff Registration";
      let html1 = `<body style="background-color: #f7fafc; margin: 0; padding: 0;">
  <div style="max-width: 24rem; margin: 2rem auto; padding: 1rem; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; text-align: center;">
    <h1 style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">Welcome to F&amp;G</h1>
    <p style="color: #718096; margin-top: 0.5rem;">Dear ${staffName},</p>
    <p style="color: #718096; margin-top: 0.5rem;">We are pleased to inform you that your staff email and password have been set up for login. Below are your credentials:</p>
    
    <p style="font-weight: bold; margin-top: 1rem;">Email:</p>
    <p style="color: #3182ce; font-size: 1rem; margin-top: 0.5rem;">${email}</p>
    
    <p style="font-weight: bold; margin-top: 1rem;">Password:</p>
    <p style="color: #3182ce; font-size: 1rem; margin-top: 0.5rem;">${plainTextPassword}</p>
    
    <p style="color: #718096; margin-top: 1rem;">If you encounter any issues, feel free to contact our support team.</p>
  </div>
</body>`;
      let html2 = `<body style="background-color: #f7fafc; margin: 0; padding: 0;">
  <div style="max-width: 24rem; margin: 2rem auto; padding: 1rem; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; text-align: center;">
    <h1 style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">F&amp;G - New Staff Created</h1>
    <p style="color: #718096; margin-top: 0.5rem;">Dear Admin,</p>
    <p style="color: #718096; margin-top: 0.5rem;">You have successfully created a new staff account. Below are the details:</p>
    
    <p style="font-weight: bold; margin-top: 1rem;">Name:</p>
    <p style="color: #3182ce; font-size: 1rem; margin-top: 0.5rem;">${staffName}</p>
    
    <p style="font-weight: bold; margin-top: 1rem;">Email:</p>
    <p style="color: #3182ce; font-size: 1rem; margin-top: 0.5rem;">${email}</p>
    
    <p style="font-weight: bold; margin-top: 1rem;">Password:</p>
    <p style="color: #3182ce; font-size: 1rem; margin-top: 0.5rem;">${plainTextPassword}</p>
    
  </div>
</body>`;

      await sendEmail(email, subject, html1);
      await sendEmail(admin.email, subject, html2);

      return res.send({
        statusCode: 201,
        success: true,
        message: "Staff Member added successfully",
        result: savedStaff,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to add staff member",
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

exports.getStaffMembers = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { page, limit = 10, sortOrder, sortBy, search } = req.query;
    const skip = (page - 1) * limit;

    sortBy = sortBy ? sortBy : "staffName";
    sortOrder = Number.parseInt(sortOrder) || -1;

    console.log("Sort", sortBy, sortOrder);

    const query = {
      status: {
        $in: ["Active", "Block"],
      },
    };

    if (search) {
      query.$or = [
        { staffName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const staffMembers = await Staff.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // if (staffMembers.length === 0) {
    //   return res.send({
    //     statusCode: 200,
    //     success: true,
    //     message: "No staff members found",
    //     result: {},
    //   });
    // }

    const totalRecords = await Staff.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Staff members fetched successfully",
      result: {
        staffMembers,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.getActiveStaffMembers = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { page, limit = 10, sortOrder, sortBy, search } = req.query;
    const skip = (page - 1) * limit;

    sortBy = sortBy ? sortBy : "staffName";
    sortOrder = Number.parseInt(sortOrder) || -1;

    const query = {
      status: {
        $in: ["Active"],
      },
    };

    if (search) {
      query.$or = [
        { staffName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const staffMembers = await Staff.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // if (staffMembers.length === 0) {
    //   return res.send({
    //     statusCode: 200,
    //     success: true,
    //     message: "No staff members found",
    //     result: {},
    //   });
    // }

    const totalRecords = await Staff.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Active Staff members fetched successfully",
      result: {
        staffMembers,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.getBlockedStaffMembers = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { page, limit = 10, sortOrder, sortBy, search } = req.query;
    const skip = (page - 1) * limit;

    sortBy = sortBy ? sortBy : "staffName";
    sortOrder = Number.parseInt(sortOrder) || -1;

    const query = {
      status: {
        $in: ["Block"],
      },
    };

    if (search) {
      query.$or = [
        { staffName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const staffMembers = await Staff.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // if (staffMembers.length === 0) {
    //   return res.send({
    //     statusCode: 200,
    //     success: true,
    //     message: "No staff members found",
    //     result: {},
    //   });
    // }

    const totalRecords = await Staff.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Blocked staff members fetched successfully",
      result: {
        staffMembers,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.getStaffById = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { staffId } = req.params;

    if (!staffId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Staff ID is required",
        result: {},
      });
    }

    console.log("Staff Id", staffId);

    const staff = await Staff.findById(staffId).lean();

    if (!staff) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Staff member not found",
        result: {},
      });
    }

    console.log(staff);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Staff member fetched successfully",
      result: staff,
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

exports.editStaffMember = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized admin",
        result: {},
      });
    }

    let { staffName, email, password, status } = req.body;
    const { staffId } = req.params;

    if (!staffId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Staff id is required",
        result: {},
      });
    }

    let staff = await Staff.findById(staffId);

    if (!staff) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Staff member not found",
        result: {},
      });
    }

    if (req.body && email) {
      email = email.toLowerCase().trim();
      // const existingStaff = await Staff.findOne({ email });
      // if (existingStaff) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Staff with this email already exist",
      //     result: {},
      //   });
      // }
      if (!isValidEmail(email)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid email",
          result: {},
        });
      }
      staff.email = email;
    }

    if (req.body && password) {
      if (!isStrongPassword(password)) {
        return res.send({
          statusCode: 400,
          success: false,
          message:
            "Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          result: {},
        });
      }
      console.log("Password", password);
      password = bcrypt.hashSync(password, 10);
      staff.password = password;
    }

    if (req.body && staffName) {
      staff.staffName = staffName;
    }

    if (req.body && status) {
      if (!["Active", "Block", "Delete"].includes(status)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid status. Use 'Active', 'Block' or 'Delete'",
          result: {},
        });
      }
      staff.status = status;
    }

    const updatedStaff = await staff.save();

    if (updatedStaff) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Staff member updated successfully",
        result: updatedStaff,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update staff member",
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

exports.handleStaffStatus = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { staffId } = req.params;
    const { status } = req.body;

    if (!staffId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Staff ID is required",
        result: {},
      });
    }

    if (!status) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Status is required",
        result: {},
      });
    }

    if (!["Active", "Block", "Delete"].includes(status)) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Invalid status. Use 'Active', 'Block', or 'Delete'",
        result: {},
      });
    }

    let staff = await Staff.findById(staffId);

    if (!staff) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Staff Member not found",
        result: {},
      });
    }

    staff.status = status;

    const updatedStaff = await staff.save();

    if (updatedStaff) {
      return res.send({
        statusCode: 200,
        success: true,
        message: `Staff Member status updated to ${status}`,
        result: updatedStaff,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update staff member status",
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

exports.searchAllStaffByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    if (!admin) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
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
        $in: ["Active", "Block"],
      },
    };
    if (term) {
      filter = {
        status: {
          $in: ["Active", "Block"],
        },
        $or: [
          { staffName: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
        ],
      };
    }

    // Fetch the notifications with pagination and search filter
    const staffMembers = await Staff.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(filter);

    // Get the total count of notifications
    const totalCount = await Staff.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Staff fetched successfully.",
      result: {
        staffMembers,
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

exports.searchActiveStaffByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    if (!admin) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
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
          { staffName: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
        ],
      };
    }

    // Fetch the notifications with pagination and search filter
    const staffMembers = await Staff.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get the total count of notifications
    const totalCount = await Staff.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Staffs fetched successfully.",
      result: {
        staffMembers,
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

exports.searchBlockedStaffByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    if (!admin) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
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
        $in: ["Block"],
      },
    };
    if (term) {
      filter = {
        status: {
          $in: ["Block"],
        },
        $or: [
          { staffName: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
        ],
      };
    }

    // Fetch the notifications with pagination and search filter
    const staffMembers = await Staff.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get the total count of notifications
    const totalCount = await Staff.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Staff fetched successfully.",
      result: {
        staffMembers,
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

// Job Types Management

exports.addJobType = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { jobName } = req.body;

    if (!jobName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Name is required",
        result: {},
      });
    }

    const existingJobType = await JobType.findOne({ jobName });

    if (existingJobType && existingJobType?.status === "Delete") {
      existingJobType.status = "Active";

      await existingJobType.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Job Type created successfully",
        result: {},
      });
    }

    if (existingJobType) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Type with this name already exist",
        result: {},
      });
    }

    const jobType = new JobType({ jobName });

    const savedJobType = await jobType.save();

    if (savedJobType) {
      return res.send({
        statusCode: 201,
        success: true,
        message: "Job Type added successfully",
        result: savedJobType,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to add job type",
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

exports.getJobTypeById = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
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

exports.getAllJobTypes = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { page, limit = 10, sortOrder, sortBy, search } = req.query;
    const skip = (page - 1) * limit;

    sortBy = sortBy ? sortBy : "jobName";
    sortOrder = Number.parseInt(sortOrder) || -1;

    const query = {
      status: "Active",
    };

    if (search) {
      query.$or = [{ jobName: { $regex: search, $options: "i" } }];
    }

    const jobTypes = await JobType.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalRecords = await JobType.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Job Types fetched successfully",
      result: {
        jobTypes,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.getAllJobTypesDpd = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();
    const admin = await Admin.findOne({ _id: token._id });

    if (!staff && !admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        result: {},
      });
    }

    const jobTypes = await JobType.find({}).sort({ jobName: 1 }).lean();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Job Types fetched successfully",
      result: jobTypes,
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

exports.editJobType = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { jobName, status } = req.body;
    const { jobId } = req.params;

    if (!jobId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job ID is required",
        result: {},
      });
    }

    let jobType = await JobType.findById(jobId);

    if (!jobType) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Job Type not found",
        result: {},
      });
    }

    console.log(req.body);

    if (req.body && jobName) {
      jobType.jobName = jobName;
      // const isJobTypeExist = await JobType.findOne({
      //   jobName,
      // });

      // if (isJobTypeExist) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Job Type with this name already exist",
      //     result: {},
      //   });
      // }
    }

    if (req.body && status) {
      if (!["Active", "Delete"].includes(status)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid status. Use 'Active' or 'Delete'",
          result: {},
        });
      }
      if (status === "Delete") {
        // Deleting Labor and crews
        const labors = await Labor.distinct("_id", { jobType: jobType._id });
        await Labor.updateMany(
          { jobType: jobType._id },
          {
            $set: {
              status: "Delete",
            },
          }
        );
        await Crew.updateMany(
          { labor: { $in: labors } },
          {
            $set: {
              status: "Delete",
            },
          }
        );
        // Deleting material
        await Material.updateMany(
          { description: jobType.jobName },
          {
            $set: {
              status: "Delete",
            },
          }
        );
      }

      jobType.status = status;
    }

    const updatedJobType = await jobType.save();

    if (updatedJobType) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Job Type updated successfully",
        result: updatedJobType,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update staff member",
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

exports.searchJobTypeByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    if (!admin) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
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
      status: "Active",
    };
    if (term) {
      filter = {
        status: {
          $in: ["Active"],
        },
        $or: [{ jobName: { $regex: term, $options: "i" } }],
      };
    }

    // Fetch the notifications with pagination and search filter
    const jobTypes = await JobType.find(filter).skip(skip).limit(limit);

    // Get the total count of notifications
    const totalCount = await JobType.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Job Type fetched successfully.",
      result: {
        jobTypes,
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

// Updated APIs for job types

exports.addJobType = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { jobName, price, isTaxable } = req.body;
    jobName = jobName?.trim();

    if (!jobName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Name is required",
        result: {},
      });
    }

    if (!price) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Price is required",
        result: {},
      });
    }

    price = Number.parseFloat(price);

    if (typeof isTaxable === "undefined") {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Taxable status is required",
        result: {},
      });
    }

    const existingJobType = await JobType.findOne({ jobName });

    if (existingJobType && existingJobType?.status === "Delete") {
      existingJobType.jobName = jobName;
      existingJobType.price = price;
      existingJobType.isTaxable = isTaxable;
      existingJobType.status = "Active";

      await existingJobType.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Job Type created successfully",
        result: {},
      });
    }

    if (existingJobType) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Type with this name already exist",
        result: {},
      });
    }

    const jobType = new JobType({
      jobName,
      price,
      isTaxable: isTaxable === "true" ? true : false,
    });

    const savedJobType = await jobType.save();

    if (savedJobType) {
      return res.send({
        statusCode: 201,
        success: true,
        message: "Job Type added successfully",
        result: savedJobType,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to add job type",
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

exports.editJobType = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { jobName, price, isTaxable, status } = req.body;
    jobName = jobName?.trim();
    const { jobId } = req.params;

    if (!jobId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job ID is required",
        result: {},
      });
    }

    let jobType = await JobType.findById(jobId);

    if (!jobType) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Job Type not found",
        result: {},
      });
    }

    if (req.body && jobName) {
      const isJobTypeExist = await JobType.findOne({
        jobName,
        _id: { $ne: jobId },
      });

      if (isJobTypeExist && isJobTypeExist.status === "Delete") {
        await JobType.deleteMany({ jobName });
      }

      if (isJobTypeExist && isJobTypeExist.status === "Active") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Job Type with this name already exist",
          result: {},
        });
      }
      jobType.jobName = jobName;
    }

    if (req.body && price) {
      jobType.price = Number.parseFloat(price);
      if (jobType.price < 0) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Price should be a positive number",
          result: {},
        });
      }
    }

    if (req.body && isTaxable) {
      jobType.isTaxable = isTaxable === "true" ? true : false;
    }

    if (req.body && status) {
      if (!["Active", "Delete"].includes(status)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid status. Use 'Active' or 'Delete'",
          result: {},
        });
      }
      // if (status === "Delete") {
      //   // Deleting Labor and crews
      //   const labors = await Labor.distinct("_id", { jobType: jobType._id });
      //   await Labor.updateMany(
      //     { jobType: jobType._id },
      //     {
      //       $set: {
      //         status: "Delete",
      //       },
      //     }
      //   );
      //   await Crew.updateMany(
      //     { labor: { $in: labors } },
      //     {
      //       $set: {
      //         status: "Delete",
      //       },
      //     }
      //   );
      //   // Deleting material
      //   await Material.updateMany(
      //     { description: jobType.jobName },
      //     {
      //       $set: {
      //         status: "Delete",
      //       },
      //     }
      //   );
      // }

      jobType.status = status;
    }

    const updatedJobType = await jobType.save();

    if (updatedJobType) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Job Type updated successfully",
        result: updatedJobType,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update staff member",
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

// Material Management By Admin

exports.addMaterial = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { name, description="", measure, price,cost,markup, isTaxable } = req.body;

    if (!name) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Material Name is required",
        result: {},
      });
    }

    // if (!description) {
    //   return res.send({
    //     statusCode: 400,
    //     success: false,
    //     message: "Description is required",
    //     result: {},
    //   });
    // }

    if (!measure) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Measure is required",
        result: {},
      });
    }

    if (!price) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Price is required",
        result: {},
      });
    }

    if(!cost){
      return res.send({
        statusCode: 400,
        success: false,
        message: "Cost is required",
        result: {},
      });
    }
    if(!markup){
      return res.send({
        statusCode: 400,  
        success: false,
        message: "Markup is required",
        result: {},
      });
    }

    price = Number.parseFloat(price);

   // Validate
if (
  !["True", "False", "true", "false", true, false].includes(isTaxable)
) {
  return res.send({
    statusCode: 400,
    success: false,
    message: "Invalid Taxable status. Use true or false",
    result: {},
  });
}

// Normalize to Boolean
isTaxable =
  isTaxable === true ||
  isTaxable === "True" ||
  isTaxable === "true";



  
    const existingMaterial = await Material.findOne({ name });

    if (existingMaterial && existingMaterial?.status === "Delete") {
      existingMaterial.name = name;
      existingMaterial.description = description ? description : "";
      existingMaterial.measure = measure;
      existingMaterial.price = price;
      existingMaterial.cost = cost;
      existingMaterial.markUp = markup;
      existingMaterial.isTaxable = isTaxable;
      existingMaterial.status = "Active";
      await existingMaterial.save();

      return res.send({
        statusCode: 201,
        message: "Material reactivated successfully",
        success: true,
        result: {},
      });
    }

    if (existingMaterial) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Material name with this name already exist",
        result: {},
      });
    }

    const newMaterial = new Material({
      name,
      description: description,
      measure,
      price,
      cost,
      markUp:markup,
      isTaxable,
    });

    const savedMaterial = await newMaterial.save();

    if (savedMaterial) {
      return res.send({
        statusCode: 201,
        success: true,
        message: "Material added successfully",
        result: savedMaterial,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to add material",
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

exports.getMaterialById = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { materialId } = req.params;

    if (!materialId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Material ID is required",
        result: {},
      });
    }

    const material = await Material.findById(materialId).lean();

    if (!material) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Material not found",
        result: {},
      });
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Material fetched successfully",
      result: material,
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

exports.getAllMaterials = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { page, limit = 10, sortOrder, sortBy, search } = req.query;
    const skip = (page - 1) * limit;

    sortBy = sortBy || "name";
    sortOrder = Number.parseInt(sortOrder) || -1;

    const query = { status: "Active" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { measure: { $regex: search, $options: "i" } },
      ];
    }

    const materials = await Material.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalRecords = await Material.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Materials fetched successfully",
      result: {
        materials,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.editMaterial = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { name, description, measure, price,cost, markup, status, isTaxable } = req.body;
    const { materialId } = req.params;

    if (!materialId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job ID is required",
        result: {},
      });
    }

    let material = await Material.findById(materialId);

    if (!material) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Job Type not found",
        result: {},
      });
    }

    if (req.body && name) {
      const isMaterialExist = await Material.findOne({
        name,
        _id: { $ne: materialId },
      });

      if (isMaterialExist && isMaterialExist.status === "Delete") {
        await Material.deleteMany({
          name: name,
        });
      }

      if (isMaterialExist && isMaterialExist.status === "Active") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Material name with this name already exist",
          result: {},
        });
      }

      material.name = name;
    }

    if ((req.body && description) || req.body?.description) {
      material.description = description;
    }

    if (req.body && measure) {
      material.measure = measure;
    }
    if (req.body && cost ) {
      material.cost = cost;
    }
    if(req.body && markup) {
      material.markUp = markup
    }

    if (req.body && price) {
      price = Number.parseFloat(price);
      if (price < 0) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Price cannot be negative",
          result: {},
        });
      }
      material.price = price;
    }
    

    material.isTaxable = isTaxable || material.isTaxable;

    if (req.body && status) {
      if (!["Active", "Delete"].includes(status)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid status. Use 'Active' or 'Delete'",
          result: {},
        });
      }
      material.status = status;
    
    }
    

    const updatedMaterial = await material.save();

    if (updatedMaterial) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Material updated successfully",
        result: updatedMaterial,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update material",
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

exports.searchMaterialByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    if (!admin) {
      return res.send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
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
      status: "Active",
    };
    if (term) {
      filter = {
        status: {
          $in: ["Active"],
        },
        $or: [{ name: { $regex: term, $options: "i" } }],
      };
    }

    // Fetch the notifications with pagination and search filter
    const materials = await Material.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    // Get the total count of notifications
    const totalCount = await Material.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Materials fetched successfully.",
      result: {
        materials,
        totalRecords: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (e) {
    console.error("Error :", e);
    return res.send({
      statusCode: 500,
      success: false,
      result: {},
      message: e.message || "Internal Server Error",
    });
  }
};

// Labor Management

exports.addNewLabor = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { jobTypeId, price, isTaxable } = req.body;

    if (!jobTypeId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Job Type Id is required",
        result: {},
      });
    }

    const jobType = await JobType.findOne({ _id: jobTypeId, status: "Active" });

    if (!jobType) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Job Type not found",
        result: {},
      });
    }

    if (!price) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Price is required",
        result: {},
      });
    }

    price = Number.parseFloat(price);

    const isLaborExist = await Labor.findOne({ jobType: jobTypeId });

    if (isLaborExist && isLaborExist?.status === "Delete") {
      isLaborExist.status = "Active";

      await isLaborExist.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Labor created successfully",
        result: {},
      });
    }

    if (isLaborExist) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Labor already exist",
        result: {},
      });
    }

    const newLabor = new Labor({
      jobName: jobType.jobName,
      jobType: jobTypeId,
      price,
      isTaxable: isTaxable ? isTaxable : false,
    });

    const savedLabor = await newLabor.save();

    if (savedLabor) {
      return res.send({
        statusCode: 201,
        success: true,
        message: "Labor added successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to add crew category",
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

exports.getLaborById = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { laborId } = req.params;

    if (!laborId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Labor ID is required",
        result: {},
      });
    }

    const labor = await Labor.findById(laborId).lean();

    if (!labor) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "labor not found",
        result: {},
      });
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Labor fetched successfully",
      result: labor,
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

exports.getAllLabors = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { page, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let labors = await Labor.find({ status: "Active" })
      .populate("jobType", "jobName _id")
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("Labours populated", labors);

    labors = labors.map((labor) => {
      return {
        _id: labor._id,
        price: labor.price,
        isTaxable: labor.isTaxable,
        jobType: labor.jobType.jobName,
        status: labor.status,
      };
    });

    const totalRecords = await Labor.countDocuments({
      status: "Active",
    });
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Labors fetched successfully",
      result: {
        labors,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.getAllLaborDpd = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();
    const staff = await Staff.findOne({ _id: token._id, status: "Active" });

    if (!admin && !staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        result: {},
      });
    }

    let labors = await Labor.find({
      // status: "Active",
      // jobName: { $nin: ["Project Manager", "Foreman"] },
    })
      .populate("jobType", "jobName _id")
      .lean();

    labors = labors.map((labor) => {
      return {
        _id: labor._id,
        price: labor.price,
        isTaxable: labor.isTaxable,
        jobType: labor.jobType._id,
        jobName: labor.jobType.jobName,
        measure: labor.measure,
        status: labor.status,
      };
    });

    return res.send({
      statusCode: 200,
      success: true,
      message: "Labors fetched successfully",
      result: labors,
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

exports.editLabor = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { jobTypeId, price, isTaxable, status } = req.body;
    const { laborId } = req.params;

    if (!laborId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Labor Id is required",
        result: {},
      });
    }

    let labor = await Labor.findById(laborId);

    if (!labor) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Labor not found",
        result: {},
      });
    }

    if (req.body && jobTypeId) {
      if (jobTypeId.trim() === "") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Job Type Id is required",
          result: {},
        });
      }

      const jobType = await JobType.findOne({
        _id: req.body.jobTypeId,
        status: "Active",
      });

      if (!jobType) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid job type",
          result: {},
        });
      }

      const isLaborExist = await Labor.findOne({
        $and: [
          { jobType: req.body.jobTypeId }, // Check if jobType matches the jobTypeId
          { jobType: { $ne: labor.jobType } }, // Ensure it's not equal to the existing labor's jobType
        ],
      });

      if (isLaborExist && isLaborExist.status === "Delete") {
        await Labor.deleteOne({ _id: isLaborExist._id });
      }

      if (isLaborExist && isLaborExist.status === "Active") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Labor already exist",
          result: {},
        });
      }

      labor.jobType = jobTypeId;
      labor.jobName = jobType.jobName;
    }

    if (req.body && price) {
      price = Number.parseFloat(price);
      if (isNaN(price)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid price. Please provide a valid number",
          result: {},
        });
      }
      labor.price = price;
    }

    if (req.body && isTaxable) {
      labor.isTaxable = isTaxable;
    }

    if (req.body && status) {
      if (!["Active", "Delete"].includes(status)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid status. Use 'Active' or 'Delete'",
          result: {},
        });
      }
      if (status === "Delete") {
        await Crew.updateMany(
          { labor: labor._id },
          {
            $set: {
              status: "Delete",
            },
          },
          {
            new: true,
          }
        );
      }
      labor.status = status;
    }

    const updatedLabor = await labor.save();

    if (updatedLabor) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Labor updated successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update labor",
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

exports.searchLaborByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    if (!admin) {
      return res.send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
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
      status: "Active",
    };
    if (term) {
      filter = {
        status: {
          $in: ["Active"],
        },
        $or: [{ jobName: { $regex: term, $options: "i" } }],
      };
    }

    // Fetch the notifications with pagination and search filter
    let labors = await Labor.find(filter)
      .populate("jobType", "jobName _id")
      .skip(skip)
      .limit(limit)
      .lean();

    labors = labors.map((labor) => {
      return {
        _id: labor._id,
        price: labor.price,
        isTaxable: labor.isTaxable,
        jobType: labor.jobType.jobName,
        status: labor.status,
      };
    });

    // Get the total count of notifications
    const totalCount = await Labor.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Labors fetched successfully.",
      result: {
        labors,
        totalRecords: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (e) {
    console.error("Error :", e);
    return res.send({
      statusCode: 500,
      success: false,
      result: {},
      message: e.message || "Internal Server Error",
    });
  }
};

// Crew Category

exports.addCrewCategory = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { crewCategoryName } = req.body;

    if (!crewCategoryName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Crew Category Name is required",
        result: {},
      });
    }

    const existingCategory = await CrewCategory.findOne({ crewCategoryName });

    if (existingCategory && existingCategory?.status === "Delete") {
      existingCategory.status = "Active";

      await existingCategory.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Crew category added successfully",
        result: {},
      });
    }

    if (existingCategory) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Crew Category name with this name already exist",
        result: {},
      });
    }

    const newCrewCategory = new CrewCategory({ crewCategoryName });

    const savedCrewCategory = await newCrewCategory.save();

    if (savedCrewCategory) {
      return res.send({
        statusCode: 201,
        success: true,
        message: "Crew category added successfully",
        result: savedCrewCategory,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to add crew category",
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

exports.getCrewCategoryById = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { categoryId } = req.params;

    if (!categoryId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Category ID is required",
        result: {},
      });
    }

    const crewCategory = await CrewCategory.findById(categoryId).lean();

    if (!crewCategory) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Crew Category not found",
        result: {},
      });
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crew Category fetched successfully",
      result: crewCategory,
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

exports.getAllCrewCategory = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { page, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const crewCategories = await CrewCategory.find({ status: "Active" })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(crewCategories);

    const totalRecords = await CrewCategory.countDocuments({
      status: "Active",
    });
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crew's Category fetched successfully",
      result: {
        crewCategories,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.getAllCrewCategoriesDpd = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        result: {},
      });
    }

    const crewCategories = await CrewCategory.find({ status: "Active" }).lean();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Categories fetched successfully",
      result: crewCategories,
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

exports.getAllCrewCategories = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Access",
        result: {},
      });
    }

    const crewCategories = await CrewCategory.find({
      crewCategoryName: "Foreman",
    }).lean();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Categories fetched successfully",
      result: crewCategories,
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

exports.editCrewCategory = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { crewCategoryName, status } = req.body;
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Category ID is required",
        result: {},
      });
    }

    let crewCategory = await CrewCategory.findById(categoryId);

    if (!crewCategory) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Crew category not found",
        result: {},
      });
    }

    if (req.body && crewCategoryName) {
      crewCategory.crewCategoryName = crewCategoryName;
      // const isCategoryExist = await CrewCategory.findOne({ crewCategoryName });
      // if (isCategoryExist) {
      //   return res.send({
      //     statusCode: 400,
      //     success: false,
      //     message: "Crew Category name with this name already exist",
      //     result: {},
      //   });
      // }
    }

    if (req.body && status) {
      if (!["Active", "Delete"].includes(status)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid status. Use 'Active' or 'Delete'",
          result: {},
        });
      }
      crewCategory.status = status;
    }

    const updatedCategory = await crewCategory.save();

    if (updatedCategory) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Category updated successfully",
        result: updatedCategory,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update category",
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

// Crew Management

exports.addCrew = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { crewName } = req.body;

    if (!crewName) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Crew Name is required",
        result: {},
      });
    }

    // if (!labor) {
    //   return res.send({
    //     statusCode: 400,
    //     success: false,
    //     message: "labor is required",
    //     result: {},
    //   });
    // }

    const existingCrew = await Crew.findOne({ crewName });

    if (existingCrew && existingCrew?.status === "Delete") {
      existingCrew.status = "Active";
      await existingCrew.save();

      return res.send({
        statusCode: 201,
        success: true,
        message: "Crew added successfully",
        result: {},
      });
    }

    if (existingCrew) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Crew already exist",
        result: {},
      });
    }

    const newCrew = new Crew({ crewName });

    const savedCrew = await newCrew.save();

    if (savedCrew) {
      return res.send({
        statusCode: 201,
        success: true,
        message: "Crew added successfully",
        result: savedCrew,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to add crew category",
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

exports.getCrewById = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { crewId } = req.params;

    if (!crewId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Crew ID is required",
        result: {},
      });
    }

    const crew = await Crew.findById(crewId).lean();

    if (!crew) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Crew not found",
        result: {},
      });
    }

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crew fetched successfully",
      result: crew,
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

exports.getAllCrew = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { page, limit = 10, sortOrder, sortBy, search } = req.query;
    const skip = (page - 1) * limit;

    sortBy = sortBy ? sortBy : "crewName";
    sortOrder = Number.parseInt(sortOrder) || -1;

    const query = { status: "Active" };

    if (search) {
      query.$or = [{ crewName: { $regex: search, $options: "i" } }];
    }

    const crews = await Crew.find(query)
      // .populate("labor")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // if (crews.length === 0) {
    //   return res.send({
    //     statusCode: 200,
    //     success: true,
    //     message: "No crews found",
    //     result: {},
    //   });
    // }

    const totalRecords = await Crew.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crews fetched successfully",
      result: {
        crews,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.getAllDeletedCrews = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { page, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const crews = await Crew.find({ status: "Delete" })
      // .populate("labor")
      .skip(skip)
      .limit(limit)
      .lean();

    // if (crews.length === 0) {
    //   return res.send({
    //     statusCode: 200,
    //     success: true,
    //     message: "No crews found",
    //     result: {},
    //   });
    // }

    const totalRecords = await Crew.countDocuments({ status: "Delete" });
    const totalPages = Math.ceil(totalRecords / limit);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crews fetched successfully",
      result: {
        crews,
        totalPages,
        currentPage: page,
        totalRecords,
      },
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

exports.getAllCrewsDpdForForeman = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized staff",
        result: {},
      });
    }

    // let crews = await Crew.find({}).lean().populate("labor");
    let crews = await Crew.find({}).lean();

    crews = crews
      .filter((crew) => {
        return crew?.labor?.jobName === "Foreman";
      })
      .map((crew) => {
        return {
          _id: crew._id,
          crewName: crew.crewName,
          status: crew.status,
        };
      });

    console.log("Crews", crews);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crews fetched successfully",
      result: crews,
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

exports.getAllCrewsDpdForProjectManager = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized staff",
        result: {},
      });
    }

    let crews = await Crew.find({}).lean();

    crews = crews
      .filter((crew) => {
        return crew?.labor?.jobName === "Project Manager";
      })
      .map((crew) => {
        return {
          _id: crew._id,
          crewName: crew.crewName,
          labor: crew.labor._id,
          status: crew.status,
        };
      });

    console.log("Crews", crews);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crews fetched successfully",
      result: crews,
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

exports.getAllCrewsDpd = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id: token._id,
      status: "Active",
    }).lean();

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized staff",
        result: {},
      });
    }

    // const projectManager = await Labor.findOne({
    //   jobName: "Project Manager",
    // }).select("_id");

    // const foreman = await Labor.findOne({
    //   jobName: "Foreman",
    // }).select("_id");

    // const Ids = [projectManager, foreman];

    // let crews = await Crew.find({ labor: { $nin: Ids } })
    //   .populate("labor")
    //   .lean();
    let crews = await Crew.find({}).sort({crewName : 1}).lean();

    // crews = crews.map((crew) => {
    //   return {
    //     _id: crew._id,
    //     crewName: crew.crewName,
    //     labor: crew.labor._id,
    //     status: crew.status,
    //   };
    // });

    // console.log("Crews", crews);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crews fetched successfully",
      result: crews,
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

exports.editCrew = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { crewName, status } = req.body;
    const { crewId } = req.params;

    if (!crewId) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Crew ID is required",
        result: {},
      });
    }

    let crew = await Crew.findById(crewId);

    if (!crew) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Crew not found",
        result: {},
      });
    }

    if (req.body && crewName) {
      const isCrewExist = await Crew.findOne({
        crewName: crewName,
        _id: { $ne: crewId },
      });

      if (isCrewExist && isCrewExist.status === "Delete") {
        await Crew.deleteMany({ crewName });
      }

      if (isCrewExist && isCrewExist.status === "Active") {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Crew with this name already exist",
          result: {},
        });
      }

      crew.crewName = crewName;
    }

    // if (req.body && labor) {
    //   const isLaborExist = await Labor.findOne({
    //     _id: labor,
    //     status: "Active",
    //   });
    //   if (!isLaborExist) {
    //     return res.send({
    //       statusCode: "404",
    //       success: true,
    //       message: "Labor not found",
    //       result: {},
    //     });
    //   }
    //   crew.labor = labor;
    //   // const isCrewExist = await Crew.findOne({ crewName, crewCategory });
    //   // if (isCrewExist) {
    //   //   return res.send({
    //   //     statusCode: 400,
    //   //     success: false,
    //   //     message: "Crew already exist",
    //   //     result: {},
    //   //   });
    //   // }
    // }

    if (req.body && status) {
      if (!["Active", "Delete"].includes(status)) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid status. Use 'Active' or 'Delete'",
          result: {},
        });
      }
      crew.status = status;
    }

    const updatedCrew = await crew.save();

    if (updatedCrew) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Crew updated successfully",
        result: updatedCrew,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update crew",
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

exports.searchCrewByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    if (!admin) {
      return res.send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
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
      status: "Active",
    };
    if (term) {
      filter = {
        status: {
          $in: ["Active"],
        },
        $or: [{ crewName: { $regex: term, $options: "i" } }],
      };
    }

    // Fetch the notifications with pagination and search filter
    const crews = await Crew.find(filter)
      // .populate("labor")
      .skip(skip)
      .limit(limit)
      .lean();

    // Get the total count of notifications
    const totalCount = await Crew.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crews fetched successfully.",
      result: {
        crews,
        totalRecords: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (e) {
    console.error("Error :", e);
    return res.send({
      statusCode: 500,
      success: false,
      result: {},
      message: e.message || "Internal Server Error",
    });
  }
};

exports.searchCrewWithoutCategoryByTerm = async (req, res) => {
  try {
    let token = req.token;
    let admin = await Admin.findOne({
      _id: token._id,
    }).lean();
    if (!admin) {
      return res.send({
        statusCode: 404,
        success: false,
        result: {},
        message: "Unauthorized Admin!",
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
      status: "Delete",
    };
    if (term) {
      filter = {
        status: {
          $in: ["Delete"],
        },
        $or: [{ crewName: { $regex: term, $options: "i" } }],
      };
    }

    // Fetch the notifications with pagination and search filter
    const crews = await Crew.find(filter)
      .populate("labor")
      .skip(skip)
      .limit(limit)
      .lean();

    // Get the total count of notifications
    const totalCount = await Crew.countDocuments(filter);

    return res.send({
      statusCode: 200,
      success: true,
      message: "Crews fetched successfully.",
      result: {
        crews,
        totalRecords: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (e) {
    console.error("Error :", e);
    return res.send({
      statusCode: 500,
      success: false,
      result: {},
      message: e.message || "Internal Server Error",
    });
  }
};

// Get Projects

// exports.getAllProjects = async (req, res) => {
//   try {
//     const token = req.token;
//     const admin = await Admin.findById(token._id).lean();

//     if (!admin) {
//       return res.send({
//         statusCode: 401,
//         success: false,
//         message: "Unauthorized Admin",
//         result: {},
//       });
//     }

//     const { page = 1, limit = 10 } = req.query;
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);
//     const skip = (pageNumber - 1) * limitNumber;

//     const totalProjects = await Project.countDocuments({
//       status: {
//         $in: ["Active", "Completed", "Ongoing"],
//       },
//     });
//     const projects = await Project.find({
//       status: {
//         $in: ["Active", "Completed", "Ongoing"],
//       },
//     })
//       .populate("crew crewCategory staffId")
//       .skip(skip)
//       .limit(limitNumber)
//       .lean()
//       .sort({ createdAt: -1 });

//     return res.send({
//       statusCode: 200,
//       success: true,
//       message: "Projects fetched successfully",
//       result: {
//         projects,
//         currentPage: pageNumber,
//         totalPages: Math.ceil(totalProjects / limitNumber),
//         totalRecords: totalProjects,
//       },
//     });
//   } catch (err) {
//     return res.send({
//       statusCode: 500,
//       success: false,
//       message: err.message || "Internal Server Error",
//       result: {},
//     });
//   }
// };

exports.getAllRecentProjects = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    const { startDate = "", endDate = "" } = req.body;

    let filter = {
      status: {
        $in: ["Active", "Completed", "Ongoing"],
      },
    };

    if (startDate && endDate && startDate !== endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.send({
          statusCode: 400,
          success: false,
          message: "Invalid date format",
          result: {},
        });
      }

      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    const projects = await Project.find(filter)
      .populate("crew foreman staffId")
      .lean()
      .sort({ createdAt: -1 });

    return res.send({
      statusCode: 200,
      success: true,
      message: "Projects fetched successfully",
      result: {
        projects,
        totalRecords: projects.length,
      },
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

exports.editTaxPercent = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let { taxPercent } = req.body;

    let tax = await TaxPercent.findOne();

    if (!tax) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Tax not found",
        result: {},
      });
    }

    tax.taxPercent = taxPercent;

    const savedTax = await tax.save();

    if (savedTax) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Tax updated successfully",
        result: savedTax,
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to update material",
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

exports.getTaxPercentAdmin = async (req, res) => {
  try {
    const token = req.token;
    const admin = await Admin.findById(token._id).lean();

    if (!admin) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized Admin",
        result: {},
      });
    }

    let tax = await TaxPercent.findOne();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Projects fetched successfully",
      result: tax,
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
