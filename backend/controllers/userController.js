const User = require("../models/customerSchema");
var moment = require("moment");

const user_index_get = (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to view your data");
    return res.redirect("/signin");
  }

  // Only show data for the logged-in user
  User.find({ userId: req.session.user.id })
    .then((result) => {
      res.render("index", { arr: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Error fetching your data");
      res.redirect("/signin");
    });
};

const user_edit_get = (req, res) => {
  // Check if the user owns this data
  User.findOne({ _id: req.params.id, userId: req.session.user.id })
    .then((result) => {
      if (!result) {
        req.flash("error_msg", "You do not have permission to edit this data");
        return res.redirect("/");
      }
      res.render("user/edit", { obj: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_view_get = (req, res) => {
  // Check if the user owns this data
  User.findOne({ _id: req.params.id, userId: req.session.user.id })
    .then((result) => {
      if (!result) {
        req.flash("error_msg", "You do not have permission to view this data");
        return res.redirect("/");
      }
      res.render("user/view", { obj: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_search_post = (req, res) => {
  const searchText = req.body.searchText.trim();

  // Only search within the user's own data
  User.find({
    userId: req.session.user.id,
    $or: [{ fireName: searchText }, { lastName: searchText }],
  })
    .then((result) => {
      res.render("user/search", { arr: result, moment: moment });
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_delete = (req, res) => {
  // Only allow deletion of user's own data
  User.deleteOne({ _id: req.params.id, userId: req.session.user.id })
    .then((result) => {
      if (result.deletedCount === 0) {
        req.flash(
          "error_msg",
          "You do not have permission to delete this data"
        );
      } else {
        req.flash("success_msg", "Data deleted successfully");
      }
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_put = (req, res) => {
  // Only allow updating user's own data
  User.updateOne({ _id: req.params.id, userId: req.session.user.id }, req.body)
    .then((result) => {
      if (result.matchedCount === 0) {
        req.flash(
          "error_msg",
          "You do not have permission to update this data"
        );
      } else {
        req.flash("success_msg", "Data updated successfully");
      }
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};

const user_add_get = (req, res) => {
  res.render("user/add");
};

const user_post = (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to add a customer");
    return res.redirect("/signin");
  }

  // Add the user's ID to the new data
  const newData = {
    ...req.body,
    userId: req.session.user.id,
  };

  // Log the data being sent
  console.log("Attempting to create data with:", newData);

  User.create(newData)
    .then((result) => {
      req.flash("success_msg", "Customer added successfully");
      res.redirect("/");
    })
    .catch((err) => {
      console.log("Detailed error:", err);
      // Check for specific validation errors
      if (err.name === "ValidationError") {
        const validationErrors = Object.values(err.errors).map(
          (error) => error.message
        );
        return res.status(400).render("user/add", {
          error: "Validation Error: " + validationErrors.join(", "),
          formData: req.body,
        });
      }
      // Check for duplicate key error
      if (err.code === 11000) {
        return res.status(400).render("user/add", {
          error: "This email already exists in the database",
          formData: req.body,
        });
      }
      res.status(400).render("user/add", {
        error: "Failed to create customer. Error: " + err.message,
        formData: req.body,
      });
    });
};

module.exports = {
  user_index_get,
  user_edit_get,
  user_view_get,
  user_search_post,
  user_delete,
  user_put,
  user_add_get,
  user_post,
};
