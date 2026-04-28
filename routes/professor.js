// Professor routes
const express = require("express")
const router = express.Router()
const path = require("path")
const fs = require("fs")
const multer = require("multer")
const { storage } = require("../utils/storage")
const { Parser } = require('json2csv')


// Generate announcement for thesis presentation
router.get("/theses/announcement", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const thesisId = req.query.id

    console.log(req.query, 'herezz');

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
      "WHERE ta.id = ? AND (ta.supervisor_id = ? OR " +
      "ta.id IN (SELECT thesis_assignment_id FROM committee_members WHERE professor_id = ?))",
      [thesisId, professorId, professorId],
    )

    if (theses.length === 0) {
      req.flash("error", "Thesis not found or you do not have permission to view it")
      return res.redirect("/professor/theses")
    }

    const thesis = theses[0]

    // Get committee members
    const [committeeMembers] = await req.db.query(
      "SELECT cm.*, p.first_name, p.last_name " +
      "FROM committee_members cm " +
      "JOIN professors p ON cm.professor_id = p.id " +
      "WHERE cm.thesis_assignment_id = ? AND cm.status = 'accepted'",
      [thesisId],
    )

    // Get presentation details
    const [presentations] = await req.db.query(
      "SELECT * FROM thesis_presentations " + "WHERE thesis_assignment_id = ? " + "ORDER BY created_at DESC LIMIT 1",
      [thesisId],
    )

    if (presentations.length === 0) {
      req.flash("error", "No presentation details found for this thesis")
      return res.redirect(`/professor/theses/${thesisId}`)
    }

    const presentation = presentations[0]

    res.render("professor/announcement", {
      thesis,
      committeeMembers,
      presentation,
    })
  } catch (error) {
    console.error("Generate announcement error:", error)
    req.flash("error", "Failed to generate announcement")
    res.redirect(`/professor/theses/${req.params.id}`)
  }
})

// Professor dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const professorId = req.session.user.roleId

    // Get counts for dashboard stats
    const [pendingInvitations] = await req.db.query(
      "SELECT COUNT(*) as count FROM committee_members " + 'WHERE professor_id = ? AND status = "pending"',
      [professorId],
    )

    const [supervisingTheses] = await req.db.query(
      "SELECT COUNT(*) as count FROM thesis_assignments " +
      'WHERE supervisor_id = ? AND status IN ("active", "under_review")',
      [professorId],
    )

    const [committeeTheses] = await req.db.query(
      "SELECT COUNT(*) as count FROM committee_members cm " +
      "JOIN thesis_assignments ta ON cm.thesis_assignment_id = ta.id " +
      'WHERE cm.professor_id = ? AND cm.status = "accepted" ' +
      'AND ta.status IN ("active", "under_review")',
      [professorId],
    )

    res.render("professor/dashboard", {
      pendingInvitations: pendingInvitations[0].count,
      supervisingTheses: supervisingTheses[0].count,
      committeeTheses: committeeTheses[0].count,
    })
  } catch (error) {
    console.error("Professor dashboard error:", error)
    req.flash("error", "Failed to load dashboard data")
    res.render("professor/dashboard", { error: "Failed to load dashboard data" })
  }
})



// Export theses data as CSV or JSON
router.get("/theses/export", async (req, res) => {
  try {
    const { status = "all", format = "csv" } = req.query

    let query = `
      SELECT 
        ta.id AS assignment_id,
        tt.title AS thesis_title,
        ta.status,
        s.registration_number,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        p.first_name AS professor_first_name,
        p.last_name AS professor_last_name,
        ta.assignment_date,
        ta.completion_date,
        ta.repository_link
      FROM thesis_assignments ta
      JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id
      JOIN students s ON ta.student_id = s.id
      JOIN professors p ON ta.supervisor_id = p.id
    `
    const params = []
    if (status !== "all") {
      query += " WHERE ta.status = ?"
      params.push(status)
    }

    const [rows] = await req.db.query(query, params)

    if (format === "json") {
      res.setHeader("Content-Disposition", "attachment; filename=theses.json")
      return res.json(rows)
    } else {
      // Default to CSV
      const fields = [
        { label: "Assignment ID", value: "assignment_id" },
        { label: "Thesis Title", value: "thesis_title" },
        { label: "Status", value: "status" },
        { label: "Student Registration Number", value: "registration_number" },
        { label: "Student First Name", value: "student_first_name" },
        { label: "Student Last Name", value: "student_last_name" },
        { label: "Professor First Name", value: "professor_first_name" },
        { label: "Professor Last Name", value: "professor_last_name" },
        { label: "Assignment Date", value: "assignment_date" },
        { label: "Completion Date", value: "completion_date" },
        { label: "Repository Link", value: "repository_link" }
      ]
      const parser = new Parser({ fields })
      const csv = parser.parse(rows)
      res.header("Content-Type", "text/csv")
      res.attachment("theses.csv")
      return res.send(csv)
    }
  } catch (error) {
    console.error("Export error:", error)
    res.status(500).send("Failed to export theses")
  }
})

