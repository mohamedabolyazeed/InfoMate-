const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

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
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/");
    }
    res.render("profile", { user });
  } catch (error) {
    console.error("Profile error:", error);
    req.flash("error_msg", "Error loading profile");
    res.redirect("/");
  }
};

exports.updateProfilePhoto = [
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        req.flash("error_msg", "No file uploaded");
        return res.redirect("/profile");
      }

      const user = await User.findById(req.session.user.id);
      if (!user) {
        req.flash("error_msg", "User not found");
        return res.redirect("/");
      }

      // Delete old profile photo if it exists
      if (
        user.profilePhoto &&
        user.profilePhoto !== "/img/default-avatar.png"
      ) {
        const oldPhotoPath = path.join("public", user.profilePhoto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Update user's profile photo path
      user.profilePhoto = "/uploads/profiles/" + req.file.filename;
      await user.save();

      // Update session
      req.session.user.profilePhoto = user.profilePhoto;

      req.flash("success_msg", "Profile photo updated successfully");
      res.redirect("/profile");
    } catch (error) {
      console.error("Profile photo update error:", error);
      req.flash("error_msg", "Error updating profile photo");
      res.redirect("/profile");
    }
  },
];
