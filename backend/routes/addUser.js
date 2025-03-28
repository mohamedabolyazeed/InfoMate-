const express = require("express");
const router = express.Router();
const User = require("../models/customerSchema");
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
var moment = require("moment");

router.get("/user/add.html", auth, userController.user_add_get);
// POST Request
router.post("/user/add.html", auth, userController.user_post);

module.exports = router;
