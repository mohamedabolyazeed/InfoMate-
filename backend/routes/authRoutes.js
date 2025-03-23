const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");

// Validation middleware
const signupValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const signinValidation = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Please enter a valid email"),
];

const resetPasswordValidation = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Routes
router.post("/signup", signupValidation, authController.signup);
router.post("/signin", signinValidation, authController.signin);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  authController.resetPassword
);

module.exports = router;
