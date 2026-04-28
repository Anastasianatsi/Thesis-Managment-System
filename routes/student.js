// Student routes
const express = require("express")
const router = express.Router()
const path = require("path")
const fs = require("fs")

// Student dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const studentId = req.session.user.roleId

    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT ta.*, tt.title, tt.summary, p.first_name as supervisor_first_name, " +
      "p.last_name as supervisor_last_name " +
      "FROM thesis_assignments ta " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      "JOIN professors p ON ta.supervisor_id = p.id " +
      'WHERE ta.student_id = ? AND ta.status IN ("pending", "active", "under_review") ' +
      "ORDER BY ta.created_at DESC LIMIT 1",
      [studentId],
    )

    const thesis = theses.length > 0 ? theses[0] : null

    // Get committee members if thesis exists
    let committeeMembers = []
    if (thesis) {
      ;[committeeMembers] = await req.db.query(
        "SELECT cm.*, p.first_name, p.last_name " +
        "FROM committee_members cm " +
        "JOIN professors p ON cm.professor_id = p.id " +
        "WHERE cm.thesis_assignment_id = ?",
        [thesis.id],
      )
    }

    // Calculate days since assignment if active
    let daysSinceAssignment = null
    if (thesis && thesis.assignment_date) {
      const assignmentDate = new Date(thesis.assignment_date)
      const today = new Date()
      const diffTime = Math.abs(today - assignmentDate)
      daysSinceAssignment = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    res.render("student/dashboard", {
      thesis,
      committeeMembers,
      daysSinceAssignment,
    })
  } catch (error) {
    console.error("Student dashboard error:", error)
    req.flash("error", "Failed to load dashboard data")
    res.render("student/dashboard", { error: "Failed to load dashboard data" })
  }
})

// Edit profile
router.get("/profile", async (req, res) => {
  try {
    const studentId = req.session.user.roleId

    const [students] = await req.db.query("SELECT * FROM students WHERE id = ?", [studentId])

    if (students.length === 0) {
      req.flash("error", "Student profile not found")
      return res.redirect("/student/dashboard")
    }

    res.render("student/profile", { student: students[0] })
  } catch (error) {
    console.error("Profile error:", error)
    req.flash("error", "Failed to load profile")
    res.redirect("/student/dashboard")
  }
})

// Update profile
router.put("/profile", async (req, res) => {
  try {
    const studentId = req.session.user.roleId
    const { address, mobilePhone, homePhone } = req.body

    await req.db.query("UPDATE students SET address = ?, mobile_phone = ?, home_phone = ? WHERE id = ?", [
      address,
      mobilePhone,
      homePhone,
      studentId,
    ])

    req.flash("success", "Profile updated successfully")
    res.redirect("/student/profile")
  } catch (error) {
    console.error("Update profile error:", error)
    req.flash("error", "Failed to update profile")
    res.redirect("/student/profile")
  }
})

// Invite professor to committee
router.get("/thesis/invite", async (req, res) => {
  try {
    const studentId = req.session.user.roleId

    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT ta.*, tt.title " +
      "FROM thesis_assignments ta " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      'WHERE ta.student_id = ? AND ta.status = "pending"',
      [studentId],
    )

    if (theses.length === 0) {
      req.flash("error", "You do not have a pending thesis assignment")
      return res.redirect("/student/dashboard")
    }

    const thesis = theses[0]

    // Get current committee members
    const [committeeMembers] = await req.db.query(
      "SELECT cm.*, p.first_name, p.last_name " +
      "FROM committee_members cm " +
      "JOIN professors p ON cm.professor_id = p.id " +
      "WHERE cm.thesis_assignment_id = ?",
      [thesis.id],
    )

    // Get available professors (excluding supervisor and already invited)
    const [professors] = await req.db.query(
      "SELECT p.* FROM professors p " +
      "WHERE p.id != ? AND p.id NOT IN " +
      "(SELECT professor_id FROM committee_members WHERE thesis_assignment_id = ?)",
      [thesis.supervisor_id, thesis.id],
    )

    res.render("student/invite", {
      thesis,
      committeeMembers,
      professors,
    })
  } catch (error) {
    console.error("Invite form error:", error)
    req.flash("error", "Failed to load invitation form")
    res.redirect("/student/dashboard")
  }
})

