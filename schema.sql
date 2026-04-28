-- Create the database
CREATE DATABASE IF NOT EXISTS thesis_management;
USE thesis_management;

-- Users table (common fields for all user types)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role ENUM('student', 'professor', 'secretary') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    registration_number VARCHAR(20) NOT NULL UNIQUE, -- AM
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address TEXT,
    mobile_phone VARCHAR(20),
    home_phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Professors table
CREATE TABLE professors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Thesis topics
CREATE TABLE thesis_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    description_file VARCHAR(255), -- Path to PDF file
    professor_id INT NOT NULL,
    is_assigned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professors(id)
);

-- Thesis assignments
CREATE TABLE thesis_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_topic_id INT NOT NULL,
    student_id INT NOT NULL,
    supervisor_id INT NOT NULL, -- Main professor
    status ENUM('pending', 'active', 'under_review', 'completed', 'cancelled') DEFAULT 'pending',
    assignment_date TIMESTAMP NULL,
    completion_date TIMESTAMP NULL,
    cancellation_date TIMESTAMP NULL,
    cancellation_reason TEXT,
    faculty_meeting_number VARCHAR(50), -- ΑΠ from ΓΣ
    faculty_meeting_year VARCHAR(10),
    cancellation_meeting_number VARCHAR(50),
    cancellation_meeting_year VARCHAR(10),
    repository_link VARCHAR(255), -- Link to Nimertis
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_topic_id) REFERENCES thesis_topics(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (supervisor_id) REFERENCES professors(id)
);

-- Committee members
CREATE TABLE committee_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_assignment_id INT NOT NULL,
    professor_id INT NOT NULL,
    invitation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (thesis_assignment_id) REFERENCES thesis_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professors(id),
    UNIQUE(thesis_assignment_id, professor_id)
);

-- Professor notes
CREATE TABLE professor_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_assignment_id INT NOT NULL,
    professor_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_assignment_id) REFERENCES thesis_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professors(id)
);

-- Thesis submissions
CREATE TABLE thesis_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_assignment_id INT NOT NULL,
    document_path VARCHAR(255) NOT NULL, -- Path to uploaded document
    additional_links TEXT, -- JSON array of additional links
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_assignment_id) REFERENCES thesis_assignments(id) ON DELETE CASCADE
);

-- Thesis presentations
CREATE TABLE thesis_presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_assignment_id INT NOT NULL,
    presentation_date TIMESTAMP NOT NULL,
    location VARCHAR(255), -- Physical location or online link
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_assignment_id) REFERENCES thesis_assignments(id) ON DELETE CASCADE
);

-- Thesis evaluations
CREATE TABLE thesis_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_assignment_id INT NOT NULL,
    professor_id INT NOT NULL,
    content_quality DECIMAL(3,1) NOT NULL, -- Score for content quality
    presentation_quality DECIMAL(3,1) NOT NULL, -- Score for presentation quality
    technical_quality DECIMAL(3,1) NOT NULL, -- Score for technical quality
    innovation DECIMAL(3,1) NOT NULL, -- Score for innovation
    final_grade DECIMAL(3,1) NOT NULL, -- Final calculated grade
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_assignment_id) REFERENCES thesis_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professors(id),
    UNIQUE(thesis_assignment_id, professor_id)
);

-- Create default secretary account
INSERT INTO users (username, password, email, role) 
VALUES ('secretary', '$2b$10$1JXgNuV3XnSWVZIiY3vK9.9JVhJme15ZR6JmH9vV6PuM9gHTXBJlK', 'secretary@university.edu', 'secretary');
-- Password is 'secretary123'