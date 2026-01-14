/**
 * doctor.js
 * Handles the logic for the Doctor Dashboard
 */

const doctorApp = {
    currentAppointment: null,
    doctorId: null, // Logged in doctor context
    doctorName: 'Doctor', // Will be set on login

    init(doctorId = null) {
        this.doctorId = doctorId;

        // Fetch doctor name from storage
        if (doctorId) {
            const doctors = StorageService.getDoctors();
            const doc = doctors.find(d => d.id === doctorId);
            if (doc) this.doctorName = doc.name;
        }

        this.renderAppointments();
    },

    // Render the list of upcoming appointments from Storage
    renderAppointments() {
        const list = document.getElementById('appointmentList');
        const appointments = StorageService.getAppointments();

        // Filter for specific doctor if logged in, otherwise show all (admin view)
        let relevantAppointments = appointments;
        if (this.doctorId) {
            relevantAppointments = appointments.filter(a => a.doctorId === this.doctorId);
        }

        const upcoming = relevantAppointments.filter(a => a.status === 'upcoming').reverse();

        if (upcoming.length === 0) {
            list.innerHTML = `<div class="empty-state">No appointments today</div>`;
            return;
        }

        list.innerHTML = upcoming.map(appt => `
            <div class="appointment-card" onclick="doctorApp.startConsultation(${appt.id})">
                <div class="appt-time">${appt.time}</div>
                <div class="appt-details">
                    <strong>${appt.patientName || 'Patient'}</strong>
                    <span>${appt.specialty}</span>
                </div>
                <div class="appt-action">ᐳ</div>
            </div>
        `).join('');
    },

    // Select an appointment and start the consultation view
    startConsultation(apptId) {
        const appointments = StorageService.getAppointments();
        this.currentAppointment = appointments.find(a => a.id === apptId);

        if (!this.currentAppointment) return;

        // UI Updates
        document.querySelector('.empty-consultation').style.display = 'none';
        document.getElementById('activeConsultation').style.display = 'block';

        document.getElementById('currentPatientName').textContent = this.currentAppointment.patientName || 'Walk-in Patient';
        document.getElementById('visitReason').textContent = this.currentAppointment.specialty;

        // Use REAL Chat History if available
        if (this.currentAppointment.chatHistory) {
            this.generateRealSummary(this.currentAppointment.chatHistory);
        } else {
            this.simulateAIAnalysis(); // Fallback for old appointments
        }
    },

    async generateRealSummary(chatLog) {
        const summaryBox = document.getElementById('aiSummary');
        const hintsBox = document.getElementById('aiHints');
        const transcriptionBox = document.getElementById('liveTranscription');

        summaryBox.innerHTML = '<span class="typing-text">Generating AI Summary from patient chat...</span>';

        // Show raw chat log immediately
        transcriptionBox.innerHTML = chatLog.replace(/\n/g, '<br>');

        // Construct Prompts
        const summaryPrompt = `
        You are a medical assistant helper. Summarize the following patient chat logs for a doctor.
        Format accurately as HTML.
        Include: 
        <p><strong>Symptoms:</strong> ...</p>
        <p><strong>Duration/Severity:</strong> ...</p>
        <p><strong>Suspected Condition:</strong> ...</p>
        
        Chat Log:
        ${chatLog}
        `;

        try {
            // Call Gemini (Reuse the global function or simplified fetch)
            // We use the global constant from script.js context (assumed available or accessed via window)
            // Ideally we should refactor API call to a shared service, but for now we access global vars.
            // Note: getApiKey() is defined in script.js and available globally
            const response = await fetch(`${GEMINI_API_URL}?key=${getApiKey()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: summaryPrompt }] }]
                })
            });
            const data = await response.json();
            let aiText = data.candidates[0].content.parts[0].text;

            // Clean up markdown code blocks that AI might return
            aiText = aiText
                .replace(/```html\n?/gi, '')  // Remove ```html
                .replace(/```\n?/g, '')       // Remove closing ```
                .trim();

            summaryBox.innerHTML = aiText;

            // Generate Hints (Simple parsing or separate call - for speed we just hardcode or reuse prompt)
            hintsBox.innerHTML = `
                <div class="hint-tag">Review Symptoms</div>
                <div class="hint-tag">Check Vitals</div>
                <div class="hint-tag">History Analysis</div>
            `;

        } catch (e) {
            console.error("AI Summary Failed", e);
            summaryBox.innerHTML = "Failed to generate AI summary. Please review chat logs.";
        }
    },

    simulateAIAnalysis() {
        const summaryBox = document.getElementById('aiSummary');
        const hintsBox = document.getElementById('aiHints');
        const transcriptionBox = document.getElementById('liveTranscription');

        summaryBox.innerHTML = '<span class="typing-text">Generating summary...</span>';

        setTimeout(() => {
            summaryBox.innerHTML = `
                <p><strong>Patient History:</strong> 45yo Male, no known allergies.</p>
                <p><strong>Reported Symptoms:</strong> Headache, mild fever, nausea.</p>
                <p><strong>Vitals (Simulated):</strong> BP 120/80, Temp 99.1°F</p>
            `;

            hintsBox.innerHTML = `
                <div class="hint-tag">Migraine (80%)</div>
                <div class="hint-tag">Viral Infection (60%)</div>
                <div class="hint-tag">Exhaustion</div>
            `;

            transcriptionBox.innerHTML = `
                <p>"I've been feeling this throbbing pain since yesterday morning..."</p>
                <p>"It gets worse when I look at bright lights."</p>
            `;
        }, 1500);
    },

    issuePrescription() {
        const medicine = document.getElementById('rxMedicine').value;
        const dosage = document.getElementById('rxDosage').value;
        const notes = document.getElementById('rxNotes').value;

        if (!medicine || !dosage) {
            alert('Please fill in medicine and dosage.');
            return;
        }

        const prescription = {
            patientName: this.currentAppointment.patientName,
            medicine,
            dosage,
            notes,
            doctorName: this.doctorName // Use logged-in doctor's name
        };

        StorageService.savePrescription(prescription);

        alert('Prescription sent successfully!');

        // Clear form
        document.getElementById('rxMedicine').value = '';
        document.getElementById('rxDosage').value = '';
        document.getElementById('rxNotes').value = '';
    }
};
