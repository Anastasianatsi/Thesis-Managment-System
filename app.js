// Main application file
const express = require("express")
const path = require("path")
const session = require("express-session")
const flash = require("connect-flash")
const mysql = require("mysql2/promise")
const methodOverride = require("method-override")
const multer = require("multer")

// Import routes
const authRoutes = require("./routes/auth")
const professorRoutes = require("./routes/professor")
const studentRoutes = require("./routes/student")
const secretaryRoutes = require("./routes/secretary")
const publicRoutes = require("./routes/public")
const { storage } = require("./utils/storage")

// Create Express app
const app = express()
const PORT = 3000

// Database connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "thesis_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Make db available in request object
// This middleware attaches the database connection pool to each request
// so that routes can access the database without needing to create a new connection each time
app.use(async (req, res, next) => {
  req.db = pool
  next()
})

// Configure view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Middleware

// Serve static files from the 'public' directory (CSS, JS, images)
// This makes files in the public directory accessible at the root URL path
app.use(express.static(path.join(__dirname, "public")))

// Serve uploaded files from utils/uploads directory
// Makes files accessible via /uploads/filename.ext in your application
app.use("/uploads", express.static(path.join(__dirname, "utils/uploads")))

// Parse URL-encoded bodies from form submissions
// extended: true allows for rich objects and arrays to be encoded
app.use(express.urlencoded({ extended: true }))

// Parse JSON bodies for API requests
// Enables req.body for JSON payloads
app.use(express.json())

// Enable HTTP method override with query param _method
// Allows forms to use PUT, DELETE, etc. methods with ?_method=PUT
app.use(methodOverride("_method"))

// - secret: used to sign the session cookie
// - resave: false prevents saving session if unmodified
// - saveUninitialized: false prevents creating empty sessions
// - cookie.maxAge: session expires after 1 hour of inactivity
app.use(
  session({
    secret: "thesis-management-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }, // 1 hour
  }),
)

// Enables temporary messages that survive redirects (req.flash)
app.use(flash())

// File upload configuration
// storage

// Configure file upload with multer
// Defines storage location and naming for uploaded files
const upload = multer({ storage })
app.locals.upload = upload

// Authentication middleware
// Checks if user is logged in before allowing access to protected routes
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    // next calls the next middleware in the stack, so that the request can proceed
    return next()
  }
  req.flash("error", "Please log in to access this page")
  res.redirect("/login")
}

// Role-based access control middleware
// Returns a middleware function that checks if the authenticated user has the specified role
// If not, redirects to dashboard with an error message
const checkRole = (role) => {
  return (req, res, next) => {
    if (req.session.user && req.session.user.role === role) {
      return next()
    }
    req.flash("error", "You do not have permission to access this page")
    res.redirect("/dashboard")
  }
}

// Make user and flash messages available in all templates
// This middleware runs on every request and makes common data available to all views
// - user: the currently logged in user (or null if not logged in)
// - error: any error messages from flash
// - success: any success messages from flash
app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  res.locals.error = req.flash("error")
  res.locals.success = req.flash("success")
  next()
})

// Routes
// Each route module handles a specific area of functionality
// Routes are protected by authentication and role-based access control where needed
app.use("/", authRoutes)
app.use("/professor", isAuthenticated, checkRole("professor"), professorRoutes)
app.use("/student", isAuthenticated, checkRole("student"), studentRoutes)
app.use("/secretary", isAuthenticated, checkRole("secretary"), secretaryRoutes)
app.use("/public", publicRoutes)

// Home route
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard")
  }
  res.render("index")
})

// Dashboard route
app.get("/dashboard", isAuthenticated, (req, res) => {
  const { role } = req.session.user
// Redirect to appropriate dashboard based on user role
  if (role === "professor") {
    return res.redirect("/professor/dashboard")
  } else if (role === "student") {
    return res.redirect("/student/dashboard")
  } else if (role === "secretary") {
    return res.redirect("/secretary/dashboard")
  }

  res.redirect("/")
})

// 404 handler
// Catch-all route for 404 Not Found
// If no other route matches, render a 404 page
app.use((req, res) => {
  res.status(404).render("404")
})

// Error handler
// Global error handler for unhandled errors
// Logs the error and renders an error page
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render("error", { error: err })
})

// Start server
// Listens on the specified port and logs a message when ready
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

module.exports = app
