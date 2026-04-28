// Public routes (no authentication required)
const express = require("express")
const router = express.Router()

// Get thesis presentations
router.get("/presentations", async (req, res) => {
  try {
    const startDate = req.query.start || new Date().toISOString().split("T")[0] // Default to today
    const endDate = req.query.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // Default to 30 days from now
    const format = req.query.format || "html" // Default to HTML

    // Get presentations within date range
    const [presentations] = await req.db.query(
      "SELECT tp.*, ta.id as thesis_id, tt.title, " +
        "s.first_name as student_first_name, s.last_name as student_last_name, " +
        "p.first_name as supervisor_first_name, p.last_name as supervisor_last_name " +
        "FROM thesis_presentations tp " +
        "JOIN thesis_assignments ta ON tp.thesis_assignment_id = ta.id " +
        "JOIN thesis_topics tt ON ta.thesis_topic_id = tt.id " +
        "JOIN students s ON ta.student_id = s.id " +
        "JOIN professors p ON ta.supervisor_id = p.id " +
        "WHERE tp.presentation_date BETWEEN ? AND ? " +
        "ORDER BY tp.presentation_date ASC",
      [new Date(startDate), new Date(endDate)],
    )

    // Get committee members for each presentation
    for (const presentation of presentations) {
      const [committeeMembers] = await req.db.query(
        "SELECT cm.*, p.first_name, p.last_name " +
          "FROM committee_members cm " +
          "JOIN professors p ON cm.professor_id = p.id " +
          'WHERE cm.thesis_assignment_id = ? AND cm.status = "accepted"',
        [presentation.thesis_id],
      )

      presentation.committeeMembers = committeeMembers
    }

    // Return data in requested format
    if (format === "json") {
      return res.json(presentations)
    } else if (format === "xml") {
      // Simple XML conversion
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<presentations>\n'

      for (const presentation of presentations) {
        xml += "  <presentation>\n"
        xml += `    <id>${presentation.id}</id>\n`
        xml += `    <title>${escapeXml(presentation.title)}</title>\n`
        xml += `    <student>${escapeXml(presentation.student_first_name + " " + presentation.student_last_name)}</student>\n`
        xml += `    <supervisor>${escapeXml(presentation.supervisor_first_name + " " + presentation.supervisor_last_name)}</supervisor>\n`
        xml += `    <date>${new Date(presentation.presentation_date).toISOString()}</date>\n`
        xml += `    <location>${escapeXml(presentation.location)}</location>\n`
        xml += `    <isOnline>${presentation.is_online ? "true" : "false"}</isOnline>\n`

        xml += "    <committeeMembers>\n"
        for (const member of presentation.committeeMembers) {
          xml += "      <member>\n"
          xml += `        <name>${escapeXml(member.first_name + " " + member.last_name)}</name>\n`
          xml += "      </member>\n"
        }
        xml += "    </committeeMembers>\n"

        xml += "  </presentation>\n"
      }

      xml += "</presentations>"

      res.set("Content-Type", "application/xml")
      return res.send(xml)
    } else {
      // HTML format
      return res.render("public/presentations", {
        presentations,
        startDate,
        endDate,
      })
    }
  } catch (error) {
    console.error("Presentations error:", error)
    if (req.query.format === "json") {
      return res.status(500).json({ error: "Failed to load presentations" })
    } else if (req.query.format === "xml") {
      res.set("Content-Type", "application/xml")
      return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to load presentations</error>')
    } else {
      return res.status(500).render("error", { error: "Failed to load presentations" })
    }
  }
})

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case "&":
        return "&amp;"
      case "'":
        return "&apos;"
      case '"':
        return "&quot;"
    }
  })
}

module.exports = router
