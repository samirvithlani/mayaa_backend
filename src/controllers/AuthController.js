// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const RefreshToken = require("../models/RefreshToken");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { generateOTP } = require("../utils/generateOTP");
const { sendEmail } = require("../utils/sendEmail");
const redis = require("../config/redis")


const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// --------- Signup (email/password or mobile/password)
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, contactNo, password,roleId } = req.body;

    if (!password) return res.status(400).json({ message: "Password required" });

    // check duplicate email or contact
    if (email) {
      const e = await User.findOne({ email });
      if (e) return res.status(409).json({ message: "Email already in use" });
    }
    if (contactNo) {
      const c = await User.findOne({ contactNo });
      if (c) return res.status(409).json({ message: "Contact number already in use" });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ firstName, lastName, email, contactNo, password: hashed,roleId });

    // tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // store refresh token server-side
    const expiresAt = new Date(Date.now() + (Number(process.env.REFRESH_TOKEN_EXP_DAYS || 30) * 24 * 3600 * 1000));
    await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Email + Password login
exports.loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await User.findOne({ email }).select("+password").populate("roleId")
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid password" });

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + (Number(process.env.REFRESH_TOKEN_EXP_DAYS || 30) * 24 * 3600 * 1000));
    await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt });

    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Mobile + Password login
exports.loginWithMobile = async (req, res) => {
  try {
    const { contactNo, password } = req.body;
    if (!contactNo || !password) return res.status(400).json({ message: "contactNo and password required" });

    const user = await User.findOne({ contactNo }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid password" });

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + (Number(process.env.REFRESH_TOKEN_EXP_DAYS || 30) * 24 * 3600 * 1000));
    await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt });

    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Google Login (expects googleId & optionally email)
exports.loginWithGoogle = async (req, res) => {
  try {
    const { googleId, email, firstName, lastName, avatar } = req.body;
    if (!googleId) return res.status(400).json({ message: "googleId required" });

    let user = await User.findOne({ googleId });
    if (!user && email) {
      const existing = await User.findOne({ email });
      if (existing) {
        existing.googleId = googleId;
        existing.avatar = existing.avatar || avatar;
        await existing.save();
        user = existing;
      }
    }
    if (!user) {
      user = await User.create({ googleId, email, firstName, lastName, avatar });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + (Number(process.env.REFRESH_TOKEN_EXP_DAYS || 30) * 24 * 3600 * 1000));
    await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt });

    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Apple Login
exports.loginWithApple = async (req, res) => {
  try {
    const { appleId, email, firstName, lastName, avatar } = req.body;
    if (!appleId) return res.status(400).json({ message: "appleId required" });

    let user = await User.findOne({ appleId });
    if (!user && email) {
      const existing = await User.findOne({ email });
      if (existing) {
        existing.appleId = appleId;
        await existing.save();
        user = existing;
      }
    }
    if (!user) {
      user = await User.create({ appleId, email, firstName, lastName, avatar });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + (Number(process.env.REFRESH_TOKEN_EXP_DAYS || 30) * 24 * 3600 * 1000));
    await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt });

    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Request OTP (for login or password reset) - email or mobile
