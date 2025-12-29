const generateOTP = () => {
  // Generate a random number between 10000 and 99999
  const otp = Math.floor(10000 + Math.random() * 90000);
  return otp.toString();
};

module.exports = generateOTP;