// Send invitation to professor
router.post("/thesis/invite", async (req, res) => {
  try {
    const studentId = req.session.user.roleId
    const { professorId } = req.body

    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT * FROM thesis_assignments " + 'WHERE student_id = ? AND status = "pending"',
      [studentId],
    )

    if (theses.length === 0) {
      req.flash("error", "You do not have a pending thesis assignment")
      return res.redirect("/student/dashboard")
    }

    const thesis = theses[0]

    // Check if professor exists
    const [professors] = await req.db.query("SELECT * FROM professors WHERE id = ?", [professorId])

    if (professors.length === 0) {
      req.flash("error", "Professor not found")
      return res.redirect("/student/thesis/invite")
    }

    // Check if professor is not the supervisor
    if (thesis.supervisor_id === Number.parseInt(professorId)) {
      req.flash("error", "You cannot invite the supervisor to the committee")
      return res.redirect("/student/thesis/invite")
    }

    // Check if professor is already invited
    const [existingInvitations] = await req.db.query(
      "SELECT * FROM committee_members " + "WHERE thesis_assignment_id = ? AND professor_id = ?",
      [thesis.id, professorId],
    )

    if (existingInvitations.length > 0) {
      req.flash("error", "This professor is already invited to the committee")
      return res.redirect("/student/thesis/invite")
    }

    // Send invitation
    await req.db.query("INSERT INTO committee_members (thesis_assignment_id, professor_id) VALUES (?, ?)", [
      thesis.id,
      professorId,
    ])

    req.flash("success", "Invitation sent successfully")
    res.redirect("/student/thesis/invite")
  } catch (error) {
    console.error("Send invitation error:", error)
    req.flash("error", "Failed to send invitation")
    res.redirect("/student/thesis/invite")
  }
})

// Upload thesis document
router.get("/thesis/upload", async (req, res) => {
  try {
    const studentId = req.session.user.roleId

    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT ta.*, tt.title " +
      "FROM thesis_assignments ta " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      'WHERE ta.student_id = ? AND ta.status = "under_review"',
      [studentId],
    )

    if (theses.length === 0) {
      req.flash("error", "You do not have a thesis under review")
      return res.redirect("/student/dashboard")
    }

    const thesis = theses[0]

    // Get current submission if exists
    const [submissions] = await req.db.query(
      "SELECT * FROM thesis_submissions " + "WHERE thesis_assignment_id = ? " + "ORDER BY created_at DESC LIMIT 1",
      [thesis.id],
    )

    const submission = submissions.length > 0 ? submissions[0] : null

    res.render("student/upload", { thesis, submission })
  } catch (error) {
    console.error("Upload form error:", error)
    req.flash("error", "Failed to load upload form")
    res.redirect("/student/dashboard")
  }
})

const multer = require("multer")
const { storage } = require("../utils/storage")
const upload = multer({ storage })
// Submit thesis document
router.post("/thesis/upload", upload.single("document"), async (req, res) => {
  try {
    console.log("File upload request received");
    
    const studentId = req.session.user.roleId
    const { additionalLinks } = req.body
    
    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT * FROM thesis_assignments " + 'WHERE student_id = ? AND status = "under_review"',
      [studentId],
    )

    if (theses.length === 0) {
      req.flash("error", "You do not have a thesis under review")
      return res.redirect("/student/dashboard")
    }

    const thesis = theses[0]
    
    console.log(req.file, req.file.fieldname);
    
    
    // Handle file upload
    if (!req.file || req.file.fieldname !=="document") {
      req.flash("error", "Please upload a document")
      return res.redirect("/student/thesis/upload")
    }

    const file = req.file

    const documentPath = file.filename 


    // Save submission
    await req.db.query(
      "INSERT INTO thesis_submissions (thesis_assignment_id, document_path, additional_links) VALUES (?, ?, ?)",
      [thesis.id, documentPath, additionalLinks],
    )

    req.flash("success", "Thesis document uploaded successfully")
    res.redirect("/student/thesis/upload")
  } catch (error) {
    console.error("Upload document error:", error)
    req.flash("error", "Failed to upload thesis document")
    res.redirect("/student/thesis/upload")
  }
})

// Set presentation details
router.get("/thesis/presentation", async (req, res) => {
  try {
    const studentId = req.session.user.roleId

    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT ta.*, tt.title " +
      "FROM thesis_assignments ta " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      'WHERE ta.student_id = ? AND ta.status = "under_review"',
      [studentId],
    )

    if (theses.length === 0) {
      req.flash("error", "You do not have a thesis under review")
      return res.redirect("/student/dashboard")
    }

    const thesis = theses[0]

    // Get current presentation if exists
    const [presentations] = await req.db.query(
      "SELECT * FROM thesis_presentations " + "WHERE thesis_assignment_id = ? " + "ORDER BY created_at DESC LIMIT 1",
      [thesis.id],
    )

    const presentation = presentations.length > 0 ? presentations[0] : null

    res.render("student/presentation", { thesis, presentation })
  } catch (error) {
    console.error("Presentation form error:", error)
    req.flash("error", "Failed to load presentation form")
    res.redirect("/student/dashboard")
  }
})

