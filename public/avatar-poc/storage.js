/**
 * storage.js
 * 
 * API-based storage layer - replaces localStorage with backend API calls
 */

const API_BASE = '/api';

// Get current logged-in user from session
function getCurrentUser() {
    const userStr = localStorage.getItem('medassist_user');
    return userStr ? JSON.parse(userStr) : null;
}

function getCurrentRole() {
    return localStorage.getItem('medassist_role') || 'patient';
}

const StorageService = {
    // Initialize - check if user is logged in
    init() {
        if (!getCurrentUser()) {
            // Redirect to login if not authenticated
            window.location.href = '/login.html';
            return;
        }
        console.log('StorageService initialized with API backend');
    },

    // Get current user info
    getCurrentUser() {
        return getCurrentUser();
    },

    // --- DOCTORS ---
    async getDoctors() {
        try {
            const response = await fetch(`${API_BASE}/doctors`);
            const doctors = await response.json();
            return doctors.map(d => ({
                id: d.id,
                name: d.full_name,
                specialty: d.specialty,
                rating: d.rating,
                experience: d.experience,
                image: d.image_url
            }));
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
            return [];
        }
    },

    // Synchronous version for backward compatibility (cached)
    getDoctorsSync() {
        // Return cached doctors or empty array
        return this._cachedDoctors || [];
    },

    // Load doctors into cache
    async loadDoctors() {
        this._cachedDoctors = await this.getDoctors();
        return this._cachedDoctors;
    },

    // --- APPOINTMENTS ---
    async getAppointments() {
        const user = getCurrentUser();
        const role = getCurrentRole();

        if (!user) return [];

        try {
            const endpoint = role === 'doctor'
                ? `${API_BASE}/doctors/${user.id}/appointments`
                : `${API_BASE}/patients/${user.id}/appointments`;

            const response = await fetch(endpoint);
            const appointments = await response.json();

            return appointments.map(a => ({
                id: a.id,
                patientId: a.patient_id,
                patientName: a.patient_name || user.full_name,
                doctorName: a.doctor_name,
                doctorId: a.doctor_id,
                specialty: a.specialty,
                time: new Date(a.appointment_time).toLocaleString(),
                status: a.status,
                chatHistory: a.chat_history,
                aiSummary: a.ai_summary,
                medicalHistory: a.medical_history || '' // Patient's past medical records
            }));
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            return [];
        }
    },

    async saveAppointment(appointment) {
        const user = getCurrentUser();
        if (!user) return null;

        try {
            const response = await fetch(`${API_BASE}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: user.id,
                    doctor_id: appointment.doctorId,
                    appointment_time: appointment.time || new Date().toISOString(),
                    chat_history: appointment.chatHistory || null,
                    ai_summary: appointment.aiSummary || null
                })
            });

            const data = await response.json();
            return { id: data.id, ...appointment, status: 'upcoming' };
        } catch (error) {
            console.error('Failed to save appointment:', error);
            return null;
        }
    },

    async updateAppointmentStatus(id, status) {
        try {
            await fetch(`${API_BASE}/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error('Failed to update appointment:', error);
        }
    },

    // --- PRESCRIPTIONS ---
    async getPrescriptions() {
        const user = getCurrentUser();
        if (!user) return [];

        try {
            const response = await fetch(`${API_BASE}/patients/${user.id}/prescriptions`);
            const prescriptions = await response.json();

            return prescriptions.map(p => ({
                id: p.id,
                patientName: user.full_name,
                medicine: p.medicine,
                dosage: p.dosage,
                notes: p.notes,
                doctorName: p.doctor_name,
                date: new Date(p.created_at).toLocaleDateString(),
                refillStatus: p.refill_status
            }));
        } catch (error) {
            console.error('Failed to fetch prescriptions:', error);
            return [];
        }
    },

    async savePrescription(prescription) {
        const user = getCurrentUser();
        const role = getCurrentRole();

        if (!user || role !== 'doctor') return null;

        try {
            const response = await fetch(`${API_BASE}/prescriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: prescription.patientId,
                    doctor_id: user.id,
                    appointment_id: prescription.appointmentId,
                    medicine: prescription.medicine,
                    dosage: prescription.dosage,
                    notes: prescription.notes
                })
            });

            const data = await response.json();
            return { id: data.id, ...prescription };
        } catch (error) {
            console.error('Failed to save prescription:', error);
            return null;
        }
    },

    // Get prescriptions for current patient
    async getPatientPrescriptions() {
        return this.getPrescriptions();
    },

    // --- PATIENT MEDICAL HISTORY ---
    async updateMedicalHistory(newSummary) {
        const user = getCurrentUser();
        if (!user) return;

        try {
            // Get existing history and append
            const response = await fetch(`${API_BASE}/patients/${user.id}`);
            const patient = await response.json();

            const updatedHistory = patient.medical_history
                ? `${patient.medical_history}\n\n${newSummary}`
                : newSummary;

            await fetch(`${API_BASE}/patients/${user.id}/medical-history`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medical_history: updatedHistory })
            });
        } catch (error) {
            console.error('Failed to update medical history:', error);
        }
    }
};

// Initialize and load doctors on load
(async function () {
    StorageService.init();
    await StorageService.loadDoctors();
})();

// Expose to window for other scripts to use
window.StorageService = StorageService;
window.getCurrentUser = getCurrentUser;
window.getCurrentRole = getCurrentRole;
