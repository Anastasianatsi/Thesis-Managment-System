// Authentication routes
const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()

// Login page
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard")
  }
  res.render("auth/login")
})

// Login process
router.post("/login", async (req, res) => {
  try {
    console.log(req.body)
    const { username, password } = req.body;
    // Validate input

    if (!username || !password) {
      req.flash("error", "Please provide both username and password")
      return res.redirect("/login")
    }

    // Get user from database
    const [users] = await req.db.query(
      "SELECT u.*, s.id as student_id, p.id as professor_id FROM users u " +
        "LEFT JOIN students s ON u.id = s.user_id " +
        "LEFT JOIN professors p ON u.id = p.user_id " +
        "WHERE u.username = ?",
      [username],
    )

    console.log("Users found:", users);
    
    const user = users[0]

    // Check if user exists
    if (!user) {
      req.flash("error", "Invalid username or password")
      return res.redirect("/login")
    }

    // Check password
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      req.flash("error", "Invalid username or password")
      return res.redirect("/login")
    }

    // Set user session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      roleId: user.role === "student" ? user.student_id : user.role === "professor" ? user.professor_id : null,
    }

    req.flash("success", "You are now logged in")
    res.redirect("/dashboard")
  } catch (error) {
    console.error("Login error:", error)
    req.flash("error", "An error occurred during login")
    res.redirect("/login")
  }
})

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login")
  })
})

module.exports = router