// List thesis topics
router.get("/topics", async (req, res) => {
  try {
    const professorId = req.session.user.roleId

    const [topics] = await req.db.query("SELECT * FROM thesis_topics WHERE professor_id = ? ORDER BY created_at DESC", [
      professorId,
    ])

    res.render("professor/topics", { topics })
  } catch (error) {
    console.error("List topics error:", error)
    req.flash("error", "Failed to load thesis topics")
    res.redirect("/professor/dashboard")
  }
})

// New thesis topic form
router.get("/topics/new", (req, res) => {
  res.render("professor/new-topic")
})
// Reuse the same multer config from app.js if needed:
// storage
const upload = multer({ storage })
// Create thesis topic
router.post("/topics", upload.single("description"), async (req, res) => {
  try {
    console.log('helzo');

    console.log("Creating topic with body:", req.body);
    console.log("Professor ID:", req.session);


    const professorId = req.session.user.roleId
    const { title, summary } = req.body
    let descriptionFile = null

    // Handle file upload if present
    if (req.file && req.file.fieldname === "description") {
      const file = req.file;

      descriptionFile = file.filename
    }

    // Insert into database
    await req.db.query(
      "INSERT INTO thesis_topics (title, summary, description_file, professor_id) VALUES (?, ?, ?, ?)",
      [title, summary, descriptionFile, professorId],
    )

    req.flash("success", "Thesis topic created successfully")
    res.redirect("/professor/topics")
  } catch (error) {
    console.error("Create topic error:", error)
    req.flash("error", "Failed to create thesis topic")
    res.redirect("/professor/topics/new")
  }
})

// Edit thesis topic form
router.get("/topics/:id/edit", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const topicId = req.params.id

    const [topics] = await req.db.query("SELECT * FROM thesis_topics WHERE id = ? AND professor_id = ?", [
      topicId,
      professorId,
    ])

    if (topics.length === 0) {
      req.flash("error", "Thesis topic not found or you do not have permission to edit it")
      return res.redirect("/professor/topics")
    }

    res.render("professor/edit-topic", { topic: topics[0] })
  } catch (error) {
    console.error("Edit topic error:", error)
    req.flash("error", "Failed to load thesis topic")
    res.redirect("/professor/topics")
  }
})

// Update thesis topic
router.put("/topics/:id", upload.single("description"), async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const topicId = req.params.id
    const { title, summary } = req.body
    console.log('helloo');

    console.log("lo:", req.body);


    // Check if topic exists and belongs to professor
    const [topics] = await req.db.query("SELECT * FROM thesis_topics WHERE id = ? AND professor_id = ?", [
      topicId,
      professorId,
    ])

    if (topics.length === 0) {
      req.flash("error", "Thesis topic not found or you do not have permission to edit it")
      return res.redirect("/professor/topics")
    }

    // initialize with old filename
    let descriptionFile = topics[0].description_file
    console.log('descriptionFile old:', descriptionFile);

    // Handle file upload if present
    if (req?.file && req?.file?.fieldname === "description") {
      descriptionFile = req.file.filename;
    
    }
  
    // Update database
    await req.db.query("UPDATE thesis_topics SET title = ?, summary = ?, description_file = ? WHERE id = ?", [
      title,
      summary,
      descriptionFile,
      topicId,
    ])
console.log('success', "Thesis topic updated successfully");

    req.flash("success", "Thesis topic updated successfully")
    res.redirect("/professor/topics")
  } catch (error) {
    console.error("Update topic error:", error)
    req.flash("error", "Failed to update thesis topic")
    res.redirect(`/professor/topics/${req.params.id}/edit`)
  }
})


