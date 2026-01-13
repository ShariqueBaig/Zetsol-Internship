/**
 * storage.js
 * 
 * This file acts as our "Database Layer" for the MVP.
 * We use localStorage to persist data across page reloads.
 * 
 * key concepts:
 * - LocalStorage: Browser's built-in key-value store.
 * - JSON.stringify/parse: Converting objects to strings for storage.
 */

const DB_KEYS = {
    APPOINTMENTS: 'medassist_appointments',
    PRESCRIPTIONS: 'medassist_prescriptions',
    PATIENTS: 'medassist_patients',
    DOCTORS: 'medassist_doctors'
};

const StorageService = {
    // Initialize with some dummy data
    init() {
        // FORCE UPDATE for Dev/Testing: Always re-init doctors to ensure new diverse list is loaded
        this.initializeDoctors();

        if (!localStorage.getItem(DB_KEYS.APPOINTMENTS)) {
            localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify([]));
        }

        if (!localStorage.getItem(DB_KEYS.PRESCRIPTIONS)) {
            localStorage.setItem(DB_KEYS.PRESCRIPTIONS, JSON.stringify([]));
        }
    },

    initializeDoctors() {
        const doctors = [
            {
                id: 1,
                name: 'Dr. Sarah Chen',
                specialty: 'General Physician',
                rating: 4.8,
                experience: '12 years',
                image: 'doctor1.png'
            },
            {
                id: 2,
                name: 'Dr. Michael Ross',
                specialty: 'Cardiologist',
                rating: 4.9,
                experience: '20 years',
                image: 'doctor2.png'
            },
            {
                id: 3,
                name: 'Dr. Emily Watson',
                specialty: 'Dermatologist',
                rating: 4.7,
                experience: '8 years',
                image: 'doctor3.png'
            },
            {
                id: 4,
                name: 'Dr. James Lee',
                specialty: 'Pediatrician',
                rating: 4.9,
                experience: '15 years',
                image: 'doctor4.png'
            },
            {
                id: 5,
                name: 'Dr. Linda Martinez',
                specialty: 'Neurologist',
                rating: 4.8,
                experience: '18 years',
                image: 'doctor5.png'
            },
            {
                id: 6,
                name: 'Dr. Robert Pat',
                specialty: 'General Physician',
                rating: 4.6,
                experience: '5 years',
                image: 'doctor1.png'
            }
        ];
        localStorage.setItem(DB_KEYS.DOCTORS, JSON.stringify(doctors));
    },

    // --- DOCTORS ---
    getDoctors() {
        return JSON.parse(localStorage.getItem(DB_KEYS.DOCTORS) || '[]');
    },

    // --- APPOINTMENTS ---
    getAppointments() {
        return JSON.parse(localStorage.getItem(DB_KEYS.APPOINTMENTS) || '[]');
    },

    saveAppointment(appointment) {
        const appointments = this.getAppointments();
        // Add ID and Timestamp
        const newAppt = {
            ...appointment,
            id: Date.now(), // simple unique ID
            status: 'upcoming',
            createdAt: new Date().toISOString()
        };
        appointments.push(newAppt);
        localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(appointments));
        return newAppt;
    },

    updateAppointmentStatus(id, status) {
        const appointments = this.getAppointments();
        const index = appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            appointments[index].status = status;
            localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(appointments));
        }
    },

    // --- PRESCRIPTIONS ---
    getPrescriptions() {
        return JSON.parse(localStorage.getItem(DB_KEYS.PRESCRIPTIONS) || '[]');
    },

    savePrescription(prescription) {
        const prescriptions = this.getPrescriptions();
        const newRx = {
            ...prescription,
            id: 'RX-' + Date.now(),
            date: new Date().toLocaleDateString()
        };
        prescriptions.push(newRx);
        localStorage.setItem(DB_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
        return newRx;
    },

    // Get prescriptions for a specific patient (mocking user ID for now)
    getPatientPrescriptions() {
        // returning all for MVP simplicity
        return this.getPrescriptions();
    }
};

// Initialize DB on load
StorageService.init();

// Expose to window for other scripts to use
window.StorageService = StorageService;
