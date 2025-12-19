const nodemailer = require("nodemailer");

// Create transporter using Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your gmail address
    pass: process.env.EMAIL_PASS, // gmail APP PASSWORD (not normal password)
  },
});

// Optional: verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail SMTP Error:", error);
  } else {
    console.log("✅ Gmail SMTP Ready");
  }
});

exports.sendEmail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `"Maaya" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
