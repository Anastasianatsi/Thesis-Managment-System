const multer = require("multer")  // Middleware for handling multipart/form-data (file uploads)
const path = require("path")
const fs = require("fs")      


// Configure multer disk storage for file uploads
// This determines where uploaded files are stored and how they are named
const storage = multer.diskStorage({
  // Define the destination directory for uploaded files
  destination: (req, file, cb) => {
    // Create path to 'uploads' directory within current directory
    const dir = path.join(__dirname, "uploads")

    // Create the directory if it doesn't exist
    // recursive:true creates parent directories if needed
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Pass directory path to multer (null = no error)
    cb(null, dir)
  },

  // Define the filename for uploaded files
  filename: (req, file, cb) => {
    // Generate unique filename by prefixing timestamp to original filename
    // This prevents filename collisions when multiple files with the same name are uploaded
    cb(null, Date.now() + "-" + file.originalname)
  },
})

module.exports = { storage }