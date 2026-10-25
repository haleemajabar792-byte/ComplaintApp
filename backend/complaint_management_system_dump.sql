-- Complaint Management System Database Dump
-- Generated on: 2026-10-25T21:34:22.201Z

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `AdminID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Role` varchar(50) DEFAULT NULL,
  `DepartmentID` int DEFAULT NULL,
  PRIMARY KEY (`AdminID`),
  UNIQUE KEY `Email` (`Email`),
  KEY `DepartmentID` (`DepartmentID`),
  CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`DepartmentID`) REFERENCES `department` (`DepartmentID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `admin` (`AdminID`, `Name`, `Email`, `Password`, `Role`, `DepartmentID`) VALUES
  (1, 'System Admin', 'admin@instisolve.com', '$2b$10$uSkIxjyNRY5yIZT2q86p1OGkBaiIgLUyhUg1iFtnCe1PpKUXGserm', 'admin', NULL);

DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(100) NOT NULL,
  `Description` text,
  PRIMARY KEY (`CategoryID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `category` (`CategoryID`, `CategoryName`, `Description`) VALUES
  (1, 'Academic', 'Academic issues and concerns'),
  (2, 'Hostel', 'Hostel and accommodation issues'),
  (3, 'Transport', 'Transport and commute issues'),
  (4, 'Facilities', 'Infrastructure and facilities issues'),
  (5, 'Administration', 'Administrative and procedural issues');

DROP TABLE IF EXISTS `complaint`;
CREATE TABLE `complaint` (
  `ComplaintID` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(200) NOT NULL,
  `Description` text NOT NULL,
  `DateSubmitted` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Status` enum('Pending','In Progress','Resolved','Closed') DEFAULT 'Pending',
  `StudentID` int NOT NULL,
  `CategoryID` int NOT NULL,
  `DepartmentID` int DEFAULT NULL,
  PRIMARY KEY (`ComplaintID`),
  KEY `StudentID` (`StudentID`),
  KEY `CategoryID` (`CategoryID`),
  KEY `DepartmentID` (`DepartmentID`),
  CONSTRAINT `complaint_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `student` (`StudentID`),
  CONSTRAINT `complaint_ibfk_2` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`),
  CONSTRAINT `complaint_ibfk_3` FOREIGN KEY (`DepartmentID`) REFERENCES `department` (`DepartmentID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `complaint` (`ComplaintID`, `Title`, `Description`, `DateSubmitted`, `Status`, `StudentID`, `CategoryID`, `DepartmentID`) VALUES
  (1, 'Classroom AC is not working', 'The air conditioning in room 301 has been broken for 3 days. Students are unable to concentrate due to the heat. Please fix this urgently.', '2026-05-25 12:11:30', 'In Progress', 1, 1, 1),
  (2, 'Classroom AC is not working', 'The air conditioning in room 301 has been broken for 3 days. Students are unable to concentrate due to the heat. Please fix this urgently.', '2026-05-26 19:01:54', 'Pending', 1, 1, NULL),
  (3, 'Clean water not available', 'In uni at gate 6 no clean water available to drink', '2026-05-28 22:46:22', 'Pending', 1, 4, NULL),
  (4, 'Not enough fans in classroom 10 of department software engineer', 'The classroom is too big but only 2 fans are there.', '2026-05-29 13:14:38', 'Pending', 1, 4, NULL),
  (5, 'No clean water', 'No water available for students at gate 6', '2026-06-01 21:40:27', 'Pending', 1, 4, NULL),
  (6, 'No water available', 'No water available for students at gate 6', '2026-06-01 21:41:33', 'Pending', 1, 4, NULL),
  (7, 'Late bus schedule', 'No good schedule of buses in uni', '2026-06-01 22:19:20', 'Pending', 1, 3, NULL),
  (8, 'Too much exam fees', 'High exam fee in summer', '2026-06-02 21:36:28', 'Pending', 1, 1, NULL),
  (9, 'No summer holidays', 'Hostel students wants to go home so plz give summer holidays', '2026-06-02 21:48:28', 'In Progress', 1, 1, NULL),
  (10, 'No ac working', 'No ac working in class ten', '2026-06-03 06:26:16', 'Pending', 7, 4, NULL);

DROP TABLE IF EXISTS `department`;
CREATE TABLE `department` (
  `DepartmentID` int NOT NULL AUTO_INCREMENT,
  `DepartmentName` varchar(100) NOT NULL,
  `OfficeLocation` varchar(150) DEFAULT NULL,
  `ContactEmail` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`DepartmentID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `department` (`DepartmentID`, `DepartmentName`, `OfficeLocation`, `ContactEmail`) VALUES
  (1, 'Academic Affairs', 'Block A', 'academic@institute.edu'),
  (2, 'Hostel Management', 'Block B', 'hostel@institute.edu'),
  (3, 'Transportation', 'Block C', 'transport@institute.edu'),
  (4, 'Facilities', 'Block D', 'facilities@institute.edu'),
  (5, 'Administration', 'Block E', 'admin@institute.edu');

DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `FeedbackID` int NOT NULL AUTO_INCREMENT,
  `ComplaintID` int NOT NULL,
  `StudentID` int NOT NULL,
  `Rating` int DEFAULT NULL,
  `Comments` text,
  `FeedbackDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`FeedbackID`),
  KEY `ComplaintID` (`ComplaintID`),
  KEY `StudentID` (`StudentID`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`ComplaintID`) REFERENCES `complaint` (`ComplaintID`),
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `student` (`StudentID`),
  CONSTRAINT `feedback_chk_1` CHECK (((`Rating` >= 1) and (`Rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `ComplaintID` int NOT NULL,
  `RecipientID` int NOT NULL,
  `Message` text NOT NULL,
  `DateSent` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Status` enum('Sent','Read') DEFAULT 'Sent',
  PRIMARY KEY (`NotificationID`),
  KEY `ComplaintID` (`ComplaintID`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`ComplaintID`) REFERENCES `complaint` (`ComplaintID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `student`;
CREATE TABLE `student` (
  `StudentID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `ContactNo` varchar(15) DEFAULT NULL,
  `RegistrationNo` varchar(50) DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`StudentID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `student` (`StudentID`, `Name`, `Email`, `Password`, `ContactNo`, `RegistrationNo`, `CreatedAt`) VALUES
  (1, 'Hassan Ali', 'hassan@student.edu', '$2b$10$HqKBopIawrFGFQRDhbsvrOABnGwQcp4pcCV9kDToAmOWPcWnlIoT.', '03001234567', 'ST-2024-001', '2026-05-23 14:54:25'),
  (2, 'Faris', 'faris@iot.edu', '$2b$10$64UfrDSwRuiNEQVKDFe0g.X5BV/rC/Pb1GcJbYtwX81/ciB3Oa2oO', '03008569258', 'Institute of Technology (IoT)', '2026-06-02 21:52:16'),
  (7, 'Ali', 'ali@iout.edu', '$2b$10$U9jo/PsD/RdCSj9nTGtNIu4lWfaMtQCrnRhh1prWfZ3.rvAA.L.HG', '03005693', 'Business School (IBS)', '2026-06-02 23:04:40'),
  (17, 'Test User', 'newstudent@test.edu', '$2b$10$LuCkm8bj17LbP55Y06qhXe/lkm9aDlekS37NxspRB4vsV1UiEjSCS', '03009998877', 'Institute of Technology (IoT)', '2026-06-03 04:27:54');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `institute` varchar(150) NOT NULL,
  `role` enum('student','admin') DEFAULT 'student',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `institute`, `role`, `created_at`, `updated_at`) VALUES
  (1, 'Ali', 'ali@iout.edu', '$2b$10$U9jo/PsD/RdCSj9nTGtNIu4lWfaMtQCrnRhh1prWfZ3.rvAA.L.HG', '03005269652', 'Institute of Technology (IoT)', 'student', '2026-05-31 11:53:43', '2026-06-03 04:26:50'),
  (2, 'Faris', 'faris@iot.edu', '$2b$10$64UfrDSwRuiNEQVKDFe0g.X5BV/rC/Pb1GcJbYtwX81/ciB3Oa2oO', '03008569258', 'Institute of Technology (IoT)', 'student', '2026-06-02 15:27:34', '2026-06-02 15:27:34'),
  (4, 'Test User', 'newstudent@test.edu', '$2b$10$LuCkm8bj17LbP55Y06qhXe/lkm9aDlekS37NxspRB4vsV1UiEjSCS', '03009998877', 'Institute of Technology (IoT)', 'student', '2026-06-03 04:27:54', '2026-06-03 04:27:54');

SET FOREIGN_KEY_CHECKS = 1;
