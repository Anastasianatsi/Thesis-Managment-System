# Thesis Management System

A comprehensive system for managing university thesis projects, built with Node.js, Express, EJS, and MySQL.

## Features

- User authentication for Professors, Students, and Secretary staff
- Thesis topic creation and management
- Thesis assignment workflow
- Committee formation
- Progress tracking
- Evaluation and grading
- Statistics and reporting
- Public thesis presentation announcements

## Installation


1. Install dependencies:
npm install

1. Configure the database connection in `app.js`:
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_mysql_username',
  password: 'your_mysql_password',
  database: 'thesis_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

1. Initialize the database:

2. Start the application:
npm start

The application will be available at http://localhost:3000

## Default Users

After initializing the database, the following default users are created:

### Secretary
- Username: secretary
- Password: test

### Professors
- Username: jsmith@university.edu
- Password: test

(and several others with the same password)

### Students
- Username: edavis@university.edu
- Password: test

(and several others with their registration number as password)

## Project Structure

- `app.js` - Main application file
- `routes/` - Route handlers
- `views/` - EJS templates
- `public/` - Static files (CSS, JS, images)
- `database/` - Database schema and initialization scripts
- `uploads/` - Uploaded files

