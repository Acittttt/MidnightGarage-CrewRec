-- ================================================================
-- Midnight Garage Crew Recruitment — Database Schema
-- Target: GCP Cloud SQL (MySQL 8.0+)
-- ================================================================

CREATE DATABASE IF NOT EXISTS midnight_garage
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE midnight_garage;

CREATE TABLE IF NOT EXISTS crew_applications (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name    VARCHAR(255)  NOT NULL,
  email        VARCHAR(320)  NOT NULL,
  ktp_url      TEXT          NOT NULL COMMENT 'Public GCS URL for the uploaded KTP/SIM file',
  submitted_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_email        (email),
  INDEX idx_submitted_at (submitted_at)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Crew application submissions for Midnight Garage';

-- Verify:
-- SELECT * FROM crew_applications ORDER BY submitted_at DESC;
