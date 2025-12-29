const mongoose = require("mongoose");

// Define the alphabet and length for the custom Nano ID
const generateCustomId = ()=>{
  const length = 8;
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let randomString = ""

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

const staffSchema = new mongoose.Schema({
  staffId : {
    type: String,
    required: true,
    unique: true,
  },
  staffName: {
    type: String,
    required: true,
  },
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
  status : {
    type: String,
    default: "Active",
    enum: ["Active", "Block", "Delete"],
  }
});


// Static method to generate a unique staffId
staffSchema.statics.generateUniqueStaffId = async function() {
  let uniqueId;
  let isUnique = false;
  let i = 1;

  while (!isUnique) {
    // uniqueId = generateCustomId();
    uniqueId = await this.countDocuments() + i;
    console.log(uniqueId);
    const existingStaff = await this.findOne({ staffId: uniqueId });
    console.log("Existing User", existingStaff)
    if (!existingStaff) {
      isUnique = true;
    }
    i++;
  }

  return uniqueId;
};

module.exports = mongoose.model("Staff", staffSchema);




