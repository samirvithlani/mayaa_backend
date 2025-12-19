// middlewares/roleBasedAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const roleBasedAuth = (...allowedRoles) => {
    
  return async (req, res, next) => {
    try {
      // 1️⃣ Get token from header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "JWT token missing",
        });
      }

      const token = authHeader.split(" ")[1];

      // 2️⃣ Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3️⃣ Get user with role
      const user = await User.findById(decoded.id)
        .select("-password -otp")
        .populate("roleId");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // 4️⃣ Extract role safely
      const userRole =
        user.roleId?.name ||
        user.roleId?.role ||
        user.roleId;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: "User role not assigned",
        });
      }

      // 5️⃣ Role check
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied for this role",
        });
      }

      // 6️⃣ Attach user & continue
      req.user = user;
      next();

    } catch (error) {
      
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

module.exports = roleBasedAuth;
