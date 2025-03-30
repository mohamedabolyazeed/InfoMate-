const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Add this for synchronous methods
const fsPromises = require("fs").promises; // Rename for clarity
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "public/uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/");
    }
    res.render("profile", {
      user,
      messages: {
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
      },
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    req.flash("error_msg", "Error loading profile");
    res.redirect("/");
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      req.flash("error_msg", "Please select an image to upload");
      return res.redirect("/profile");
    }

    console.log("Uploaded file:", req.file); // Debugging log

    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/profile");
    }

    // Delete old profile picture if it exists and is not the default
    if (
      user.profilePhoto &&
      user.profilePhoto !== "/img/default-avatar.png"
    ) {
      const oldPhotoPath = path.join(process.cwd(), "public", user.profilePhoto);
      try {
        await fsPromises.access(oldPhotoPath); // Check if file exists
        await fsPromises.unlink(oldPhotoPath); // Delete the file
      } catch (err) {
        console.warn("Old profile picture not found or could not be deleted:", err.message);
      }
    }

    // Update user's profile picture path
    const profilePhotoPath = `/uploads/profiles/${req.file.filename}`;
    user.profilePhoto = profilePhotoPath;

    // Save the updated user object to the database
    await user.save();

    console.log("Updated user profile photo path:", profilePhotoPath); // Debugging log

    // Update session with the new profile photo
    req.session.user.profilePhoto = profilePhotoPath;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
      }
    });

    req.flash("success_msg", "Profile picture updated successfully");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error in updateProfilePicture:", error);
    req.flash("error_msg", "Error updating profile picture");
    res.redirect("/profile");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword, confirmPassword } =
      req.body;
    const user = await User.findById(req.session.user._id);

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/profile");
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      req.flash("error_msg", "Please enter a valid email address");
      return res.redirect("/profile");
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      req.flash("error_msg", "Email is already in use");
      return res.redirect("/profile");
    }

    // Update basic info
    user.name = name;
    user.email = email;

    // Handle password update if provided
    if (currentPassword && newPassword) {
      if (newPassword !== confirmPassword) {
        req.flash("error_msg", "New passwords do not match");
        return res.redirect("/profile");
      }

      if (newPassword.length < 6) {
        req.flash("error_msg", "Password must be at least 6 characters long");
        return res.redirect("/profile");
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        req.flash("error_msg", "Current password is incorrect");
        return res.redirect("/profile");
      }

      // Set new password - let the pre-save middleware handle the hashing
      user.password = newPassword;
    }

    await user.save();

    // Update session and clear any existing tokens
    req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
    };
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
      }
    });

    req.flash("success_msg", "Profile updated successfully");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error in updateProfile:", error);
    req.flash("error_msg", "Error updating profile");
    res.redirect("/profile");
  }
};