exports.requestOtp = async (req, res) => {
  try {
    const { email, contactNo, purpose } = req.body;
    if (!email && !contactNo) return res.status(400).json({ message: "email or contactNo required" });
    if (!purpose) return res.status(400).json({ message: "purpose required (verify|reset|login)" });

    let user;
    if (email) user = await User.findOne({ email });
    if (contactNo) user = await User.findOne({ contactNo });

    // If purpose is 'verify' maybe create user later; but we'll require user for reset/login
    if (!user && purpose !== "verify") return res.status(404).json({ message: "User not found" });

    const code = generateOTP(6);
    const expiresAt = otpExpiry(10); // 10 minutes

    if (user) {
      user.otp = { code, expiresAt, purpose };
      await user.save();
    } else {
      // For 'verify' (signup verification) we could create a temp user or return code to client
      return res.status(200).json({ message: "Send code via client flow", code }); // For dev only: remove in prod
    }

    // send via email and/or sms
    if (email) {
      await sendEmail({
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${code}. It expires in 10 minutes.`
      });
    }
    // TODO: send sms using provider if contactNo

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, contactNo, code } = req.body;
    if (!code) return res.status(400).json({ message: "code required" });

    let user;
    if (email) user = await User.findOne({ email });
    if (contactNo) user = await User.findOne({ contactNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otp.code !== code) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date() > user.otp.expiresAt) return res.status(400).json({ message: "OTP expired" });

    // clear OTP after success
    user.otp = null;
    await user.save();

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Request password reset via email link
exports.requestPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // create short-lived JWT token for reset
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Password reset",
      text: `Reset your password: ${resetUrl}`
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Reset password using token (email link)
exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "token and newPassword required" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(payload.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Reset password using OTP (mobile/email)
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, contactNo, code, newPassword } = req.body;
    if (!code || !newPassword) return res.status(400).json({ message: "code and newPassword required" });

    let user;
    if (email) user = await User.findOne({ email }).select("+password");
    if (contactNo) user = await User.findOne({ contactNo }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otp.code !== code) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date() > user.otp.expiresAt) return res.status(400).json({ message: "OTP expired" });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.otp = null;
    await user.save();

    res.json({ message: "Password changed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Refresh token endpoint
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "refreshToken required" });

    // verify signature
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // find token record
    const tokenRecord = await RefreshToken.findOne({ token: refreshToken, revoked: false });
    if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
      return res.status(401).json({ message: "Refresh token expired or revoked" });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // rotate refresh token: revoke old, issue new
    tokenRecord.revoked = true;
    await tokenRecord.save();

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + (Number(process.env.REFRESH_TOKEN_EXP_DAYS || 30) * 24 * 3600 * 1000));
    await RefreshToken.create({ user: user._id, token: newRefreshToken, expiresAt });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- Logout (revoke refresh token)
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "refreshToken required" });

    const rec = await RefreshToken.findOne({ token: refreshToken });
    if (rec) {
      rec.revoked = true;
      await rec.save();
    }

    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    // ✅ 1. Read Query Params
    const {
      page = 1,
      limit = 10,
      search = "",
      roleId,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // ✅ 2. Build Filter Object
    const filter = {};

    // Search by name, email, contact
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactNo: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by Role
    if (roleId) {
      filter.roleId = roleId;
    }

    // ✅ 3. Pagination Logic
    const skip = (Number(page) - 1) * Number(limit);

    // ✅ 4. Fetch Users
    const users = await User.find(filter)
      .select("-password -otp") // extra safety
      .populate("roleId", "name")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    // ✅ 5. Total Count
    const totalUsers = await User.countDocuments(filter);

    // ✅ 6. Response
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      total: totalUsers,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });

  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};
// --------- Get Logged-in User Profile
exports.getMyProfile = async (req, res) => {
  try {
    

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: req.user,
    });

  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};
exports.sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    // 🔁 Resend cooldown
    const resendKey = `signup:resend:${email}`;
    if (await redis.get(resendKey)) {
      return res.status(429).json({
        message: "Please wait 60 seconds before resending OTP",
      });
    }

    const otp = generateOTP();

    await redis.set(`signup:otp:${email}`, otp, "EX", 600);
    await redis.set(`signup:attempts:${email}`, 0, "EX", 600);
    await redis.set(resendKey, 1, "EX", 60);

    await sendEmail({
      to: email,
      subject: "Signup OTP",
      html: `<h2>${otp}</h2><p>Valid for 10 minutes</p>`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
};

exports.verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpKey = `signup:otp:${email}`;
    const attemptsKey = `signup:attempts:${email}`;

    const savedOTP = await redis.get(otpKey);
    if (!savedOTP)
      return res.status(400).json({ message: "OTP expired or not found" });

    let attempts = Number(await redis.get(attemptsKey)) || 0;

    if (attempts >= 3) {
      await redis.del(otpKey, attemptsKey);
      return res.status(403).json({
        message: "OTP attempts exceeded. Signup again.",
      });
    }

    if (savedOTP !== otp) {
      attempts += 1;
      await redis.set(attemptsKey, attempts, "EX", 600);

      return res.status(401).json({
        message: `Invalid OTP. Attempts left: ${3 - attempts}`,
      });
    }

    // ✅ OTP VERIFIED
    await redis.del(otpKey, attemptsKey);
    await redis.set(`signup:verified:${email}`, 1, "EX", 900); // 15 min

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.completeSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, roleId } = req.body;

    const verified = await redis.get(`signup:verified:${email}`);
    if (!verified) {
      return res.status(403).json({
        message: "OTP verification required",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      roleId,
    });

    await redis.del(`signup:verified:${email}`);

    res.status(201).json({
      message: "Signup successful",
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



