/**
 * doctor.js
 * Handles the logic for the Doctor Dashboard
 * Updated to use async API-based StorageService
 */

const doctorApp = {
    currentAppointment: null,
    doctorId: null, // Logged in doctor context
    doctorName: 'Doctor', // Will be set on login
    appointments: [], // Cached appointments

    async init(doctorId = null) {
        this.doctorId = doctorId;

        // Fetch doctor name from storage
        if (doctorId) {
            const doctors = StorageService.getDoctorsSync();
            const doc = doctors.find(d => d.id === doctorId);
            if (doc) this.doctorName = doc.name;
        }

        await this.renderAppointments();
    },

    // Render the list of upcoming appointments from API
    async renderAppointments() {
        const list = document.getElementById('appointmentList');
        const dict = app.translations[app.lang];

        // Show loading state
        list.innerHTML = `<div class="empty-state">${dict.loading_appointments}</div>`;

        try {
            // Fetch appointments from API
            this.appointments = await StorageService.getAppointments();
            console.log('DEBUG: All fetched appointments:', this.appointments);

            // Filter for specific doctor if logged in
            let relevantAppointments = this.appointments;
            if (this.doctorId) {
                console.log(`DEBUG: Filtering for doctorId: ${this.doctorId} (Type: ${typeof this.doctorId})`);
                relevantAppointments = this.appointments.filter(a => {
                    console.log(`Checking appt ${a.id}: doctorId=${a.doctorId} (Type: ${typeof a.doctorId})`);
                    return a.doctorId === this.doctorId;
                });
            }
            console.log('DEBUG: Relevant appointments:', relevantAppointments);

            const upcoming = relevantAppointments.filter(a => a.status === 'upcoming').reverse();

            if (upcoming.length === 0) {
                list.innerHTML = `<div class="empty-state">${dict.no_appointments}</div>`;
                return;
            }

            list.innerHTML = upcoming.map(appt => {
                const statusText = dict[appt.status.toLowerCase()] || appt.status;

                return `
                    <div class="appointment-card" onclick="doctorApp.startConsultation(${appt.id})">
                        <div class="appt-time">${appt.time}</div>
                        <div class="appt-details">
                            <strong>${appt.patientName || dict.patient}</strong>
                            <span>${statusText}</span>
                        </div>
                        <div class="appt-action">ᐳ</div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load appointments:', error);
            list.innerHTML = `<div class="empty-state">Failed to load appointments</div>`;
        }
    },

    // Select an appointment and start the consultation view
    startConsultation(apptId) {
        this.currentAppointment = this.appointments.find(a => a.id === apptId);

        if (!this.currentAppointment) return;

        // UI Updates
        document.querySelector('.empty-consultation').style.display = 'none';
        document.getElementById('activeConsultation').style.display = 'block';

        const dict = app.translations[app.lang];

        document.getElementById('currentPatientName').textContent = this.currentAppointment.patientName || dict.walkin_patient;
        document.getElementById('visitReason').textContent = dict[this.currentAppointment.specialty] || this.currentAppointment.specialty || dict.general_consultation;

        // Display Patient Medical History from database
        const historyBox = document.getElementById('medicalHistory');
        if (this.currentAppointment.medicalHistory && this.currentAppointment.medicalHistory.trim()) {
            historyBox.innerHTML = `<p style="color: #e2e8f0; white-space: pre-line;">${this.currentAppointment.medicalHistory}</p>`;
        } else {
            historyBox.innerHTML = `<span class="placeholder" style="color: #64748b;">${dict.no_history}</span>`;
        }

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
        const dict = app.translations[app.lang];

        summaryBox.innerHTML = `<span class="typing-text">${dict.generating_summary}</span>`;
        hintsBox.innerHTML = `<span class="typing-text" style="color: #fbbf24;">${dict.analyzing_hints}</span>`;

        // Show raw chat log immediately
        transcriptionBox.innerHTML = chatLog.replace(/\n/g, '<br>');

        // Get medical history for context
        const medicalHistory = this.currentAppointment.medicalHistory || 'No prior medical history available.';

        // Construct Summary Prompt
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

        // Construct Diagnosis Hints Prompt - considers full context
        const diagnosisPrompt = `
        You are an AI clinical decision support assistant. Based on the following patient information, provide 3-5 diagnostic hints or considerations for the doctor.

        === PATIENT MEDICAL HISTORY ===
        ${medicalHistory}

        === CURRENT VISIT CHAT LOG ===
        ${chatLog}

        === INSTRUCTIONS ===
        - Consider patterns between past history and current symptoms
        - Flag any concerning symptom combinations
        - Suggest relevant tests or examinations if applicable
        - Include confidence percentages if possible (e.g., "Migraine (75%)")
        - Keep each hint brief (2-5 words max)
        - Return ONLY a JSON array of strings, like: ["Hint 1 (80%)", "Hint 2", "Consider X test"]
        - Do NOT include any other text, just the JSON array
        `;

        try {
            // Make both API calls in parallel for speed
            const [summaryResponse, hintsResponse] = await Promise.all([
                fetch(`${GEMINI_API_URL}?key=${getApiKey()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: summaryPrompt }] }]
                    })
                }),
                fetch(`${GEMINI_API_URL}?key=${getApiKey()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: diagnosisPrompt }] }]
                    })
                })
            ]);

            // Process Summary
            const summaryData = await summaryResponse.json();
            let summaryText = summaryData.candidates[0].content.parts[0].text;
            summaryText = summaryText
                .replace(/```html\n?/gi, '')
                .replace(/```\n?/g, '')
                .trim();
            summaryBox.innerHTML = summaryText;

            // Process Diagnosis Hints
            const hintsData = await hintsResponse.json();
            let hintsText = hintsData.candidates[0].content.parts[0].text;

            // Clean and parse JSON array
            hintsText = hintsText
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/g, '')
                .trim();

            try {
                const hintsArray = JSON.parse(hintsText);
                hintsBox.innerHTML = hintsArray
                    .map(hint => `<div class="hint-tag">${hint}</div>`)
                    .join('');
            } catch (parseError) {
                // Fallback: If not valid JSON, try to extract hints manually
                console.warn('Could not parse hints as JSON, using fallback');
                const fallbackHints = hintsText
                    .split('\n')
                    .filter(line => line.trim())
                    .slice(0, 5)
                    .map(hint => hint.replace(/^[-•*]\s*/, '').trim());

                hintsBox.innerHTML = fallbackHints
                    .map(hint => `<div class="hint-tag">${hint}</div>`)
                    .join('');
            }

        } catch (e) {
            console.error("AI Analysis Failed", e);
            summaryBox.innerHTML = "Failed to generate AI summary. Please review chat logs.";
            hintsBox.innerHTML = `
                <div class="hint-tag">Review Symptoms</div>
                <div class="hint-tag">Check Vitals</div>
                <div class="hint-tag">Compare with History</div>
            `;
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

    async issuePrescription() {
        const medicine = document.getElementById('rxMedicine').value;
        const dosage = document.getElementById('rxDosage').value;
        const notes = document.getElementById('rxNotes').value;
        const dict = app.translations[app.lang];

        if (!medicine || !dosage) {
            alert(dict.fill_rx_alert);
            return;
        }

        const prescription = {
            patientId: this.currentAppointment.patientId,
            appointmentId: this.currentAppointment.id,
            patientName: this.currentAppointment.patientName,
            medicine,
            dosage,
            notes,
            doctorName: this.doctorName
        };

        await StorageService.savePrescription(prescription);

        alert(dict.rx_success_alert);

        // Clear form
        document.getElementById('rxMedicine').value = '';
        document.getElementById('rxDosage').value = '';
        document.getElementById('rxNotes').value = '';
    },

    // ===== LIVE CALL FUNCTIONS =====

    async startLiveCall() {
        if (!this.currentAppointment) {
            alert('Please select an appointment first');
            return;
        }

        // Initialize CallManager if not already
        if (!CallManager.socket) {
            CallManager.init('doctor', this.doctorName);
        }

        // First, notify the patient about the incoming call
        CallManager.socket.emit('initiate-call', {
            appointmentId: this.currentAppointment.id,
            patientId: this.currentAppointment.patientId,
            doctorName: this.doctorName
        });

        // Join the consultation room
        const joined = await CallManager.joinRoom(this.currentAppointment.id);

        if (joined) {
            // Update UI
            document.getElementById('startCallBtn').style.display = 'none';
            document.getElementById('endCallBtn').style.display = 'inline-block';
            document.getElementById('muteBtn').style.display = 'inline-block';

            // Clear transcript for new call
            const transcriptBox = document.getElementById('liveTranscription');
            if (transcriptBox) {
                transcriptBox.innerHTML = `<p style="color: #64748b; font-style: italic;">${app.translations[app.lang].waiting_patient}</p>`;
            }
        }
    },

    endLiveCall() {
        CallManager.endCall();

        // Update UI
        document.getElementById('startCallBtn').style.display = 'inline-block';
        document.getElementById('endCallBtn').style.display = 'none';
        document.getElementById('muteBtn').style.display = 'none';
        document.getElementById('muteBtn').textContent = app.translations[app.lang].mic + ' ' + app.translations[app.lang].mute; // Reset text
        document.getElementById('callStatus').textContent = app.translations[app.lang].call_ended;
    }
};
