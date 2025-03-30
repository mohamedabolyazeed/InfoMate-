const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = "public/uploads/profiles";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("profilePicture");

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, gif) are allowed!"));
  }
}

// Wrap file upload middleware to handle errors
const handleUpload = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err); // Debugging log
      req.flash("error_msg", `Upload error: ${err.message}`);
      return res.redirect("/profile");
    } else if (err) {
      console.error("File upload error:", err); // Debugging log
      req.flash("error_msg", err.message || "Error uploading file");
      return res.redirect("/profile");
    }
    next();
  });
};

// Profile routes
router.get("/profile", auth, profileController.getProfile);
router.post(
  "/profile/picture",
  auth,
  handleUpload,
  profileController.updateProfilePicture
);
router.post("/profile/update", auth, profileController.updateProfile);

module.exports = router;
