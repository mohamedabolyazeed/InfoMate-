const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("connect-flash");
const auth = require("./backend/middleware/auth");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("layout", "layouts/main");

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user;
  next();
});

// Method override for PUT/DELETE requests
var methodOverride = require("method-override");
app.use(methodOverride("_method"));

// Routes
const allRoutes = require("./backend/routes/allRoutes");
const addUserRoute = require("./backend/routes/addUser");
const authRoutes = require("./backend/routes/authRoutes");
const profileRoutes = require("./backend/routes/profileRoutes");

// Auto refresh
const path = require("path");
const livereload = require("livereload");
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, "public"));

const connectLivereload = require("connect-livereload");
app.use(connectLivereload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// Auth routes for views (public routes)
app.get("/signup", (req, res) => res.render("auth/signup"));
app.get("/signin", (req, res) => res.render("auth/signin"));
app.get("/forgot-password", (req, res) => res.render("auth/forgot-password"));
app.get("/reset-password/:token", (req, res) =>
  res.render("auth/reset-password", { token: req.params.token })
);

// Protected routes
app.get("/dashboard", auth, (req, res) =>
  res.render("dashboard", { user: req.session.user })
);
app.get("/logout", auth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/signin");
  });
});

// Use routes
app.use(allRoutes);
app.use(addUserRoute);
app.use("/auth", authRoutes);
app.use("/", profileRoutes);

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://mohamedaboelyazeed920:H1iPPlJG9GeOzcwN@cluster0.lbwsy.mongodb.net/InfoMate?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/*
  PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://mohamedaboelyazeed920:H1iPPlJG9GeOzcwN@cluster0.lbwsy.mongodb.net/InfoMate?retryWrites=true&w=majority&appName=Cluster0
SESSION_SECRET=your-super-secret-key-change-this-in-production
EMAIL_USER=mohamedaboelyazeed920@gmail.com
EMAIL_PASS=cmba stxo cwof dpxv
  */