// GET /professor/students - Return all students as JSON
router.get("/students", async (req, res) => {
  try {
    const [students] = await req.db.query(
      "SELECT id, first_name, last_name, registration_number FROM students"
    )
    res.json(students)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch students" })
  }
})


// Assign thesis to student form
router.get("/topics/:id/assign", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const topicId = req.params.id

    // Check if topic exists and belongs to professor
    const [topics] = await req.db.query("SELECT * FROM thesis_topics WHERE id = ? AND professor_id = ?", [
      topicId,
      professorId,
    ])

    if (topics.length === 0) {
      req.flash("error", "Thesis topic not found or you do not have permission to assign it")
      return res.redirect("/professor/topics")
    }

    if (topics[0].is_assigned) {
      req.flash("error", "This thesis topic is already assigned")
      return res.redirect("/professor/topics")
    }

    res.render("professor/assign-topic", { topic: topics[0] })
  } catch (error) {
    console.error("Assign topic form error:", error)
    req.flash("error", "Failed to load assignment form")
    res.redirect("/professor/topics")
  }
})

// Search students for assignment
router.get("/search-students", async (req, res) => {
  try {
    const query = req.query.q

    if (!query || query.length < 3) {
      return res.json([])
    }

    const [students] = await req.db.query(
      "SELECT s.id, s.registration_number, s.first_name, s.last_name " +
      "FROM students s " +
      "WHERE s.registration_number LIKE ? OR " +
      'CONCAT(s.first_name, " ", s.last_name) LIKE ?',
      [`%${query}%`, `%${query}%`],
    )

    res.json(students)
  } catch (error) {
    console.error("Search students error:", error)
    res.status(500).json({ error: "Failed to search students" })
  }
})

// Assign thesis to student
router.post("/topics/:id/assign", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const topicId = req.params.id
    const { studentId } = req.body

    console.log(req.body, 'ere');

    // Check if topic exists and belongs to professor
    const [topics] = await req.db.query("SELECT * FROM thesis_topics WHERE id = ? AND professor_id = ?", [
      topicId,
      professorId,
    ])

    if (topics.length === 0) {
      console.log("error", "Thesis topic not found or you do not have permission to assign it")
      req.flash("error", "Thesis topic not found or you do not have permission to assign it")
      return res.redirect("/professor/topics")
    }

    if (topics[0].is_assigned) {
      console.log("error", "This thesis topic is already assigned")
      req.flash("error", "This thesis topic is already assigned")
      return res.redirect("/professor/topics")
    }

    // Check if student exists
    const [students] = await req.db.query("SELECT * FROM students WHERE id = ?", [studentId])

    if (students.length === 0) {
      console.log("error", "Student not found")
      req.flash("error", "Student not found")
      return res.redirect(`/professor/topics/${topicId}/assign`)
    }

    // Check if student already has an active thesis
    const [activeTheses] = await req.db.query(
      "SELECT * FROM thesis_assignments " + 'WHERE student_id = ? AND status IN ("pending", "active", "under_review")',
      [studentId],
    )

    if (activeTheses.length > 0) {
      console.log("error", "This student already has an active thesis assignment")
      req.flash("error", "This student already has an active thesis assignment")
      return res.redirect(`/professor/topics/${topicId}/assign`)
    }


    // Create thesis assignment
    await req.db.query(
      "INSERT INTO thesis_assignments (thesis_topic_id, student_id, supervisor_id, status) " +
      'VALUES (?, ?, ?, "pending")',
      [topicId, studentId, professorId],
    )

    // Mark topic as assigned
    await req.db.query("UPDATE thesis_topics SET is_assigned = TRUE WHERE id = ?", [topicId])

    console.log("success", "Thesis topic assigned to student successfully")
    req.flash("success", "Thesis topic assigned to student successfully")
    res.redirect("/professor/theses")
  } catch (error) {
    console.error("Assign topic error:", error)
    console.log("error", "Failed to assign thesis topic")
    req.flash("error", "Failed to assign thesis topic")
    res.redirect(`/professor/topics/${req.params.id}/assign`)
  }
})

