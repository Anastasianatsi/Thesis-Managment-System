-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: thesis_management
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `committee_members`
--

DROP TABLE IF EXISTS `committee_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committee_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thesis_assignment_id` int(11) NOT NULL,
  `professor_id` int(11) NOT NULL,
  `invitation_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `response_date` timestamp NULL DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `thesis_assignment_id` (`thesis_assignment_id`,`professor_id`),
  KEY `professor_id` (`professor_id`),
  CONSTRAINT `committee_members_ibfk_1` FOREIGN KEY (`thesis_assignment_id`) REFERENCES `thesis_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `committee_members_ibfk_2` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_members`
--

LOCK TABLES `committee_members` WRITE;
/*!40000 ALTER TABLE `committee_members` DISABLE KEYS */;
INSERT INTO `committee_members` VALUES (1,2,1,'2025-04-17 11:13:13','2025-04-17 11:13:13','accepted'),(2,2,3,'2025-04-17 11:13:13','2025-04-17 11:13:13','accepted'),(3,3,1,'2025-04-17 11:13:13','2025-04-17 11:13:13','accepted'),(4,3,3,'2025-04-17 11:13:13','2025-04-17 11:13:13','accepted'),(5,4,1,'2025-04-17 11:13:13','2025-04-17 11:13:13','accepted'),(6,4,3,'2025-04-17 11:13:13','2025-04-17 11:13:13','accepted'),(7,9,1,'2025-05-30 13:07:27','2025-05-30 13:11:09','accepted'),(8,9,2,'2025-05-30 13:07:30','2025-05-30 13:10:12','accepted'),(9,9,4,'2025-05-30 13:07:33','2025-05-30 13:09:54','accepted'),(10,9,5,'2025-05-30 13:07:35','2025-05-30 13:09:38','accepted');
/*!40000 ALTER TABLE `committee_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professor_notes`
--

DROP TABLE IF EXISTS `professor_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `professor_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thesis_assignment_id` int(11) NOT NULL,
  `professor_id` int(11) NOT NULL,
  `note` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `thesis_assignment_id` (`thesis_assignment_id`),
  KEY `professor_id` (`professor_id`),
  CONSTRAINT `professor_notes_ibfk_1` FOREIGN KEY (`thesis_assignment_id`) REFERENCES `thesis_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `professor_notes_ibfk_2` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professor_notes`
--

