const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const auth = require("../middleware/auth");

router.get("/profile", auth, profileController.getProfile);
router.post("/profile/photo", auth, profileController.updateProfilePhoto);

module.exports = router;