// List thesis assignments
router.get("/theses", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const status = req.query.status || "all"
    const role = req.query.role || "all"

    let query =
      "SELECT ta.*, tt.title, s.first_name as student_first_name, " +
      "s.last_name as student_last_name, s.registration_number " +
      "FROM thesis_assignments ta " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      "JOIN students s ON ta.student_id = s.id " +
      "WHERE "

    const queryParams = []

    if (role === "supervisor" || role === "all") {
      query += "(ta.supervisor_id = ? "
      queryParams.push(professorId)

      if (role === "all") {
        query +=
          'OR ta.id IN (SELECT thesis_assignment_id FROM committee_members WHERE professor_id = ? AND status = "accepted")'
        queryParams.push(professorId)
      }

      query += ") "
    } else if (role === "committee") {
      query +=
        'ta.id IN (SELECT thesis_assignment_id FROM committee_members WHERE professor_id = ? AND status = "accepted") '
      queryParams.push(professorId)
    }

    if (status !== "all") {
      query += "AND ta.status = ? "
      queryParams.push(status)
    }

    query += "ORDER BY ta.created_at DESC"

    const [theses] = await req.db.query(query, queryParams)

    res.render("professor/theses", { theses, status, role })
  } catch (error) {
    console.error("List theses error:", error)
    req.flash("error", "Failed to load thesis assignments")
    res.redirect("/professor/dashboard")
  }
})

// View thesis details
router.get("/theses/:id", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const thesisId = req.params.id

    // Get thesis details
    const [theses] = await req.db.query(
      "SELECT ta.*, tt.title, tt.summary, tt.description_file, " +
      "s.first_name as student_first_name, s.last_name as student_last_name, " +
      "s.registration_number, p.first_name as supervisor_first_name, " +
      "p.last_name as supervisor_last_name " +
      "FROM thesis_assignments ta " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      "JOIN students s ON ta.student_id = s.id " +
      "JOIN professors p ON ta.supervisor_id = p.id " +
      "WHERE ta.id = ? AND (ta.supervisor_id = ? OR " +
      "ta.id IN (SELECT thesis_assignment_id FROM committee_members WHERE professor_id = ?))",
      [thesisId, professorId, professorId],
    )

    if (theses.length === 0) {
      req.flash("error", "Thesis not found or you do not have permission to view it")
      return res.redirect("/professor/theses")
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

    // Get professor notes
    const [notes] = await req.db.query(
      "SELECT * FROM professor_notes " +
      "WHERE thesis_assignment_id = ? AND professor_id = ? " +
      "ORDER BY created_at DESC",
      [thesisId, professorId],
    )

    // Get thesis submission if exists
    const [submissions] = await req.db.query(
      "SELECT * FROM thesis_submissions " + "WHERE thesis_assignment_id = ? " + "ORDER BY created_at DESC LIMIT 1",
      [thesisId],
    )

    const submission = submissions.length > 0 ? submissions[0] : null
    console.log(submission);

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

    // Check if professor has already evaluated
    const hasEvaluated = evaluations.some((e) => e.professor_id === professorId)

    // Check if professor is supervisor
    const isSupervisor = thesis.supervisor_id === professorId

    res.render("professor/thesis-details", {
      thesis,
      committeeMembers,
      notes,
      submission,
      presentation,
      evaluations,
      hasEvaluated,
      isSupervisor,
    })
  } catch (error) {
    console.error("Thesis details error:", error)
    req.flash("error", "Failed to load thesis details")
    res.redirect("/professor/theses")
  }
})