// Save presentation details
router.post("/thesis/presentation", async (req, res) => {
  try {
    const studentId = req.session.user.roleId
    const { presentationDate, presentationTime, location, isOnline } = req.body

    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT * FROM thesis_assignments " + 'WHERE student_id = ? AND status = "under_review"',
      [studentId],
    )

    if (theses.length === 0) {
      req.flash("error", "You do not have a thesis under review")
      return res.redirect("/student/dashboard")
    }

    const thesis = theses[0]

    // Combine date and time
    const presentationDateTime = new Date(`${presentationDate}T${presentationTime}`)

    // Save presentation details
    await req.db.query(
      "INSERT INTO thesis_presentations (thesis_assignment_id, presentation_date, location, is_online) VALUES (?, ?, ?, ?)",
      [thesis.id, presentationDateTime, location, isOnline === "on"],
    )

    req.flash("success", "Presentation details saved successfully")
    res.redirect("/student/thesis/presentation")
  } catch (error) {
    console.error("Save presentation error:", error)
    req.flash("error", "Failed to save presentation details")
    res.redirect("/student/thesis/presentation")
  }
})

// View thesis evaluation
router.get("/thesis/evaluation", async (req, res) => {
  try {
    const studentId = req.session.user.roleId

    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT ta.*, tt.title, s.first_name as student_first_name, " +
      "s.last_name as student_last_name, s.registration_number, " +
      "p.first_name as supervisor_first_name, p.last_name as supervisor_last_name " +
      "FROM thesis_assignments ta " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      "JOIN students s ON ta.student_id = s.id " +
      "JOIN professors p ON ta.supervisor_id = p.id " +
      'WHERE ta.student_id = ? AND ta.status IN ("under_review", "completed")',
      [studentId],
    )

    if (theses.length === 0) {
      req.flash("error", "You do not have a thesis under review or completed")
      return res.redirect("/student/dashboard")
    }

    const thesis = theses[0]

    // Get committee members
    const [committeeMembers] = await req.db.query(
      "SELECT cm.*, p.first_name, p.last_name " +
      "FROM committee_members cm " +
      "JOIN professors p ON cm.professor_id = p.id " +
      'WHERE cm.thesis_assignment_id = ? AND cm.status = "accepted"',
      [thesis.id],
    )

    // Get evaluations
    const [evaluations] = await req.db.query(
      "SELECT e.*, p.first_name, p.last_name " +
      "FROM thesis_evaluations e " +
      "JOIN professors p ON e.professor_id = p.id " +
      "WHERE e.thesis_assignment_id = ?",
      [thesis.id],
    )

    // Calculate average grade if all evaluations are in
    let averageGrade = null
    if (evaluations.length === committeeMembers.length + 1) {
      // +1 for supervisor
      const sum = evaluations.reduce((total, eval) => total + Number.parseFloat(eval.final_grade), 0)
      averageGrade = (sum / evaluations.length).toFixed(1)
    }

    res.render("student/evaluation", {
      thesis,
      committeeMembers,
      evaluations,
      averageGrade,
    })
  } catch (error) {
    console.error("Evaluation view error:", error)
    req.flash("error", "Failed to load evaluation data")
    res.redirect("/student/dashboard")
  }
})

// Submit repository link
router.post("/thesis/repository", async (req, res) => {
  try {
    const studentId = req.session.user.roleId
    const { repositoryLink } = req.body

    // Get current thesis if exists
    const [theses] = await req.db.query(
      "SELECT * FROM thesis_assignments " + 'WHERE student_id = ? AND status = "under_review"',
      [studentId],
    )

    if (theses.length === 0) {
      req.flash("error", "You do not have a thesis under review")
      return res.redirect("/student/dashboard")
    }

    const thesis = theses[0]

    // Update repository link
    await req.db.query("UPDATE thesis_assignments SET repository_link = ? WHERE id = ?", [repositoryLink, thesis.id])

    req.flash("success", "Repository link submitted successfully")
    res.redirect("/student/thesis/evaluation")
  } catch (error) {
    console.error("Repository link error:", error)
    req.flash("error", "Failed to submit repository link")
    res.redirect("/student/thesis/evaluation")
  }
})

module.exports = router
