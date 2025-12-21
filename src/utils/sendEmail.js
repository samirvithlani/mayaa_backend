// const nodemailer = require("nodemailer");

// // Create transporter using Gmail service
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER, // your gmail address
//     pass: process.env.EMAIL_PASS, // gmail APP PASSWORD (not normal password)
//   },
// });

// // Optional: verify SMTP connection on startup
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ Gmail SMTP Error:", error);
//   } else {
//     console.log("✅ Gmail SMTP Ready");
//   }
// });

// exports.sendEmail = async ({ to, subject, html, text }) => {
//   return transporter.sendMail({
//     from: `"Maaya" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     text,
//     html,
//   });
// };


const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// Decide provider
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "gmail";
console.log(EMAIL_PROVIDER)
// ---------- GMAIL SETUP ----------
let gmailTransporter = null;

if (EMAIL_PROVIDER === "gmail") {
  gmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // APP PASSWORD
    },
  });

  // Verify only in gmail mode
  gmailTransporter.verify((error) => {
    if (error) {
      console.error("❌ Gmail SMTP Error:", error.message);
    } else {
      console.log("✅ Gmail SMTP Ready");
    }
  });
}

// ---------- RESEND SETUP ----------
const resend = new Resend(process.env.RESEND_API_KEY);

// ---------- MAIN SEND FUNCTION ----------
exports.sendEmail = async ({ to, subject, html, text }) => {
  switch (EMAIL_PROVIDER) {
    case "gmail":
      return gmailTransporter.sendMail({
        from: `"Maaya" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

    case "resend":
      return resend.emails.send({
        from: "Maaya <onboarding@resend.dev>", // can be changed later
        to,
        subject,
        html: html || `<p>${text}</p>`,
      });

    default:
      throw new Error("Invalid EMAIL_PROVIDER");
  }
};
