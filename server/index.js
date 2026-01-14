/**
 * index.js - Express Server Entry Point
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { initDatabase, run, get, all, insert, saveDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// ===== AUTH ROUTES =====

// Patient Login
app.post('/api/auth/patient/login', (req, res) => {
    const { email, password } = req.body;

    const patient = get('SELECT * FROM patients WHERE email = ?', [email]);

    if (!patient) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, patient.password_hash)) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return patient data (excluding password)
    const { password_hash, ...patientData } = patient;
    res.json({ success: true, user: patientData, role: 'patient' });
});

// Doctor Login
app.post('/api/auth/doctor/login', (req, res) => {
    const { email, password } = req.body;

    const doctor = get('SELECT * FROM doctors WHERE email = ?', [email]);

    if (!doctor) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, doctor.password_hash)) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return doctor data (excluding password)
    const { password_hash, ...doctorData } = doctor;
    res.json({ success: true, user: doctorData, role: 'doctor' });
});

// ===== PATIENT ROUTES =====

// Get patient by ID
app.get('/api/patients/:id', (req, res) => {
    const patient = get('SELECT id, email, full_name, phone, date_of_birth, gender, medical_history, created_at FROM patients WHERE id = ?', [parseInt(req.params.id)]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
});

// Get patient's appointments
app.get('/api/patients/:id/appointments', (req, res) => {
    const appointments = all(`
        SELECT a.*, d.full_name as doctor_name, d.specialty
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_time DESC
    `, [parseInt(req.params.id)]);
    res.json(appointments);
});

// Get patient's prescriptions
app.get('/api/patients/:id/prescriptions', (req, res) => {
    const prescriptions = all(`
        SELECT p.*, d.full_name as doctor_name
        FROM prescriptions p
        JOIN doctors d ON p.doctor_id = d.id
        WHERE p.patient_id = ?
        ORDER BY p.created_at DESC
    `, [parseInt(req.params.id)]);
    res.json(prescriptions);
});

// Update patient medical history
app.patch('/api/patients/:id/medical-history', (req, res) => {
    const { medical_history } = req.body;
    run('UPDATE patients SET medical_history = ? WHERE id = ?', [medical_history, parseInt(req.params.id)]);
    res.json({ success: true });
});

// ===== DOCTOR ROUTES =====

// Get all doctors
app.get('/api/doctors', (req, res) => {
    const doctors = all('SELECT id, full_name, specialty, rating, experience, image_url FROM doctors');
    res.json(doctors);
});

// Get doctor by ID
app.get('/api/doctors/:id', (req, res) => {
    const doctor = get('SELECT id, email, full_name, specialty, rating, experience, image_url, created_at FROM doctors WHERE id = ?', [parseInt(req.params.id)]);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
});

// Get doctor's appointments
app.get('/api/doctors/:id/appointments', (req, res) => {
    const appointments = all(`
        SELECT a.*, p.full_name as patient_name, p.medical_history
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.doctor_id = ?
        ORDER BY a.appointment_time DESC
    `, [parseInt(req.params.id)]);
    res.json(appointments);
});

// ===== APPOINTMENT ROUTES =====

// Create new appointment
app.post('/api/appointments', (req, res) => {
    const { patient_id, doctor_id, appointment_time, chat_history, ai_summary } = req.body;

    try {
        const id = insert(`
            INSERT INTO appointments (patient_id, doctor_id, appointment_time, chat_history, ai_summary)
            VALUES (?, ?, ?, ?, ?)
        `, [patient_id, doctor_id, appointment_time, chat_history, ai_summary]);

        res.json({ success: true, id });
    } catch (error) {
        console.error('Failed to create appointment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update appointment status
app.patch('/api/appointments/:id', (req, res) => {
    const { status, ai_summary } = req.body;

    if (status) {
        run('UPDATE appointments SET status = ? WHERE id = ?', [status, parseInt(req.params.id)]);
    }
    if (ai_summary) {
        run('UPDATE appointments SET ai_summary = ? WHERE id = ?', [ai_summary, parseInt(req.params.id)]);
    }

    res.json({ success: true });
});

// Get upcoming appointments (for dashboard)
app.get('/api/appointments/upcoming', (req, res) => {
    const appointments = all(`
        SELECT a.*, p.full_name as patient_name, d.full_name as doctor_name, d.specialty
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.status = 'upcoming'
        ORDER BY a.appointment_time ASC
    `);
    res.json(appointments);
});

// ===== PRESCRIPTION ROUTES =====

// Create prescription
app.post('/api/prescriptions', (req, res) => {
    const { patient_id, doctor_id, appointment_id, medicine, dosage, notes } = req.body;

    try {
        const id = insert(`
            INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, medicine, dosage, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [patient_id, doctor_id, appointment_id, medicine, dosage, notes]);

        res.json({ success: true, id });
    } catch (error) {
        console.error('Failed to create prescription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all prescriptions
app.get('/api/prescriptions', (req, res) => {
    const prescriptions = all(`
        SELECT p.*, pt.full_name as patient_name, d.full_name as doctor_name
        FROM prescriptions p
        JOIN patients pt ON p.patient_id = pt.id
        JOIN doctors d ON p.doctor_id = d.id
        ORDER BY p.created_at DESC
    `);
    res.json(prescriptions);
});

// ===== START SERVER =====

async function startServer() {
    await initDatabase();

    app.listen(PORT, () => {
        console.log(`
    ╔═══════════════════════════════════════╗
    ║   MedAssist Server Running!           ║
    ║   http://localhost:${PORT}               ║
    ╚═══════════════════════════════════════╝
        `);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
