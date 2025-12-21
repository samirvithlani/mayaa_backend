const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const SibApiV3Sdk = require("sib-api-v3-sdk");

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "gmail";
console.log(EMAIL_PROVIDER);
/* ---------------- RESEND ---------------- */
const resend = new Resend(process.env.RESEND_API_KEY);

/* ---------------- BREVO ---------------- */
const brevoClient = SibApiV3Sdk.ApiClient.instance;
brevoClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();

/* ---------------- GMAIL ---------------- */
let gmailTransporter = null;
if (EMAIL_PROVIDER === "gmail") {
  gmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/* ---------------- SEND EMAIL ---------------- */
exports.sendEmail = async ({ to, subject, html, text }) => {
  switch (EMAIL_PROVIDER) {
    /* ✅ GMAIL (LOCAL ONLY) */
    case "gmail":
      return gmailTransporter.sendMail({
        from: `"Maaya" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

    /* ✅ RESEND */
    case "resend":
      return await resend.emails.send({
        from: "Maaya <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || `<p>${text || ""}</p>`,
      });

    /* ✅ BREVO (NEW CASE) */
    case "brevo":
      return await brevoApi.sendTransacEmail({
        sender: {
          name: "Maaya",
          email: "contact@brevo.com", // TEMP
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      });

    default:
      throw new Error("Invalid EMAIL_PROVIDER");
  }
};
