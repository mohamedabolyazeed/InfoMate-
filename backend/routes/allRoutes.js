const express = require("express");
const router = express.Router();
const User = require("../models/customerSchema");
var moment = require("moment");
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

// GET Request
router.get("/", auth, userController.user_index_get);

router.get("/edit/:id", auth, userController.user_edit_get);

router.get("/view/:id", auth, userController.user_view_get);

// Search Request
router.post("/search", auth, userController.user_search_post);

// DELETE Request
router.delete("/edit/:id", auth, userController.user_delete);

// PUT Request
router.put("/edit/:id", auth, userController.user_put);

module.exports = router;
