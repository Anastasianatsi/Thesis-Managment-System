// Secretary routes
const express = require("express")
const router = express.Router()
const multer = require("multer")
const upload = multer({ dest: "uploads/" })
const fs = require("fs")
const path = require("path")
const bcrypt = require("bcrypt") // Added bcrypt import

// Secretary dashboard
router.get("/dashboard", async (req, res) => {
  try {
    // Get counts for dashboard stats
    const [activeTheses] = await req.db.query(
      'SELECT COUNT(*) as count FROM thesis_assignments WHERE status = "active"',
    )

    const [underReviewTheses] = await req.db.query(
      'SELECT COUNT(*) as count FROM thesis_assignments WHERE status = "under_review"',
    )

    res.render("secretary/dashboard", {
      activeTheses: activeTheses[0].count,
      underReviewTheses: underReviewTheses[0].count,
    })
  } catch (error) {
    console.error("Secretary dashboard error:", error)
    req.flash("error", "Failed to load dashboard data")
    res.render("secretary/dashboard", { error: "Failed to load dashboard data" })
  }
})

// List theses
router.get("/theses", async (req, res) => {
  try {
    const status = req.query.status || "active"

    const query =
      "SELECT ta.*, tt.title, s.first_name as student_first_name, " +
      "s.last_name as student_last_name, s.registration_number, " +
      "p.first_name as supervisor_first_name, p.last_name as supervisor_last_name " +
      "FROM thesis_assignments ta " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      "JOIN students s ON ta.student_id = s.id " +
      "JOIN professors p ON ta.supervisor_id = p.id " +
      "WHERE ta.status = ? " +
      "ORDER BY ta.created_at DESC"

    const [theses] = await req.db.query(query, [status])

    res.render("secretary/theses", { theses, status })
  } catch (error) {
    console.error("List theses error:", error)
    req.flash("error", "Failed to load thesis list")
    res.redirect("/secretary/dashboard")
  }
})

// View thesis details
router.get("/theses/:id", async (req, res) => {
  try {
    const thesisId = req.params.id

    // Get thesis details
    const [theses] = await req.db.query(
      "SELECT ta.*, tt.title, tt.summary, " +
        "s.first_name as student_first_name, s.last_name as student_last_name, " +
        "s.registration_number, p.first_name as supervisor_first_name, " +
        "p.last_name as supervisor_last_name " +
        "FROM thesis_assignments ta " +
        "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
        "JOIN students s ON ta.student_id = s.id " +
        "JOIN professors p ON ta.supervisor_id = p.id " +
        "WHERE ta.id = ?",
      [thesisId],
    )

    if (theses.length === 0) {
      req.flash("error", "Thesis not found")
      return res.redirect("/secretary/theses")
    }

    const thesis = theses[0]

    // Get committee members
    const [committeeMembers] = await req.db.query(
      "SELECT cm.*, p.first_name, p.last_name " +
        "FROM committee_members cm " +
        "JOIN professors p ON cm.professor_id = p.id " +
        "WHERE cm.thesis_assignment_id = ?",
      [thesisId],
    )

    // Get thesis submission if exists
    const [submissions] = await req.db.query(
      "SELECT * FROM thesis_submissions " + "WHERE thesis_assignment_id = ? " + "ORDER BY created_at DESC LIMIT 1",
      [thesisId],
    )

    const submission = submissions.length > 0 ? submissions[0] : null

    // Get presentation details if exists
    const [presentations] = await req.db.query(
      "SELECT * FROM thesis_presentations " + "WHERE thesis_assignment_id = ? " + "ORDER BY created_at DESC LIMIT 1",
      [thesisId],
    )

    const presentation = presentations.length > 0 ? presentations[0] : null

    // Get evaluations if exists
    const [evaluations] = await req.db.query(
      "SELECT e.*, p.first_name, p.last_name " +
        "FROM thesis_evaluations e " +
        "JOIN professors p ON e.professor_id = p.id " +
        "WHERE e.thesis_assignment_id = ?",
      [thesisId],
    )

    // Calculate average grade if all evaluations are in
    let averageGrade = null
    if (evaluations.length >= 3) {
      // At least 3 evaluations (supervisor + 2 committee members)
      const sum = evaluations.reduce((total, eval) => total + Number.parseFloat(eval.final_grade), 0)
      averageGrade = (sum / evaluations.length).toFixed(1)
    }

    res.render("secretary/thesis-details", {
      thesis,
      committeeMembers,
      submission,
      presentation,
      evaluations,
      averageGrade,
    })
  } catch (error) {
    console.error("Thesis details error:", error)
    req.flash("error", "Failed to load thesis details")
    res.redirect("/secretary/theses")
  }
})

// Update faculty meeting number
router.post("/theses/:id/meeting", async (req, res) => {
  try {
    const thesisId = req.params.id
    const { meetingNumber, meetingYear } = req.body

    // Update thesis
    await req.db.query(
      "UPDATE thesis_assignments SET faculty_meeting_number = ?, faculty_meeting_year = ? WHERE id = ?",
      [meetingNumber, meetingYear, thesisId],
    )

    req.flash("success", "Faculty meeting information updated successfully")
    res.redirect(`/secretary/theses/${thesisId}`)
  } catch (error) {
    console.error("Update meeting error:", error)
    req.flash("error", "Failed to update faculty meeting information")
    res.redirect(`/secretary/theses/${req.params.id}`)
  }
})