// Cancel thesis assignment
router.post("/theses/:id/cancel", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const thesisId = req.params.id

    // Check if thesis exists and professor is supervisor
    const [theses] = await req.db.query("SELECT * FROM thesis_assignments WHERE id = ? AND supervisor_id = ?", [
      thesisId,
      professorId,
    ])

    if (theses.length === 0) {
      req.flash("error", "Thesis not found or you do not have permission to cancel it")
      return res.redirect("/professor/theses")
    }

    const thesis = theses[0]

    if (thesis.status !== "pending" && thesis.status !== "active") {
      req.flash("error", "Only pending or active thesis assignments can be cancelled")
      return res.redirect(`/professor/theses/${thesisId}`)
    }

    // Update thesis status
    await req.db.query(
      'UPDATE thesis_assignments SET status = "cancelled", ' +
      'cancellation_date = NOW(), cancellation_reason = "from professor" ' +
      "WHERE id = ?",
      [thesisId],
    )

    // Free up the topic
    await req.db.query(
      "UPDATE thesis_topics SET is_assigned = FALSE " +
      "WHERE id = (SELECT thesis_topic_id FROM thesis_assignments WHERE id = ?)",
      [thesisId],
    )

    // Delete the invitations the student made
    await req.db.query(
      "DELETE FROM committee_members WHERE thesis_assignment_id = ?",
      [thesisId],
    )

    req.flash("success", "Thesis assignment cancelled successfully")
    res.redirect("/professor/theses")
  } catch (error) {
    console.error("Cancel thesis error:", error)
    req.flash("error", "Failed to cancel thesis assignment")
    res.redirect(`/professor/theses/${req.params.id}`)
  }
})

// Add note to thesis
router.post("/theses/:id/notes", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const thesisId = req.params.id
    const { note } = req.body

    // Check if thesis exists and professor is involved
    const [theses] = await req.db.query(
      "SELECT * FROM thesis_assignments " +
      "WHERE id = ? AND (supervisor_id = ? OR " +
      'id IN (SELECT thesis_assignment_id FROM committee_members WHERE professor_id = ? AND status = "accepted"))',
      [thesisId, professorId, professorId],
    )

    if (theses.length === 0) {
      req.flash("error", "Thesis not found or you do not have permission to add notes")
      return res.redirect("/professor/theses")
    }

    // Add note
    await req.db.query("INSERT INTO professor_notes (thesis_assignment_id, professor_id, note) VALUES (?, ?, ?)", [
      thesisId,
      professorId,
      note,
    ])

    req.flash("success", "Note added successfully")
    res.redirect(`/professor/theses/${thesisId}`)
  } catch (error) {
    console.error("Add note error:", error)
    req.flash("error", "Failed to add note")
    res.redirect(`/professor/theses/${req.params.id}`)
  }
})

// Change thesis status to under review
router.post("/theses/:id/under-review", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const thesisId = req.params.id

    // Check if thesis exists and professor is supervisor
    const [theses] = await req.db.query("SELECT * FROM thesis_assignments WHERE id = ? AND supervisor_id = ?", [
      thesisId,
      professorId,
    ])

    if (theses.length === 0) {
      req.flash("error", "Thesis not found or you do not have permission to change its status")
      return res.redirect("/professor/theses")
    }

    const thesis = theses[0]

    if (thesis.status !== "active") {
      req.flash("error", "Only active thesis assignments can be moved to under review")
      return res.redirect(`/professor/theses/${thesisId}`)
    }

    // Update thesis status
    await req.db.query('UPDATE thesis_assignments SET status = "under_review" WHERE id = ?', [thesisId])

    req.flash("success", "Thesis status changed to under review successfully")
    res.redirect(`/professor/theses/${thesisId}`)
  } catch (error) {
    console.error("Change status error:", error)
    req.flash("error", "Failed to change thesis status")
    res.redirect(`/professor/theses/${req.params.id}`)
  }
})

// View invitations
router.get("/invitations", async (req, res) => {
  try {
    const professorId = req.session.user.roleId

    const [invitations] = await req.db.query(
      "SELECT cm.*, ta.id as thesis_id, tt.title, s.first_name as student_first_name, " +
      "s.last_name as student_last_name, p.first_name as supervisor_first_name, " +
      "p.last_name as supervisor_last_name " +
      "FROM committee_members cm " +
      "JOIN thesis_assignments ta ON cm.thesis_assignment_id = ta.id " +
      "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
      "JOIN students s ON ta.student_id = s.id " +
      "JOIN professors p ON ta.supervisor_id = p.id " +
      'WHERE cm.professor_id = ? AND cm.status = "pending" ' +
      "ORDER BY cm.invitation_date DESC",
      [professorId],
    )

    res.render("professor/invitations", { invitations })
  } catch (error) {
    console.error("Invitations error:", error)
    req.flash("error", "Failed to load invitations")
    res.redirect("/professor/dashboard")
  }
})