LOCK TABLES `professor_notes` WRITE;
/*!40000 ALTER TABLE `professor_notes` DISABLE KEYS */;
INSERT INTO `professor_notes` VALUES (1,2,1,'tryerghd','2025-04-17 12:33:34'),(2,2,1,'asfadsfadf','2025-04-17 12:33:38'),(3,9,3,'test','2025-05-30 13:19:30');
/*!40000 ALTER TABLE `professor_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professors`
--

DROP TABLE IF EXISTS `professors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `professors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `department` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `professors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professors`
--

LOCK TABLES `professors` WRITE;
/*!40000 ALTER TABLE `professors` DISABLE KEYS */;
INSERT INTO `professors` VALUES (1,2,'John','Smith','Computer Science'),(2,3,'Maria','Garcia','Computer Engineering'),(3,4,'David','Johnson','Software Engineering'),(4,5,'Sarah','Williams','Information Systems'),(5,6,'Michael','Brown','Artificial Intelligence');
/*!40000 ALTER TABLE `professors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `registration_number` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `address` text DEFAULT NULL,
  `mobile_phone` varchar(20) DEFAULT NULL,
  `home_phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registration_number` (`registration_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,7,'20180001','Emma','Davis',NULL,NULL,NULL),(2,8,'20180002','James','Wilson',NULL,NULL,NULL),(3,9,'20180003','Olivia','Taylor',NULL,NULL,NULL),(4,10,'20180004','William','Thomas','Τιτος','698888888',''),(5,11,'20180005','Sophia','Roberts',NULL,NULL,NULL),(6,12,'20180006','Benjamin','Nelson',NULL,NULL,NULL),(7,13,'20180007','Isabella','Clark',NULL,NULL,NULL),(8,14,'20180008','Lucas','Lewis',NULL,NULL,NULL),(9,15,'20180009','Mia','Walker',NULL,NULL,NULL),(10,16,'20180010','Henry','Hall',NULL,NULL,NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thesis_assignments`
--

DROP TABLE IF EXISTS `thesis_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `thesis_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thesis_topic_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `supervisor_id` int(11) NOT NULL,
  `status` enum('pending','active','under_review','completed','cancelled') DEFAULT 'pending',
  `assignment_date` timestamp NULL DEFAULT NULL,
  `completion_date` timestamp NULL DEFAULT NULL,
  `cancellation_date` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `faculty_meeting_number` varchar(50) DEFAULT NULL,
  `faculty_meeting_year` varchar(10) DEFAULT NULL,
  `cancellation_meeting_number` varchar(50) DEFAULT NULL,
  `cancellation_meeting_year` varchar(10) DEFAULT NULL,
  `repository_link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `thesis_topic_id` (`thesis_topic_id`),
  KEY `student_id` (`student_id`),
  KEY `supervisor_id` (`supervisor_id`),
  CONSTRAINT `thesis_assignments_ibfk_1` FOREIGN KEY (`thesis_topic_id`) REFERENCES `thesis_topics` (`id`),
  CONSTRAINT `thesis_assignments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `thesis_assignments_ibfk_3` FOREIGN KEY (`supervisor_id`) REFERENCES `professors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thesis_assignments`
--

LOCK TABLES `thesis_assignments` WRITE;
/*!40000 ALTER TABLE `thesis_assignments` DISABLE KEYS */;
INSERT INTO `thesis_assignments` VALUES (1,18,1,1,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-04-17 11:13:13'),(2,2,2,2,'cancelled','2025-04-17 11:13:13',NULL,'2025-05-30 12:45:40','sdfadsf','23235rf','2025','292','2025',NULL,'2025-04-17 11:13:13'),(3,6,3,2,'under_review','2024-10-17 11:13:13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-04-17 11:13:13'),(4,9,4,2,'completed','2024-04-17 11:13:13','2025-04-17 11:13:13',NULL,NULL,NULL,NULL,NULL,NULL,'https://repository.university.edu/thesis/123456','2025-04-17 11:13:13'),(5,4,5,4,'cancelled','2024-08-17 11:13:13',NULL,'2025-03-17 12:13:13','Student requested cancellation due to change of research interests',NULL,NULL,NULL,NULL,NULL,'2025-04-17 11:13:13'),(6,19,10,3,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-05-30 11:41:23'),(7,20,7,3,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-05-30 11:49:00'),(8,21,2,3,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-05-30 12:48:03'),(9,22,4,3,'under_review','2025-05-30 13:09:54',NULL,NULL,NULL,'15616','2025',NULL,NULL,NULL,'2025-05-30 12:58:12');
/*!40000 ALTER TABLE `thesis_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thesis_evaluations`
--

DROP TABLE IF EXISTS `thesis_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `thesis_evaluations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thesis_assignment_id` int(11) NOT NULL,
  `professor_id` int(11) NOT NULL,
  `content_quality` decimal(3,1) NOT NULL,
  `presentation_quality` decimal(3,1) NOT NULL,
  `technical_quality` decimal(3,1) NOT NULL,
  `innovation` decimal(3,1) NOT NULL,
  `final_grade` decimal(3,1) NOT NULL,
  `evaluation_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `thesis_assignment_id` (`thesis_assignment_id`,`professor_id`),
  KEY `professor_id` (`professor_id`),
  CONSTRAINT `thesis_evaluations_ibfk_1` FOREIGN KEY (`thesis_assignment_id`) REFERENCES `thesis_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `thesis_evaluations_ibfk_2` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thesis_evaluations`
--

LOCK TABLES `thesis_evaluations` WRITE;
/*!40000 ALTER TABLE `thesis_evaluations` DISABLE KEYS */;
INSERT INTO `thesis_evaluations` VALUES (1,4,2,9.0,8.5,9.0,8.0,8.8,'2025-04-17 11:13:13'),(2,4,1,8.5,9.0,8.0,8.5,8.5,'2025-04-17 11:13:13'),(3,4,3,9.0,8.0,8.5,9.0,8.7,'2025-04-17 11:13:13');
/*!40000 ALTER TABLE `thesis_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thesis_presentations`
--

DROP TABLE IF EXISTS `thesis_presentations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `thesis_presentations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thesis_assignment_id` int(11) NOT NULL,
  `presentation_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `location` varchar(255) DEFAULT NULL,
  `is_online` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `thesis_assignment_id` (`thesis_assignment_id`),
  CONSTRAINT `thesis_presentations_ibfk_1` FOREIGN KEY (`thesis_assignment_id`) REFERENCES `thesis_assignments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thesis_presentations`
--

LOCK TABLES `thesis_presentations` WRITE;
/*!40000 ALTER TABLE `thesis_presentations` DISABLE KEYS */;
INSERT INTO `thesis_presentations` VALUES (1,9,'2025-05-30 08:11:00','asdfsadf ',0,'2025-05-30 13:23:17');
/*!40000 ALTER TABLE `thesis_presentations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thesis_submissions`
--

DROP TABLE IF EXISTS `thesis_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `thesis_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thesis_assignment_id` int(11) NOT NULL,
  `document_path` varchar(255) NOT NULL,
  `additional_links` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `thesis_assignment_id` (`thesis_assignment_id`),
  CONSTRAINT `thesis_submissions_ibfk_1` FOREIGN KEY (`thesis_assignment_id`) REFERENCES `thesis_assignments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thesis_submissions`
--

LOCK TABLES `thesis_submissions` WRITE;
/*!40000 ALTER TABLE `thesis_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `thesis_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thesis_topics`
--

DROP TABLE IF EXISTS `thesis_topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `thesis_topics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `summary` text NOT NULL,
  `description_file` varchar(255) DEFAULT NULL,
  `professor_id` int(11) NOT NULL,
  `is_assigned` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `professor_id` (`professor_id`),
  CONSTRAINT `thesis_topics_ibfk_1` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thesis_topics`
--

LOCK TABLES `thesis_topics` WRITE;
/*!40000 ALTER TABLE `thesis_topics` DISABLE KEYS */;
INSERT INTO `thesis_topics` VALUES (1,'','',NULL,1,1,'2025-04-17 11:13:13'),(2,'Blockchain for Supply Chain Management','Implementing blockchain technology to enhance transparency in supply chains.',NULL,2,0,'2025-04-17 11:13:13'),(3,'Natural Language Processing for Sentiment Analysis','Developing NLP models to analyze sentiment in social media data.',NULL,5,0,'2025-04-17 11:13:13'),(4,'Internet of Things for Smart Cities','Designing IoT systems to improve urban infrastructure and services.',NULL,4,0,'2025-04-17 11:13:13'),(5,'Cybersecurity in Cloud Computing','Investigating security challenges and solutions in cloud environments.',NULL,5,0,'2025-04-17 11:13:13'),(6,'Virtual Reality for Education','Creating VR applications to enhance learning experiences.',NULL,2,1,'2025-04-17 11:13:13'),(7,'Big Data Analytics for Business Intelligence','Utilizing big data techniques to derive business insights.',NULL,5,0,'2025-04-17 11:13:13'),(8,'Quantum Computing Algorithms','Researching and implementing quantum algorithms for specific problems.',NULL,4,0,'2025-04-17 11:13:13'),(9,'Autonomous Vehicles Navigation Systems','Developing navigation algorithms for self-driving vehicles.',NULL,2,1,'2025-04-17 11:13:13'),(10,'Artificial Intelligence in Game Development','Implementing AI techniques to create intelligent game characters.',NULL,4,0,'2025-04-17 11:13:13'),(11,'Bioinformatics for Genomic Data Analysis','Applying computational methods to analyze genomic data.',NULL,5,0,'2025-04-17 11:13:13'),(12,'Augmented Reality for Retail','Creating AR applications to enhance shopping experiences.',NULL,5,0,'2025-04-17 11:13:13'),(17,'jsmith@university.edu','jsmith@university.edu',NULL,1,0,'2025-05-15 16:27:10'),(18,'test','test',NULL,3,1,'2025-05-30 08:02:18'),(19,'qqqtest','qqqtest',NULL,3,1,'2025-05-30 08:07:03'),(20,'vdsgd','fsdfgsdg',NULL,3,1,'2025-05-30 11:46:01'),(21,'asdfasdf','asdfasdf',NULL,3,1,'2025-05-30 11:49:10'),(22,'traza','sdfsdf',NULL,3,1,'2025-05-30 12:58:07');
/*!40000 ALTER TABLE `thesis_topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('student','professor','secretary') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'secretary','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','secretary@university.edu','secretary','2025-04-17 11:13:11'),(2,'jsmith@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','jsmith@university.edu','professor','2025-04-17 11:13:12'),(3,'mgarcia@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','mgarcia@university.edu','professor','2025-04-17 11:13:12'),(4,'djohnson@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','djohnson@university.edu','professor','2025-04-17 11:13:12'),(5,'swilliams@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','swilliams@university.edu','professor','2025-04-17 11:13:12'),(6,'mbrown@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','mbrown@university.edu','professor','2025-04-17 11:13:12'),(7,'edavis@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','edavis@university.edu','student','2025-04-17 11:13:12'),(8,'jwilson@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','jwilson@university.edu','student','2025-04-17 11:13:12'),(9,'otaylor@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','otaylor@university.edu','student','2025-04-17 11:13:12'),(10,'wthomas@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','wthomas@university.edu','student','2025-04-17 11:13:12'),(11,'sroberts@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','sroberts@university.edu','student','2025-04-17 11:13:13'),(12,'bnelson@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','bnelson@university.edu','student','2025-04-17 11:13:13'),(13,'iclark@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','iclark@university.edu','student','2025-04-17 11:13:13'),(14,'llewis@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','llewis@university.edu','student','2025-04-17 11:13:13'),(15,'mwalker@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','mwalker@university.edu','student','2025-04-17 11:13:13'),(16,'hhall@university.edu','$2a$12$6ce788DNBlC3yV3GKT6WaeP9PwRcJVM88h2WaHGPaJh179tLIXvtu','hhall@university.edu','student','2025-04-17 11:13:13');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'thesis_management'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-30 16:33:17