// Cancel thesis
router.post("/theses/:id/cancel", async (req, res) => {
  try {
    const thesisId = req.params.id
    const { cancellationMeetingNumber, cancellationMeetingYear, cancellationReason } = req.body

    // Update thesis
    await req.db.query(
      'UPDATE thesis_assignments SET status = "cancelled", cancellation_date = NOW(), ' +
        "cancellation_meeting_number = ?, cancellation_meeting_year = ?, cancellation_reason = ? " +
        "WHERE id = ?",
      [cancellationMeetingNumber, cancellationMeetingYear, cancellationReason, thesisId],
    )

    // Free up the topic
    await req.db.query(
      "UPDATE thesis_topics SET is_assigned = FALSE " +
        "WHERE id = (SELECT thesis_topic_id FROM thesis_assignments WHERE id = ?)",
      [thesisId],
    )

    req.flash("success", "Thesis cancelled successfully")
    res.redirect("/secretary/theses")
  } catch (error) {
    console.error("Cancel thesis error:", error)
    req.flash("error", "Failed to cancel thesis")
    res.redirect(`/secretary/theses/${req.params.id}`)
  }
})

// Mark thesis as completed
router.post("/theses/:id/complete", async (req, res) => {
  try {
    const thesisId = req.params.id

    // Check if thesis has repository link
    const [theses] = await req.db.query("SELECT * FROM thesis_assignments WHERE id = ?", [thesisId])

    if (theses.length === 0) {
      req.flash("error", "Thesis not found")
      return res.redirect("/secretary/theses")
    }

    const thesis = theses[0]

    if (!thesis.repository_link) {
      req.flash("error", "Thesis cannot be marked as completed without a repository link")
      return res.redirect(`/secretary/theses/${thesisId}`)
    }

    // Check if all evaluations are in
    const [evaluationCount] = await req.db.query(
      "SELECT COUNT(*) as count FROM thesis_evaluations WHERE thesis_assignment_id = ?",
      [thesisId],
    )

    // Get committee member count
    const [committeeCount] = await req.db.query(
      "SELECT COUNT(*) as count FROM committee_members " + 'WHERE thesis_assignment_id = ? AND status = "accepted"',
      [thesisId],
    )

    if (evaluationCount[0].count < committeeCount[0].count + 1) {
      // +1 for supervisor
      req.flash("error", "Thesis cannot be marked as completed until all committee members have evaluated it")
      return res.redirect(`/secretary/theses/${thesisId}`)
    }

    // Update thesis
    await req.db.query('UPDATE thesis_assignments SET status = "completed", completion_date = NOW() WHERE id = ?', [
      thesisId,
    ])

    req.flash("success", "Thesis marked as completed successfully")
    res.redirect("/secretary/theses")
  } catch (error) {
    console.error("Complete thesis error:", error)
    req.flash("error", "Failed to mark thesis as completed")
    res.redirect(`/secretary/theses/${req.params.id}`)
  }
})

// Import data form
router.get("/import", (req, res) => {
  res.render("secretary/import")
})

// Import data
router.post("/import", upload.single("jsonFile"), async (req, res) => {
  try {
    if (!req.file) {
      req.flash("error", "Please upload a JSON file")
      return res.redirect("/secretary/import")
    }

    // Read file
    const filePath = path.join(__dirname, "..", req.file.path)
    const fileContent = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(fileContent)

    // Begin transaction
    const connection = await req.db.getConnection()
    await connection.beginTransaction()

    try {
      // Import students
      if (data.students && Array.isArray(data.students)) {
        for (const student of data.students) {
          // Create user
          const [userResult] = await connection.query(
            'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, "student") ' +
              "ON DUPLICATE KEY UPDATE username = VALUES(username)",
            [student.email, await bcrypt.hash(student.registration_number, 10), student.email],
          )

          const userId = userResult.insertId

          // Create student
          await connection.query(
            "INSERT INTO students (user_id, registration_number, first_name, last_name) " +
              "VALUES (?, ?, ?, ?) " +
              "ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name)",
            [userId, student.registration_number, student.first_name, student.last_name],
          )
        }
      }

      // Import professors
      if (data.professors && Array.isArray(data.professors)) {
        for (const professor of data.professors) {
          // Create user
          const [userResult] = await connection.query(
            'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, "professor") ' +
              "ON DUPLICATE KEY UPDATE username = VALUES(username)",
            [professor.email, await bcrypt.hash("professor123", 10), professor.email],
          )

          const userId = userResult.insertId

          // Create professor
          await connection.query(
            "INSERT INTO professors (user_id, first_name, last_name, department) " +
              "VALUES (?, ?, ?, ?) " +
              "ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name)",
            [
              userId,
              professor.first_name,
              professor.last_name,
              professor.department || "Computer Engineering & Informatics",
            ],
          )
        }
      }

      await connection.commit()

      // Delete the uploaded file
      fs.unlinkSync(filePath)

      req.flash("success", "Data imported successfully")
      res.redirect("/secretary/dashboard")
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Import data error:", error)
    req.flash("error", "Failed to import data: " + error.message)
    res.redirect("/secretary/import")
  }
})

module.exports = router