// Respond to invitation
router.post("/invitations/:id/respond", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const invitationId = req.params.id
    const { response } = req.body

    // Check if invitation exists and belongs to professor
    const [invitations] = await req.db.query("SELECT * FROM committee_members WHERE id = ? AND professor_id = ?", [
      invitationId,
      professorId,
    ])

    if (invitations.length === 0) {
      req.flash("error", "Invitation not found or you do not have permission to respond to it")
      return res.redirect("/professor/invitations")
    }

    const invitation = invitations[0]

    if (invitation.status !== "pending") {
      req.flash("error", "You have already responded to this invitation")
      return res.redirect("/professor/invitations")
    }

    // Update invitation status
    await req.db.query("UPDATE committee_members SET status = ?, response_date = NOW() WHERE id = ?", [
      response,
      invitationId,
    ])

    // Check if all committee members have accepted
    if (response === "accepted") {
      const [committeeCount] = await req.db.query(
        "SELECT COUNT(*) as count FROM committee_members " + 'WHERE thesis_assignment_id = ? AND status = "accepted"',
        [invitation.thesis_assignment_id],
      )

      // If 2 committee members have accepted, change thesis status to active
      if (committeeCount[0].count >= 2) {
        await req.db.query(
          'UPDATE thesis_assignments SET status = "active", assignment_date = NOW() ' +
          'WHERE id = ? AND status = "pending"',
          [invitation.thesis_assignment_id],
        )
      }
    }

    req.flash("success", `Invitation ${response === "accepted" ? "accepted" : "rejected"} successfully`)
    res.redirect("/professor/invitations")
  } catch (error) {
    console.error("Respond to invitation error:", error)
    req.flash("error", "Failed to respond to invitation")
    res.redirect("/professor/invitations")
  }
})

// Evaluate thesis
router.post("/theses/:id/evaluate", async (req, res) => {
  try {
    const professorId = req.session.user.roleId
    const thesisId = req.params.id
    const { contentQuality, presentationQuality, technicalQuality, innovation } = req.body

    // Check if thesis exists and professor is involved
    const [theses] = await req.db.query(
      "SELECT * FROM thesis_assignments " +
      "WHERE id = ? AND (supervisor_id = ? OR " +
      'id IN (SELECT thesis_assignment_id FROM committee_members WHERE professor_id = ? AND status = "accepted"))',
      [thesisId, professorId, professorId],
    )

    if (theses.length === 0) {
      req.flash("error", "Thesis not found or you do not have permission to evaluate it")
      return res.redirect("/professor/theses")
    }

    const thesis = theses[0]

    if (thesis.status !== "under_review") {
      req.flash("error", "Only theses under review can be evaluated")
      return res.redirect(`/professor/theses/${thesisId}`)
    }

    // Check if professor has already evaluated
    const [evaluations] = await req.db.query(
      "SELECT * FROM thesis_evaluations WHERE thesis_assignment_id = ? AND professor_id = ?",
      [thesisId, professorId],
    )

    if (evaluations.length > 0) {
      req.flash("error", "You have already evaluated this thesis")
      return res.redirect(`/professor/theses/${thesisId}`)
    }

    // Calculate final grade
    const finalGrade = (
      Number.parseFloat(contentQuality) * 0.4 +
      Number.parseFloat(presentationQuality) * 0.2 +
      Number.parseFloat(technicalQuality) * 0.3 +
      Number.parseFloat(innovation) * 0.1
    ).toFixed(1)

    // Add evaluation
    await req.db.query(
      "INSERT INTO thesis_evaluations " +
      "(thesis_assignment_id, professor_id, content_quality, presentation_quality, " +
      "technical_quality, innovation, final_grade) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [thesisId, professorId, contentQuality, presentationQuality, technicalQuality, innovation, finalGrade],
    )

    req.flash("success", "Thesis evaluated successfully")
    res.redirect(`/professor/theses/${thesisId}`)
  } catch (error) {
    console.error("Evaluate thesis error:", error)
    req.flash("error", "Failed to evaluate thesis")
    res.redirect(`/professor/theses/${req.params.id}`)
  }
})


module.exports = router
