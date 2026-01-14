/**
 * db.js - SQLite Database Connection and Schema
 */

const Database = require('better-sqlite3');
const path = require('path');

// Create database in data folder
const dbPath = path.join(__dirname, '..', 'data', 'medassist.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeSchema() {
    db.exec(`
        -- Patients
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            date_of_birth DATE,
            gender TEXT CHECK(gender IN ('male', 'female', 'other')),
            medical_history TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Doctors
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            rating REAL DEFAULT 4.5,
            experience TEXT,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Appointments
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_time DATETIME,
            status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'completed', 'cancelled')),
            chat_history TEXT,
            ai_summary TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );

        -- Prescriptions
        CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_id INTEGER,
            medicine TEXT NOT NULL,
            dosage TEXT NOT NULL,
            notes TEXT,
            refill_status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id),
            FOREIGN KEY (appointment_id) REFERENCES appointments(id)
        );
    `);
    console.log('Database schema initialized');
}

// Initialize on load
initializeSchema();

module.exports = db;
