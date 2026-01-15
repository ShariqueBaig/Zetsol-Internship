/**
 * index.js - Express Server Entry Point
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const { initDatabase, run, get, all, insert, saveDatabase } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
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

// Get available time slots for a doctor on a specific date
app.get('/api/doctors/:id/slots', (req, res) => {
    const doctorId = parseInt(req.params.id);
    const date = req.query.date; // Expected format: YYYY-MM-DD

    if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Generate all 30-minute slots from 9AM to 5PM
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Get booked appointments for this doctor on this date
    const bookedAppointments = all(`
        SELECT appointment_time FROM appointments 
        WHERE doctor_id = ? 
        AND date(appointment_time) = date(?)
        AND status = 'upcoming'
    `, [doctorId, date]);

    // Extract booked times (HH:MM format)
    const bookedTimes = bookedAppointments.map(a => {
        const time = new Date(a.appointment_time);
        return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    });

    // Return slots with availability status
    const slots = allSlots.map(time => ({
        time,
        available: !bookedTimes.includes(time)
    }));

    res.json(slots);
});

// ===== APPOINTMENT ROUTES =====

// Create new appointment
app.post('/api/appointments', (req, res) => {
    const { patient_id, doctor_id, appointment_time, chat_history, ai_summary } = req.body;

    console.log('[Appointment] Creating appointment:', { patient_id, doctor_id, appointment_time });

    // Validate required fields
    if (!patient_id || !doctor_id) {
        console.error('[Appointment] Missing required fields:', { patient_id, doctor_id });
        return res.status(400).json({ error: 'patient_id and doctor_id are required' });
    }

    // Verify patient exists
    const patient = get('SELECT id FROM patients WHERE id = ?', [patient_id]);
    if (!patient) {
        console.error('[Appointment] Patient not found:', patient_id);
        return res.status(400).json({ error: `Patient with ID ${patient_id} not found` });
    }

    // Verify doctor exists
    const doctor = get('SELECT id FROM doctors WHERE id = ?', [doctor_id]);
    if (!doctor) {
        console.error('[Appointment] Doctor not found:', doctor_id);
        return res.status(400).json({ error: `Doctor with ID ${doctor_id} not found` });
    }

    try {
        const id = insert(`
            INSERT INTO appointments (patient_id, doctor_id, appointment_time, chat_history, ai_summary)
            VALUES (?, ?, ?, ?, ?)
        `, [patient_id, doctor_id, appointment_time || new Date().toISOString(), chat_history, ai_summary]);

        console.log('[Appointment] Created successfully with ID:', id);
        res.json({ success: true, id });
    } catch (error) {
        console.error('[Appointment] Failed to create:', error);
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

// Track active consultation rooms
const consultationRooms = new Map();
// Track registered patients by their patient ID
const registeredPatients = new Map();

// Socket.io signaling for WebRTC
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Patient registers themselves when they login (so we can send them calls)
    socket.on('register-patient', ({ patientId, patientName }) => {
        socket.patientId = patientId;
        socket.patientName = patientName;
        registeredPatients.set(patientId, socket.id);
        console.log(`Patient registered: ${patientName} (ID: ${patientId})`);
    });

    // Doctor initiates a call - notify the patient
    socket.on('initiate-call', ({ appointmentId, patientId, doctorName }) => {
        console.log(`Doctor ${doctorName} initiating call for appointment ${appointmentId} to patient ${patientId}`);

        // Find the patient's socket
        const patientSocketId = registeredPatients.get(patientId);
        if (patientSocketId) {
            io.to(patientSocketId).emit('incoming-call', {
                appointmentId,
                doctorName,
                roomId: `consultation-${appointmentId}`
            });
            console.log(`Sent incoming-call to patient socket: ${patientSocketId}`);
        } else {
            console.log(`Patient ${patientId} not online`);
            socket.emit('patient-offline');
        }
    });

    // Join a consultation room (room = appointmentId)
    socket.on('join-room', ({ roomId, role, userName }) => {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.role = role;
        socket.userName = userName;

        // Track room participants
        if (!consultationRooms.has(roomId)) {
            consultationRooms.set(roomId, { doctor: null, patient: null, transcript: [] });
        }
        const room = consultationRooms.get(roomId);
        room[role] = socket.id;

        console.log(`${role} (${userName}) joined room ${roomId}`);

        // Notify others in room
        socket.to(roomId).emit('user-joined', { role, userName, socketId: socket.id });

        // If both parties are in room, start the call
        if (room.doctor && room.patient) {
            io.to(roomId).emit('ready-to-call');
        }
    });

    // WebRTC Signaling: Offer
    socket.on('offer', ({ roomId, offer }) => {
        socket.to(roomId).emit('offer', { offer, from: socket.id });
    });

    // WebRTC Signaling: Answer
    socket.on('answer', ({ roomId, answer }) => {
        socket.to(roomId).emit('answer', { answer, from: socket.id });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('ice-candidate', ({ roomId, candidate }) => {
        socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
    });

    // Live transcript update
    socket.on('transcript', ({ roomId, speaker, text }) => {
        const room = consultationRooms.get(roomId);
        if (room) {
            room.transcript.push({ speaker, text, timestamp: new Date().toISOString() });
            // Broadcast to all in room
            io.to(roomId).emit('transcript-update', { speaker, text });
        }
    });

    // Request AI hints based on transcript
    socket.on('request-ai-hints', async ({ roomId, medicalHistory }) => {
        const room = consultationRooms.get(roomId);
        if (!room) return;

        const transcriptText = room.transcript
            .map(t => `${t.speaker}: ${t.text}`)
            .join('\n');

        // Emit to requesting socket (doctor)
        socket.emit('ai-hints-processing');

        try {
            // Note: We'll make the AI call from frontend to avoid exposing API key
            // Just send back the transcript for frontend to process
            socket.emit('ai-hints-data', { transcript: transcriptText, medicalHistory });
        } catch (error) {
            socket.emit('ai-hints-error', { error: error.message });
        }
    });

    // End call
    socket.on('end-call', ({ roomId }) => {
        const room = consultationRooms.get(roomId);
        if (room) {
            // Save transcript to appointment
            const transcriptText = room.transcript
                .map(t => `${t.speaker}: ${t.text}`)
                .join('\n');

            // Notify all participants
            io.to(roomId).emit('call-ended', { transcript: transcriptText });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        if (socket.roomId) {
            socket.to(socket.roomId).emit('user-left', { role: socket.role });
        }
    });
});

async function startServer() {
    await initDatabase();

    server.listen(PORT, () => {
        console.log(`
    ╔═══════════════════════════════════════╗
    ║   MedAssist Server Running!           ║
    ║   http://localhost:${PORT}               ║
    ║   Socket.io: Enabled                  ║
    ╚═══════════════════════════════════════╝
        `);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
