// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../controllers/AuthController");

router.post("/signup", auth.signup);
router.post("/login/email", auth.loginWithEmail);
router.post("/login/mobile", auth.loginWithMobile);
router.post("/login/google", auth.loginWithGoogle);
router.post("/login/apple", auth.loginWithApple);

router.post("/otp/request", auth.requestOtp);
router.post("/otp/verify", auth.verifyOtp);

// password reset
router.post("/password/request-reset", auth.requestPasswordResetEmail);
router.post("/password/reset-with-token", auth.resetPasswordWithToken);
router.post("/password/reset-with-otp", auth.resetPasswordWithOtp);

// refresh / logout
router.post("/token/refresh", auth.refreshToken);
router.post("/logout", auth.logout);

router.get("/users",auth.getAllUsers)
//router.get("/user/:id",auth)

module.exports = router;
