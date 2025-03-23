const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Check if user is logged in via session
    if (req.session.user) {
      const user = await User.findById(req.session.user.id);
      if (!user || !user.isActive) {
        req.session.destroy();
        req.flash('error_msg', 'Your account is inactive or has been deleted');
        return res.redirect('/signin');
      }
      req.user = user;
      return next();
    }

    // Check for JWT token in Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      req.flash('error_msg', 'Please sign in to access this page');
      return res.redirect("/signin");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      req.flash('error_msg', 'Your account is inactive or has been deleted');
      return res.redirect("/signin");
    }

    // Set user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.flash('error_msg', 'Authentication failed. Please sign in again.');
    res.redirect("/signin");
  }
};

module.exports = auth;
