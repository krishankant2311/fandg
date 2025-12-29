const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: Number,
    default: "",
  },
  otpExpiryTime: {
    type: Date,
    default: Date.now,
  },
  fgAddress: {
    type: String,
    default: "",
  },
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;

Admin.findOne({ email: "fg@gmail.com" })
  .then(async (adminResult) => {
    if (adminResult) {
      console.log("Default admin already exist");
    } else {
      let createAdmin = {
        email: "fg@gmail.com",
        password: bcrypt.hashSync("Admin@#123FG", 10),
        fgAddress: `P.O. Box 2769
        BELLAIRE, TX 77402
        713-667-7198`,
      };
      let saveResult = Admin(createAdmin).save();
      if (saveResult) {
        console.log("Admin saved successfully");
      } else {
        console.log("Failed to create ADMIN! ABORTING");
        return;
      }
    }

  })
  .catch((adminErr) => {
    console.log({ error: adminErr });
    return;
  });
