// utils/generateOTP.js
exports.generateOTP = (length = 6) => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) otp += digits[Math.floor(Math.random() * 10)];
  return otp;
};

exports.otpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
