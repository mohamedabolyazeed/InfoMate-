const { userHelpers } = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-email-password",
  },
});

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const user = await userHelpers.findUserById(req.session.user.id);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/signin");
    }
    res.render("dashboard", { user });
  } catch (error) {
    req.flash("error_msg", "Server error");
    res.redirect("/signin");
  }
};

// Sign Up
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error_msg", errors.array()[0].msg);
      return res.redirect("/signup");
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await userHelpers.findUserByEmail(email);
    if (existingUser) {
      req.flash("error_msg", "Email is already registered");
      return res.redirect("/signup");
    }

    // Create new user
    const result = await userHelpers.createUser({ name, email, password });

    // Create JWT token
    const token = jwt.sign({ userId: result.insertedId }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set user in session
    req.session.user = {
      id: result.insertedId,
      name,
      email,
    };

    req.flash(
      "success_msg",
      "Registration successful! Welcome to your dashboard."
    );
    res.redirect("/");
  } catch (error) {
    console.error("Signup error:", error);
    req.flash("error_msg", "Server error during registration");
    res.redirect("/signup");
  }
};

// Sign In
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await userHelpers.findUserByEmail(email);
    if (!user || !user.isActive) {
      req.flash("error_msg", "Invalid credentials or account is inactive");
      return res.redirect("/signin");
    }

    // Check password
    const isMatch = await userHelpers.comparePassword(password, user.password);
    if (!isMatch) {
      req.flash("error_msg", "Invalid credentials");
      return res.redirect("/signin");
    }

    // Update last login
    await userHelpers.updateUser(user._id, { lastLogin: new Date() });

    // Set user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.flash("success_msg", "Welcome back!");
    res.redirect("/");
  } catch (error) {
    console.error("Signin error:", error);
    req.flash("error_msg", "Server error during sign in");
    res.redirect("/signin");
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/signin");
  });
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userHelpers.findUserByEmail(email);

    if (!user) {
      req.flash("error_msg", "User not found or account is inactive");
      return res.redirect("/forgot-password");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await userHelpers.updateUser(user._id, user);

    // Send reset email
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `
                <h1>You requested a password reset</h1>
                <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
    };

    await transporter.sendMail(mailOptions);

    req.flash("success_msg", "Password reset email sent");
    res.redirect("/signin");
  } catch (error) {
    req.flash("error_msg", "Server error during password reset");
    res.redirect("/forgot-password");
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await userHelpers.findUserByResetToken(resetPasswordToken);

    if (!user) {
      req.flash("error_msg", "Invalid or expired reset token");
      return res.redirect("/forgot-password");
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await userHelpers.updateUser(user._id, user);

    req.flash("success_msg", "Password has been reset successfully");
    res.redirect("/signin");
  } catch (error) {
    req.flash("error_msg", "Server error during password reset");
    res.redirect("/forgot-password");
  }
};
