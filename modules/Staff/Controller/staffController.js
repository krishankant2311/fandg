const Staff = require("../Model/staffModel");
const TaxPercent = require("../../TaxPercent/Model/TaxPercentModel")

const bcrypt = require("bcryptjs");
const jwt = require("../../../middleware/jwt");
const validator = require("validator");
require("dotenv").config()

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

exports.staffLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.toLowerCase()?.trim();

    if (!email) {
      return res.status(400).send({
        statusCode: 400,
        success: false,
        message: "Email is required",
        result: {},
      });
    }

    if (!password) {
      return res.status(400).send({
        statusCode: 400,
        success: false,
        message: "Password is required",
        result: {},
      });
    }

    let staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(404).send({
        statusCode: 404,
        success: false,
        message: "Staff not found",
        result: {},
      });
    }else if(staff.status === "Block"){
      return res.send({
        statusCode: 403,
        success: false,
        message: "Your account has been blocked",
        result: {},
      });
    }else if(staff.status === "Delete"){
      return res.send({
        statusCode: 403,
        success: false,
        message: "Your account has been deleted",
        result: {},
      });
    }else if(staff.status === "Active"){
      const isMatch = await bcrypt.compare(password, staff.password);

      if (!isMatch) {
        return res.status(401).send({
          statusCode: 401,
          success: false,
          message: "Invalid Password",
          result: {},
        });
      }
  
      const token = await jwt.generateAuthJwt({
        email: staff.email,
        _id: staff._id,
        expires_in: process.env.TOKEN_EXPIRES_IN,
      });
  
      return res.status(200).send({
        statusCode: 200,
        success: true,
        message: "Login successful",
        result: { token },
      });
    }else{
      return res.send({
        statusCode: 403,
        success: false,
        message: "Something went wrong",
        result: {},
      })
    }

   
  } catch (error) {
    return res.status(500).send({
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
    email = email.toLowerCase().trim();

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

    let staff = await Staff.findOne({ email,status : "Active" });

    if (!staff) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Staff not found",
        result: {},
      });
    }

    // Generate and send password reset token
    const expiryTime = Date.now();
    const otp = generateOTP();

    staff.otp = otp;
    staff.otpExpiryTime = expiryTime + 600000; // 10 minutes

    let saveResult = await staff.save();

    if (saveResult) {
      // Send email with otp
      let subject = "OTP Password Reset";
      let html = `<body style="background-color: #f7fafc; margin: 0; padding: 0;">
  <div style="max-width: 24rem; margin: 2rem auto; padding: 1rem; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; text-align: center;">
    <h1 style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">F&amp;G</h1>
    <p style="color: #718096; margin-top: 0.5rem;">We received a request to verify your account with an OTP.</p>
    <p style="color: #718096; margin-top: 1rem;">Your OTP is:</p>
    <p style="font-size: 1.25rem; font-weight: bold; color: #3182ce; margin-top: 0.5rem;">${otp}</p>
    <p style="color: #718096; margin-top: 1rem;">If you did not request this, please ignore this email.</p>
  </div>
</body>`;

      await sendEmail(email, subject, html);

      return res.send({
        statusCode: 200,
        success: true,
        message: "OTP sent successfully",
        result: {},
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

    if (newPassword.length !== confirmPassword.length) {
      return res.send({
        statusCode: 400,
        success: false,
        message: "Password and Confirm Password must match",
        result: {},
      });
    }
    
    otp = Number.parseInt(otp);

    let staff = await Staff.findOne({ email, status : "Active" });

    if (!staff) {
      return res.send({
        statusCode: 404,
        success: false,
        message: "Staff not found",
        result: {},
      });
    }

    if(Date.now() > staff.otpExpiryTime){
      return res.send({
      statusCode: 401,
      success: false,
      message: "OTP has expired",
      result: {},
    });
  }

  if(otp !== staff.otp){
      return res.send({
      statusCode: 401,
      success: false,
      message: "Invalid OTP",
      result: {},
    });
  }

    staff.password = bcrypt.hashSync(newPassword,10);
    staff.otp = "";
    staff.otpExpiryTime = "";

    let savedResult = await staff.save();

    if (savedResult) {
      return res.send({
        statusCode: 200,
        success: true,
        message: "Password reset successfully",
        result: {},
      });
    } else {
      return res.send({
        statusCode: 500,
        success: false,
        message: "Failed to reset password",
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
    const staff = await Staff.findOne({
      _id : token?._id,
      status : "Active"
    }).lean();

    console.log(staff)

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized User",
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

    const isMatch = await bcrypt.compare(oldPassword, staff.password);

    if (!isMatch) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Old Password is incorrect",
        result: {},
      });
    }

    staff.password = await bcrypt.hash(newPassword, 10);

    let savedResult = await staff.save();

    if (savedResult) {
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

exports.getTaxPercentStaff = async (req, res) => {
  try {
    const token = req.token;
    const staff = await Staff.findOne({
      _id : token._id,
      status : "Active"
    }).lean();

    if (!staff) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Unauthorized staff",
        result: {},
      });
    }

    let tax = await TaxPercent.findOne();

    return res.send({
      statusCode: 200,
      success: true,
      message: "Tax fetched successfully",
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