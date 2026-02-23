/**
 * script.js - Main Application Logic
 * Updated for MVP (Patient/Doctor Roles + Storage Integration)
 */

// ===== APP CONTROLLER =====
const app = {
    role: null,
    lang: localStorage.getItem('medassist_lang') || 'en',

    translations: {
        en: {
            app_title: "MedAssist AI",
            patient_subtitle: "Your Virtual Health Assistant",
            select_role: "Select your role to continue",
            patient: "Patient",
            patient_desc: "Check symptoms & book doctors",
            doctor: "Doctor",
            doctor_desc: "Manage patients & consultations",
            logout: "Logout",
            ready: "Ready to help",
            headache: "Headache",
            book_doctor: "Book Doctor",
            my_bookings: "📅 My Bookings",
            my_prescriptions: "My Prescriptions",
            conversation: "Conversation",
            mic: "Mic",
            describe_symptoms: "Describe your symptoms...",
            send: "Send",
            dr_ryan: "Dr. Ahmed",
            doctors_for: "for Doctors",
            today_appointments: "Today's Appointments",
            no_appointments: "No appointments yet",
            select_patient: "Select a patient to start consultation",
            review_ai: "Review AI summaries and manage prescriptions efficiently.",
            start_call: "🎤 Start Call",
            mute: "🎤 Mute",
            end_call: "📞 End Call",
            medical_history: "📋 Patient Medical History",
            ai_summary: "AI Patient Summary",
            chat_history: "💬 Chat History",
            ai_hints: "AI Diagnosis Hints",
            prescription: "Prescription",
            issue_rx: "Issue Prescription",
            step1: "Step 1: Select a doctor",
            recommended: "Recommended",
            step2: "Step 2: Select date & time",
            select_doc_time: "Select a doctor and time slot",
            select_slot: "Select a time slot",
            loading_slots: "Loading slots...",
            no_slots: "No slots available",
            failed_slots: "Failed to load slots",
            book_with: "Book {time} with {name}",
            booking_success: "Appointment Booked!",
            booking_confirmed: "Your appointment has been confirmed.",
            doc_label: "Doctor",
            spec_label: "Specialty",
            datetime_label: "Date & Time",
            conf_label: "Confirmation #",
            done: "Done",
            incoming_call: "📞 Incoming Call",
            calling_you: "{name} is calling you for your consultation",
            accept: "✓ Accept",
            decline: "✗ Decline",
            in_call_with: "🎙️ In Call with Doctor",
            connected_msg: "Connected - speak to see transcription",
            listening: "Listening...",
            speaking: "Speaking...",
            thinking: "Thinking...",
            login_title: "Sign In",
            email_label: "Email Address",
            password_label: "Password",
            signing_in: "Signing in...",
            demo_accounts: "Demo Accounts (click to fill)",
            poc_note: "🔒 MedAssist AI POC • For demonstration only",
            home_nav: "Home",
            bookings_nav: "Bookings",
            rx_nav: "Rx",
            settings_nav: "Settings",
            footer_note: "MedAssist AI POC • Powered by Google Gemini • For education only",
            doctor_login_title: "Select Doctor Profile",
            api_setup: "🔑 API Key Setup",
            api_help: "Enter your Gemini API key to enable AI features.",
            save_api: "Save API Key",
            api_local: "🔒 Key is stored locally in your browser only",
            no_prior_history: "No prior medical records for this patient.",
            waiting_patient: "Waiting for patient to join..."
        },
        ur: {
            app_title: "میڈ اسسٹ اے آئی",
            patient_subtitle: "آپ کا ورچوئل ہیلتھ اسسٹنٹ",
            select_role: "جاری رکھنے کے لیے اپنا کردار منتخب کریں",
            patient: "مریض",
            patient_desc: "علامات چیک کریں اور ڈاکٹر بک کریں",
            doctor: "ڈاکٹر",
            doctor_desc: "مریضوں اور مشورے کا انتظام کریں",
            logout: "لاگ آؤٹ",
            ready: "مدد کے لیے تیار ہے",
            headache: "سر درد",
            book_doctor: "ڈاکٹر بک کریں",
            my_bookings: "📅 میری بکنگ",
            my_prescriptions: "میرے نسخے",
            conversation: "گفتگو",
            mic: "مائیک",
            describe_symptoms: "اپنی علامات بیان کریں...",
            send: "بھیجیں",
            dr_ryan: "ڈاکٹر احمد",
            doctors_for: "ڈاکٹروں کے لیے",
            today_appointments: "آج کی اپائنٹمنٹس",
            no_appointments: "ابھی تک کوئی اپائنٹمنٹ نہیں ہے",
            select_patient: "مشورہ شروع کرنے کے لیے مریض کا انتخاب کریں",
            review_ai: "اے آئی خلاصوں کا جائزہ لیں اور نسخوں کا موثر طریقے سے انتظام کریں۔",
            start_call: "🎤 کال شروع کریں",
            mute: "🎤 میوٹ",
            end_call: "📞 کال ختم کریں",
            medical_history: "📋 مریض کی طبی تاریخ",
            ai_summary: "اے آئی مریض کا خلاصہ",
            chat_history: "💬 چیٹ کی تاریخ",
            ai_hints: "اے آئی تشخیص کے اشارے",
            prescription: "نسخہ (دوا)",
            issue_rx: "نسخہ جاری کریں",
            step1: "پہلا قدم: ڈاکٹر کا انتخاب کریں",
            recommended: "تجویز کردہ",
            step2: "دوسرا قدم: تاریخ اور وقت منتخب کریں",
            select_doc_time: "ڈاکٹر اور ٹائم سلاٹ منتخب کریں",
            select_slot: "ٹائم سلاٹ منتخب کریں",
            loading_slots: "سلاٹس لوڈ ہو رہے ہیں...",
            no_slots: "کوئی سلاٹ دستیاب نہیں ہے",
            failed_slots: "سلاٹس لوڈ کرنے میں ناکامی",
            book_with: "{name} کے ساتھ {time} پر بک کریں",
            booking_success: "اپائنٹمنٹ بک ہو گئی!",
            booking_confirmed: "آپ کی اپائنٹمنٹ کی تصدیق ہو گئی ہے۔",
            doc_label: "ڈاکٹر",
            spec_label: "شعبہ",
            datetime_label: "تاریخ اور وقت",
            conf_label: "تصدیق نمبر",
            done: "مکمل",
            incoming_call: "📞 کال آ رہی ہے",
            calling_you: "{name} آپ کو مشورے کے لیے کال کر رہا ہے",
            accept: "✓ قبول کریں",
            decline: "✗ مسترد کریں",
            in_call_with: "🎙️ ڈاکٹر کے ساتھ کال پر",
            connected_msg: "منسلک ہے - ٹرانسکرپشن دیکھنے کے لیے بولیں",
            listening: "سن رہا ہے...",
            speaking: "بول رہا ہے...",
            thinking: "سوچ رہا ہے...",
            login_title: "سائن ان کریں",
            email_label: "ای میل ایڈریس",
            password_label: "پاس ورڈ",
            signing_in: "سائن ان ہو رہا ہے...",
            demo_accounts: "ڈیمو اکاؤنٹس (بھرنے کے لیے کلک کریں)",
            poc_note: "🔒 میڈ اسسٹ اے آئی POC • صرف ڈیمو کے لیے",
            home_nav: "ہوم",
            bookings_nav: "بکنگ",
            rx_nav: "نسخے",
            settings_nav: "ترتیبات",
            footer_note: "میڈ اسسٹ اے آئی POC • گوگل جیمنی کے تعاون سے • صرف تعلیم کے لیے",
            doctor_login_title: "ڈاکٹر پروفائل منتخب کریں",
            api_setup: "🔑 اے پی آئی سیٹ اپ",
            api_help: "اے آئی فیچرز کو فعال کرنے کے لیے اپنی جیمنی اے پی آئی کلید درج کریں۔",
            save_api: "اے پی آئی کلید محفوظ کریں",
            api_local: "🔒 کلید صرف آپ کے براؤزر میں مقامی طور پر محفوظ ہے",
            no_prior_history: "اس مریض کے لیے کوئی پہلے سے طبی ریکارڈ موجود نہیں ہے۔",
            waiting_patient: "مریض کے کال میں شامل ہونے کا انتظار کر رہے ہیں..."
        },
    },

    t(key, params = {}) {
        let text = this.translations[this.lang][key] || key;
        for (const [pKey, pVal] of Object.entries(params)) {
            text = text.replace(`{${pKey}}`, pVal);
        }
        return text;
    },

    init() {
        console.log('App Initialized');
        // Check saved language
        const savedLang = localStorage.getItem('medassist_lang') || 'en';
        this.setLanguage(savedLang);
    },

    toggleLanguage() {
        const newLang = this.lang === 'en' ? 'ur' : 'en';
        this.setLanguage(newLang);
    },

    setLanguage(lang) {
        this.lang = lang;
        localStorage.setItem('medassist_lang', lang);

        // Update document attributes
        document.documentElement.lang = lang;
        document.body.dir = lang === 'ur' ? 'rtl' : 'ltr';

        // Update UI Text
        const dict = this.translations[lang];
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (dict[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = dict[key];
                } else {
                    el.textContent = dict[key];
                }
            }
        });

        // Update specific complex buttons
        const langBtns = document.querySelectorAll('.lang-toggle, .lang-btn-float');
        langBtns.forEach(btn => {
            btn.textContent = lang === 'en' ? '🌍 اردو' : '🌍 English';
        });

        console.log('Language set to:', lang);
    },

    switchRole(role) {
        this.role = role;

        if (role === 'patient') {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('patientScreen').classList.add('active');

            // Show mobile nav for patients
            if (window.mobileNav) mobileNav.updateVisibility('patient');

            // Init AI greeting only if first time or needed
            if (chatMessages.children.length === 0) {
                const greeting = "Assalam-o-Alaikum! I'm Dr. Ahmed, your virtual health assistant. How can I help you today?";
                addMessage(greeting);
                setTimeout(() => speak(greeting), 500);
            }
        } else if (role === 'doctor') {
            // Hide mobile nav for doctors
            if (window.mobileNav) mobileNav.updateVisibility('doctor');
            // Show Doctor Selection Modal instead of going straight to dashboard
            this.showDoctorLogin();
        }
    },

    showDoctorLogin() {
        const modal = document.getElementById('doctorLoginModal');
        const listBody = document.getElementById('doctorLoginBody');
        const doctors = StorageService.getDoctorsSync();

        listBody.innerHTML = doctors.map(doc => {
            const initials = doc.name.split(' ').map(n => n[0]).join('').substring(0, 2);
            return `
            <div class="doctor-card" onclick="app.loginAsDoctor(${doc.id})">
                <div class="doctor-avatar">${initials}</div>
                <div class="doctor-info">
                    <div class="doctor-name">${doc.name}</div>
                    <div class="doctor-specialty">${doc.specialty}</div>
                </div>
            </div>
            `;
        }).join('');

        modal.classList.add('active');
    },

    loginAsDoctor(doctorId) {
        document.getElementById('doctorLoginModal').classList.remove('active');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('doctorScreen').classList.add('active');

        // Init doctor app with specific doctor context
        doctorApp.init(doctorId);
    },

    logout() {
        this.role = null;
        // Clear session and redirect to login
        localStorage.removeItem('medassist_user');
        localStorage.removeItem('medassist_role');
        window.location.href = '/login.html';
    },

    async showPatientPrescriptions() {
        const modal = document.getElementById('prescriptionModal');
        const listBody = document.getElementById('rxListBody');

        listBody.innerHTML = '<p style="text-align:center; color:#94a3b8">Loading prescriptions...</p>';
        modal.classList.add('active');

        const prescriptions = await StorageService.getPrescriptions();

        if (prescriptions.length === 0) {
            listBody.innerHTML = '<p style="text-align:center; color:#94a3b8">No active prescriptions.</p>';
        } else {
            listBody.innerHTML = prescriptions.map(rx => `
                <div class="rx-card" style="background:#0f172a; padding:15px; margin-bottom:10px; border-radius:10px; border:1px solid #334155;">
                    <strong style="color:#e2e8f0; display:block; margin-bottom:5px;">${rx.medicine} (${rx.dosage})</strong>
                    <div style="font-size:0.9rem; color:#94a3b8; margin-bottom:5px;">${rx.notes || 'No notes'}</div>
                    <div style="font-size:0.8rem; color:#38bdf8;">Prescribed by ${rx.doctorName} on ${rx.date}</div>
                </div>
            `).join('');
        }
    },

    async showPatientBookings() {
        const user = getCurrentUser();
        if (!user) return;

        // Create modal if not exists
        let modal = document.getElementById('bookingsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bookingsModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h2>📅 My Bookings</h2>
                        <button class="close-btn" onclick="document.getElementById('bookingsModal').classList.remove('active')">×</button>
                    </div>
                    <div class="modal-body" id="bookingsListBody"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const listBody = document.getElementById('bookingsListBody');
        listBody.innerHTML = '<p style="text-align:center; color:#94a3b8">Loading bookings...</p>';
        modal.classList.add('active');

        try {
            const response = await fetch(`/api/appointments?patient_id=${user.id}`);
            const appointments = await response.json();

            if (appointments.length === 0) {
                listBody.innerHTML = '<p style="text-align:center; color:#94a3b8">No appointments found. Book a doctor to get started!</p>';
            } else {
                listBody.innerHTML = appointments.map(appt => {
                    const statusColor = appt.status === 'upcoming' ? '#4ade80' : '#94a3b8';
                    const formattedDate = new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    return `
                        <div class="booking-card" style="background:#0f172a; padding:15px; margin-bottom:10px; border-radius:10px; border:1px solid #334155;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <strong style="color:#e2e8f0;">Dr. ${appt.doctor_name}</strong>
                                <span style="color:${statusColor}; font-size:0.8rem; text-transform:uppercase;">${appt.status}</span>
                            </div>
                            <div style="font-size:0.9rem; color:#38bdf8; margin-bottom:5px;">${appt.specialty || 'General'}</div>
                            <div style="font-size:0.85rem; color:#94a3b8;">📅 ${formattedDate} at ${appt.time}</div>
                            ${appt.reason ? `<div style="font-size:0.85rem; color:#64748b; margin-top:5px;">Reason: ${appt.reason}</div>` : ''}
                        </div>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Failed to load bookings:', error);
            listBody.innerHTML = '<p style="text-align:center; color:#ef4444">Failed to load bookings</p>';
        }
    }
};


// ===== CONFIGURATION =====
// API Key is stored in localStorage for security (not hardcoded)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

// Helper to get API key from localStorage
function getApiKey() {
    const key = localStorage.getItem('medassist_gemini_api_key');
    if (key === 'AIzaDummyKey1234567890') return null;
    return key;
}

// Helper to save API key
function saveApiKey(key) {
    localStorage.setItem('medassist_gemini_api_key', key);
}

// Check if API key exists, if not show setup modal
function checkApiKeySetup() {
    if (!getApiKey()) {
        showApiKeyModal();
        return false;
    }
    return true;
}

// Show API key setup modal
function showApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) modal.classList.add('active');
}

// Hide API key modal and save
function saveApiKeyAndClose() {
    const input = document.getElementById('apiKeyInput');
    const key = input.value.trim();

    if (!key) {
        alert('Please enter a valid API key');
        return;
    }

    if (!key.startsWith('AIza')) {
        alert('Invalid API key format. Gemini API keys start with "AIza"');
        return;
    }

    saveApiKey(key);
    document.getElementById('apiKeyModal').classList.remove('active');

    // Update badge to show configured
    const badge = document.querySelector('.ai-badge');
    if (badge) {
        badge.textContent = 'API Configured';
        badge.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    }
}

// System prompt for the AI
const SYSTEM_PROMPT = `You are Dr. Ahmed, a virtual triage assistant from Pakistan.

LANGUAGE RULES (STRICT):
- If the user writes in Urdu script (اردو), you MUST respond EXCLUSIVELY in Urdu script.
- If the user writes in English, respond in English.
- Use culturally appropriate Pakistani greetings (e.g., Assalam-o-Alaikum / السلام علیکم).
- NEVER respond in English to an Urdu message.

TASKS:
1. **ASK QUESTIONS** - Gather patient information through focused questions:
   - Duration: "How long have you had this?" (یا یہ کتنے عرصے سے ہے؟)
   - Severity: "On a scale of 1-10, how bad is it?" (1 سے 10 کے پیمانے پر، یہ کتنا شدید ہے؟)
   - Related symptoms: "Any fever, dizziness, or vomiting?" (کیا بخار، چکر یا الٹی محسوس ہو رہی ہے؟)
   - History: "Have you experienced this before?" (کیا آپ کو پہلے بھی ایسا ہوا ہے؟)

2. Ask 2-3 brief questions to understand the patient's symptoms.
3. Recommend the appropriate specialist (e.g., Cardiologist, Dermatologist, General Physician).
4. Ask "Shall I show you the available doctors?" (کیا میں آپ کو دستیاب ڈاکٹر دکھاؤں؟)
5. IMPORTANT: If the user says "Yes/ہاں" or agrees to book, DO NOT ask for location. Instead, ONLY say "Great. Showing available doctors now." (بہترین۔ اب دستیاب ڈاکٹروں کی فہرست دکھائی جا رہی ہے۔)

RULES:
- Ask ONE question at a time (keep responses to 1-2 sentences)
- Do NOT give medical advice or prescriptions
- Do NOT list possible conditions or diagnoses
- Be warm but brief.`;

// Conversation history for context
let conversationHistory = [];

// ===== ELEMENTS =====
const avatarContainer = document.getElementById('avatarContainer');
const silentVideo = document.getElementById('silentVideo');
const talkingVideo = document.getElementById('talkingVideo');
const status = document.getElementById('status');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');

let isRecording = false;
let recognition = null;
let currentRecommendedSpecialty = 'General Physician'; // Track what AI recommends

// Ensure silent video plays
if (silentVideo) {
    silentVideo.play().catch(e => console.log('Autoplay blocked'));
}

// ===== GEMINI API & MOCK FALLBACK =====
async function callGeminiAPI(userMessage) {
    // Add user message to history
    conversationHistory.push({
        role: 'user',
        parts: [{ text: userMessage }]
    });

    // Build the request
    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [{ text: SYSTEM_PROMPT }] // Send system prompt as first context
            },
            {
                role: 'model',
                parts: [{ text: "Assalam-o-Alaikum! I'm Dr. Ahmed, your virtual health assistant. How can I help you today?" }]
            },
            ...conversationHistory
        ],
        generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        }
    };

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${getApiKey()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText} `);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // Add AI response to history
        conversationHistory.push({
            role: 'model',
            parts: [{ text: aiResponse }]
        });

        // Update Badge to show API is working
        const badge = document.querySelector('.ai-badge');
        if (badge) {
            badge.textContent = 'Gemini (Urdu Enabled)';
            badge.style.background = 'linear-gradient(135deg, #059669, #10b981)'; // Green for Urdu/Pakistan
            badge.title = 'Connected to Live API';
        }

        // === SPECIALTY DETECTION ===
        // Scan the ENTIRE conversation history for specialty mentions (not just the last message)
        // This fixes the bug where specialty was mentioned earlier but not in the trigger message
        const allConversationText = conversationHistory
            .filter(msg => msg.role === 'model')
            .map(msg => msg.parts[0].text)
            .join(' ');

        // Check for specialties in order of specificity (most specific first)
        const specialtyKeywords = [
            { keywords: ['Dermatologist', 'dermatologist', 'skin specialist', 'skin doctor'], specialty: 'Dermatologist' },
            { keywords: ['Cardiologist', 'cardiologist', 'heart specialist', 'heart doctor'], specialty: 'Cardiologist' },
            { keywords: ['Neurologist', 'neurologist', 'brain specialist'], specialty: 'Neurologist' },
            { keywords: ['Pediatrician', 'pediatrician', 'child specialist'], specialty: 'Pediatrician' },
            { keywords: ['General Physician', 'general physician', 'GP', 'general doctor'], specialty: 'General Physician' }
        ];

        for (const { keywords, specialty } of specialtyKeywords) {
            if (keywords.some(kw => allConversationText.includes(kw))) {
                currentRecommendedSpecialty = specialty;
                console.log(`[Specialty Detected] ${specialty} from conversation history`);
                break; // Stop at first match (most specific)
            }
        }

        // === INTENT DETECTION ===
        // If AI says the trigger phrase, open the modal!
        if (aiResponse.includes("Showing available doctors now") || aiResponse.includes("Showing available doctors")) {
            console.log(`[Booking Trigger] Opening modal with specialty: ${currentRecommendedSpecialty}`);

            // Wait for speech to start then open modal
            setTimeout(() => {
                openBookingModal(currentRecommendedSpecialty);
            }, 2000);
        }

        return aiResponse;
    } catch (error) {
        // Alert the actual error so the user can see if it's 400/403/404
        console.error('Full Gemini API Error:', error);

        // If it's a 404, it might be the model name.
        if (error.message.includes('404')) {
            alert(`Model not found(404).Please check the model name in script.js.`);
        } else if (error.message.includes('403') || error.message.includes('400')) {
            alert(`API Key / Permission Error: ${error.message} `);
        }

        console.error('API Failed (Mock Mode disabled by user).');

        // Show indicator that API failed
        const badge = document.querySelector('.ai-badge');
        if (badge) {
            badge.textContent = 'API Error';
            badge.style.background = '#dc2626'; // Red
            badge.title = 'Connection Failed';
        }

        return "I'm sorry, I'm having trouble connecting to the server. Please check your internet connection or API key.";
    }
}
// MOck function remains below but unused in catch fallback
// Context-aware mock/offline mode
function getMockResponse(text) {
    const input = text.toLowerCase();

    // Check previous AI message to understand context
    // (We look at the second to last item because the user message was just pushed)
    const lastAiEntry = conversationHistory.filter(m => m.role === 'model').pop();
    const lastAiMessage = lastAiEntry ? lastAiEntry.parts[0].text.toLowerCase() : '';

    // CONTEXT 1: If AI just asked for details/severity
    if (lastAiMessage.includes('how long') || lastAiMessage.includes('scale')) {
        return "Understood. I've noted that down. Are you currently taking any medication or have any allergies?";
    }

    // CONTEXT 2: If AI just asked about medications/allergies
    if (lastAiMessage.includes('medication') || lastAiMessage.includes('allergies')) {
        return "Thank you for sharing. Based on your symptoms, I recommend consulting a specific specialist. Shall I show you available doctors?";
    }

    // SYMPTOM CHECK
    if (input.includes('headache') || input.includes('pain') || input.includes('fever') || input.includes('nausea') || input.includes('vomit') || input.includes('dizz') || input.includes('stomach')) {
        return "I understand. How long have you been experiencing these symptoms? And on a scale of 1-10, how severe is it?";
    }

    // BASIC INTENTS
    if (input.includes('days') || input.includes('week') || input.includes('yesterday')) {
        // Fallback if context missed
        return "Noted. Have you taken any medications for this recently?";
    }

    if (input.includes('book') || input.includes('appointment') || input.includes('doctor')) {
        return "Based on your symptoms, I would recommend seeing a General Physician for a check-up. Would you like me to open the booking options for you?";
    }

    if (input.includes('yes') || input.includes('sure') || input.includes('ok') || input.includes('please')) {
        // Trigger booking modal programmatically
        setTimeout(() => openBookingModal(), 1500);
        return "Great. I'm opening the list of available doctors for you now.";
    }

    // DEFAULT FALLBACK
    return "Could you describe your symptoms in a bit more detail? For example, are you feeling any pain, nausea, or dizziness?";
}

// ===== VIDEO CONTROL =====
function showTalkingVideo() {
    silentVideo.classList.remove('active');
    silentVideo.pause();
    talkingVideo.classList.add('active');
    talkingVideo.currentTime = 0;
    talkingVideo.play();
    avatarContainer.classList.add('talking');
}

function showSilentVideo() {
    talkingVideo.classList.remove('active');
    talkingVideo.pause();
    silentVideo.classList.add('active');
    silentVideo.play();
    avatarContainer.classList.remove('talking');
}

// ===== CHAT FUNCTIONS =====
function addMessage(text, isUser = false, isTyping = false) {
    const msg = document.createElement('div');
    msg.className = `message ${isUser ? 'user' : 'ai'}${isTyping ? ' typing' : ''} `;
    msg.textContent = text;
    if (isTyping) msg.id = 'typingIndicator';
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function stripEmojis(text) {
    // Remove emojis using regex
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '').trim();
}

function speak(text) {
    if (!('speechSynthesis' in window)) return;

    // Remove emojis before speaking
    const cleanText = stripEmojis(text);
    if (!cleanText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Detect if text is Urdu (Arabic/Urdu script regex)
    const isUrdu = /[\u0600-\u06FF]/.test(cleanText);

    if (isUrdu) {
        utterance.lang = 'ur-PK';
    } else {
        utterance.lang = 'en-US';
    }

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (isUrdu) {
        // Look for Urdu voice
        selectedVoice = voices.find(v => v.lang.startsWith('ur'));
    }

    if (!selectedVoice) {
        // Fallback to existing male voice logic for English or if no Urdu voice found
        selectedVoice = voices.find(v =>
            v.name.includes('Microsoft David') ||
            v.name.includes('Google UK English Male') ||
            v.name.includes('Alex') ||
            v.name.includes('Daniel')
        );
    }

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => {
        showTalkingVideo();
        status.textContent = app.t('speaking');
        status.className = 'status-badge speaking';
    };

    utterance.onend = () => {
        showSilentVideo();
        status.textContent = app.t('ready');
        status.className = 'status-badge';
        sendBtn.disabled = false;
    };

    window.speechSynthesis.speak(utterance);
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Disable input while processing
    sendBtn.disabled = true;
    chatInput.disabled = true;

    // Add user message
    addMessage(text, true);
    chatInput.value = '';

    // Show thinking state
    status.textContent = app.t('thinking');
    status.className = 'status-badge thinking';
    addMessage(app.t('thinking'), false, true);

    // Call Gemini API
    const response = await callGeminiAPI(text);

    // Remove typing indicator and show response
    removeTypingIndicator();
    addMessage(response);

    // Speak the response
    chatInput.disabled = false;
    speak(response);
}

function quickAsk(text) {
    chatInput.value = text;
    sendMessage();
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !sendBtn.disabled) sendMessage();
}

// ===== VOICE INPUT =====
function toggleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Voice input not supported in this browser. Try Chrome.');
        return;
    }

    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ur-PK'; // Enable Urdu recognition

    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.textContent = app.t('decline').includes('مسترد') ? 'بند کریں' : 'Stop';
        status.textContent = app.t('listening');
        status.className = 'status-badge listening';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        sendMessage();
    };

    recognition.onend = () => stopRecording();
    recognition.onerror = () => stopRecording();
    recognition.start();
}

function stopRecording() {
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.textContent = app.t('mic');
    status.textContent = app.t('ready');
    status.className = 'status-badge';
    if (recognition) recognition.stop();
}

// ===== INITIALIZATION =====
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

// Note: Removed the auto-greeting onLoad, now handled by app.switchRole('patient')

// ===== DOCTOR BOOKING SYSTEM =====
// Updated to use StorageService.getDoctors()

let selectedDoctor = null;
let selectedDate = null;
let selectedSlot = null;
let currentSpecialty = 'General Physician';

function openBookingModal(specialty = 'General Physician') {
    currentSpecialty = specialty;
    selectedDoctor = null;
    selectedDate = new Date().toISOString().split('T')[0]; // Today
    selectedSlot = null;

    const modal = document.getElementById('bookingModal');
    const modalBody = document.getElementById('modalBody');

    // Fetch doctors from Mock DB
    const allDoctors = StorageService.getDoctorsSync();

    // Sort: Matching specialty first, then others
    const recommendedDocs = allDoctors.filter(d => d.specialty === specialty);
    const otherDocs = allDoctors.filter(d => d.specialty !== specialty);
    const sortedDoctors = [...recommendedDocs, ...otherDocs];

    let html = `
        <p style="color: #94a3b8; margin-bottom: 15px;">${app.t('step1')} (${specialty} ${app.t('recommended')})</p>
        <div class="doctors-list">
    `;

    sortedDoctors.forEach((doc, index) => {
        const initials = doc.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        const isRecommended = doc.specialty === specialty;

        html += `
            <div class="doctor-card ${isRecommended ? 'recommended' : ''}" id="doctor-${index}" onclick="selectDoctor(${index}, ${doc.id}, '${doc.name}', '${doc.specialty}')">
                <div class="doctor-avatar">${initials}</div>
                <div class="doctor-info">
                    <div class="doctor-name">${doc.name} ${isRecommended ? `<span style="color:#22c55e; font-size:0.8rem;">★ ${app.t('recommended')}</span>` : ''}</div>
                    <div class="doctor-specialty">${doc.specialty} • ${doc.experience}</div>
                    <div class="doctor-meta">
                        <span class="doctor-rating">★ ${doc.rating}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>
        <div id="slotSection" style="display: none;">
            <p style="color: #94a3b8; margin: 20px 0 10px;">${app.t('step2')}</p>
            <input type="date" id="appointmentDate" class="form-input" style="margin-bottom: 15px;" onchange="loadTimeSlots()">
            <div id="timeSlots" class="time-slots-grid"></div>
        </div>
        <button class="book-btn" id="bookBtn" onclick="confirmBooking()" disabled>${app.t('select_doc_time')}</button>
    `;

    modalBody.innerHTML = html;
    modal.classList.add('active');
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

async function selectDoctor(index, doctorId, name, specialty) {
    console.log('selectDoctor called with:', { index, doctorId, name, specialty });

    // Remove previous selection
    document.querySelectorAll('.doctor-card').forEach(card => card.classList.remove('selected'));

    // Select new doctor
    document.getElementById(`doctor-${index}`).classList.add('selected');
    selectedDoctor = { id: doctorId, name, specialty };
    selectedSlot = null;

    // Show slot section
    const slotSection = document.getElementById('slotSection');
    slotSection.style.display = 'block';

    // Set date picker to today
    const dateInput = document.getElementById('appointmentDate');
    dateInput.value = selectedDate;
    dateInput.min = new Date().toISOString().split('T')[0]; // Can't book in past

    // Load available slots
    await loadTimeSlots();

    // Update button
    const bookBtn = document.getElementById('bookBtn');
    bookBtn.disabled = true;
    bookBtn.textContent = app.t('select_slot');
}

async function loadTimeSlots() {
    if (!selectedDoctor) return;

    const dateInput = document.getElementById('appointmentDate');
    selectedDate = dateInput.value;
    selectedSlot = null;

    const slotsContainer = document.getElementById('timeSlots');
    slotsContainer.innerHTML = `<p style="color:#94a3b8;">${app.t('loading_slots')}</p>`;

    try {
        const response = await fetch(`/api/doctors/${selectedDoctor.id}/slots?date=${selectedDate}`);
        const slots = await response.json();

        let html = '';
        slots.forEach(slot => {
            const formattedTime = formatTime(slot.time);
            html += `
                <div class="time-slot ${slot.available ? '' : 'booked'}" 
                     onclick="${slot.available ? `selectTimeSlot('${slot.time}', this)` : ''}"
                     ${!slot.available ? 'title="Already booked"' : ''}>
                    ${formattedTime}
                </div>
            `;
        });

        slotsContainer.innerHTML = html || `<p style="color:#94a3b8;">${app.t('no_slots')}</p>`;

        // Update button state
        const bookBtn = document.getElementById('bookBtn');
        bookBtn.disabled = true;
        bookBtn.textContent = app.t('select_slot');
    } catch (error) {
        console.error('Failed to load slots:', error);
        slotsContainer.innerHTML = `<p style="color:#ef4444;">${app.t('failed_slots')}</p>`;
    }
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function selectTimeSlot(time, element) {
    // Remove previous selection
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));

    // Select new slot
    element.classList.add('selected');
    selectedSlot = time;

    // Enable book button
    const bookBtn = document.getElementById('bookBtn');
    bookBtn.disabled = false;
    bookBtn.textContent = app.t('book_with', { time: formatTime(time), name: selectedDoctor.name });
}

async function confirmBooking() {
    if (!selectedDoctor || !selectedSlot) return;

    // Get logged-in user
    const user = getCurrentUser();
    const patientName = user ? user.full_name : 'Guest';

    // Build full datetime
    const appointmentDateTime = `${selectedDate}T${selectedSlot}:00`;

    // Capture current chat history text for the doctor
    const chatSummary = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'Patient' : 'AI'}: ${msg.parts[0].text} `)
        .join('\n');

    // SAVE TO DATABASE via API
    try {
        const result = await StorageService.saveAppointment({
            patientName: patientName,
            specialty: selectedDoctor.specialty,
            doctorName: selectedDoctor.name,
            doctorId: selectedDoctor.id,
            time: appointmentDateTime,
            chatHistory: chatSummary
        });

        if (!result) {
            alert('Failed to book appointment. Please try again.');
            return;
        }

        const displayTime = `${selectedDate} at ${formatTime(selectedSlot)}`;

        const modal = document.getElementById('bookingModal');
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
        <div class="booking-success">
                <div class="success-icon">✓</div>
                <div class="success-text">${app.t('booking_success')}</div>
                <p style="color: #94a3b8;">${app.t('booking_confirmed')}</p>
                <div class="booking-details">
                    <p><strong>${app.t('doc_label')}:</strong> ${selectedDoctor.name}</p>
                    <p><strong>${app.t('spec_label')}:</strong> ${selectedDoctor.specialty}</p>
                    <p><strong>${app.t('datetime_label')}:</strong> ${displayTime}</p>
                    <p><strong>${app.t('conf_label')}:</strong> MED-${Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                </div>
                <button class="book-btn" onclick="closeBookingModal()" style="margin-top: 20px;">${app.t('done')}</button>
            </div>
        `;

        // Add confirmation to chat
        addMessage(`Great! I've booked your appointment with ${selectedDoctor.name} for ${displayTime}. You'll receive a confirmation shortly.`);
    } catch (error) {
        console.error('Booking failed:', error);
        alert('An error occurred while booking. Please try again.');
    }
}

// Expose functions globally
window.openBookingModal = openBookingModal;
window.app = app;
window.getApiKey = getApiKey;
window.saveApiKey = saveApiKey;
window.showApiKeyModal = showApiKeyModal;
window.saveApiKeyAndClose = saveApiKeyAndClose;
window.checkApiKeySetup = checkApiKeySetup;

// Cleanup legacy data (e.g. from previous projects)
function cleanupLegacyData() {
    console.log('Running cleanup check...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);

        if (key.toLowerCase().includes('khel') || (value && value.toLowerCase().includes('khel'))) {
            keysToRemove.push(key);
        }
    }

    if (keysToRemove.length > 0) {
        console.warn('Cleaning up legacy data:', keysToRemove);
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('Cleanup complete.');
    }
}

// Initialize Application
async function initApp() {
    cleanupLegacyData(); // Run cleanup first

    // Check for API key first
    if (!getApiKey()) {
        setTimeout(() => showApiKeyModal(), 500);
    } else {
        const badge = document.querySelector('.ai-badge');
        if (badge) {
            badge.textContent = 'API Ready';
            badge.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        }
    }

    // Auto-route based on stored role
    const user = getCurrentUser();
    const role = getCurrentRole();

    if (user && role) {
        console.log(`Auto-routing: ${role} - ${user.full_name}`);

        if (role === 'patient') {
            // Skip role selection, go directly to patient screen
            app.role = 'patient';
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('patientScreen').classList.add('active');

            // Init AI greeting
            if (chatMessages && chatMessages.children.length === 0) {
                const greeting = `Assalam-o-Alaikum ${user.full_name}! I'm Dr. Ahmed, your virtual health assistant. How can I help you today?`;
                addMessage(greeting);
                setTimeout(() => speak(greeting), 500);
            }
        } else if (role === 'doctor') {
            // Doctor already authenticated via login page
            app.role = 'doctor';
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('doctorScreen').classList.add('active');

            // Update doctor header with actual name
            const headerName = document.querySelector('.doctor-profile span');
            if (headerName) {
                headerName.textContent = user.full_name;
            }

            // Init doctor dashboard with logged-in doctor's ID
            await doctorApp.init(user.id);
        }
    }
}

// ===== PATIENT CALL HANDLING =====
// Listen for incoming calls from doctors

function initPatientCallListener() {
    const user = getCurrentUser();
    const role = getCurrentRole();

    if (role !== 'patient' || !user) return;

    // Initialize CallManager for patient
    if (typeof CallManager !== 'undefined' && !CallManager.socket) {
        CallManager.init('patient', user.full_name);

        // Register this patient with the server so doctors can call them
        CallManager.socket.emit('register-patient', {
            patientId: user.id,
            patientName: user.full_name
        });
        console.log('[Patient] Registered for incoming calls, ID:', user.id);

        // Listen for incoming call notification from doctor
        CallManager.socket.on('incoming-call', ({ appointmentId, doctorName, roomId }) => {
            console.log('[Patient] Incoming call from', doctorName, 'for appointment', appointmentId);
            showIncomingCallBanner(doctorName, appointmentId);
        });
    }
}

function showIncomingCallBanner(doctorName, appointmentId) {
    // Remove existing banner if any
    const existing = document.querySelector('.incoming-call-banner');
    if (existing) existing.remove();

    // Store appointment ID for when patient accepts
    window.pendingCallAppointmentId = appointmentId;

    const banner = document.createElement('div');
    banner.className = 'incoming-call-banner';
    banner.innerHTML = `
        <h3>${app.t('incoming_call')}</h3>
        <p>${app.t('calling_you', { name: doctorName })}</p>
        <div class="call-actions">
            <button class="btn btn-call" onclick="acceptIncomingCall()">${app.t('accept')}</button>
            <button class="btn btn-end-call" onclick="declineIncomingCall()">${app.t('decline')}</button>
        </div>
    `;
    document.body.appendChild(banner);

    // Play notification sound (if available)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6di4OAj5ibmoZ1bmt5jJ+jo5qLfnp9hpKhpqOXiXx6foaNmJ6XiHd2e4OOmZ6bjntzd3qDj5ydmox8dXh8h5KcnZaIdXZ5gY2YnZuQgnZ1e4KNmJ2bkYN2dXuCjZidm5GDdnV7go2YnZuRg3Z1e4KNmJ2bkYN2dA==');
        audio.volume = 0.5;
        audio.play().catch(() => { });
    } catch (e) { }
}

async function acceptIncomingCall() {
    const banner = document.querySelector('.incoming-call-banner');
    if (banner) banner.remove();

    // Use the stored appointment ID from the incoming call
    const appointmentId = window.pendingCallAppointmentId;

    if (appointmentId) {
        await CallManager.joinRoom(appointmentId);

        // Show in-call UI for patient
        showPatientInCallUI();
    }
}

function showPatientInCallUI() {
    // Remove existing in-call UI if any
    const existing = document.querySelector('.patient-in-call-ui');
    if (existing) existing.remove();

    const inCallUI = document.createElement('div');
    inCallUI.className = 'patient-in-call-ui incoming-call-banner';
    inCallUI.style.border = '2px solid #22c55e';
    inCallUI.innerHTML = `
        <h3>${app.t('in_call_with')}</h3>
        <p id="patientCallStatus" style="color: #4ade80;">${app.t('connected_msg')}</p>
        <div id="patientTranscript" style="max-height: 150px; overflow-y: auto; text-align: left; margin: 10px 0; padding: 10px; background: #0f172a; border-radius: 8px; font-size: 0.9rem;">
            <p style="color: #64748b; font-style: italic;">${app.t('listening')}</p>
        </div>
        <div class="call-actions">
            <button id="patientMuteBtn" class="btn btn-mute" onclick="CallManager.toggleMute(); updatePatientMuteBtn()">${app.t('mute')}</button>
            <button class="btn btn-end-call" onclick="endPatientCall()">${app.t('end_call')}</button>
        </div>
    `;
    document.body.appendChild(inCallUI);

    // Set this as the transcript box for CallManager
    window.patientTranscriptBox = document.getElementById('patientTranscript');
}

function endPatientCall() {
    CallManager.endCall();

    // Remove in-call UI
    const inCallUI = document.querySelector('.patient-in-call-ui');
    if (inCallUI) inCallUI.remove();

    // Reset status
    const statusBadge = document.getElementById('status');
    if (statusBadge) {
        statusBadge.textContent = 'Online';
        statusBadge.className = 'status-badge';
    }
}

function declineIncomingCall() {
    const banner = document.querySelector('.incoming-call-banner');
    if (banner) banner.remove();
}

function updatePatientMuteBtn() {
    const btn = document.getElementById('patientMuteBtn');
    if (btn) {
        btn.textContent = CallManager.isMuted ? '🔇 Unmute' : '🎤 Mute';
    }
}

// ===== MOBILE NAVIGATION CONTROLLER =====
const mobileNav = {
    currentView: 'home',

    goto(view) {
        this.currentView = view;
        this.updateActiveState(view);

        switch (view) {
            case 'home':
                // Scroll to top, focus on chat
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'bookings':
                app.showPatientBookings();
                break;
            case 'prescriptions':
                app.showPatientPrescriptions();
                break;
            case 'settings':
                showApiKeyModal();
                break;
        }
    },

    updateActiveState(activeView) {
        document.querySelectorAll('.mobile-nav-item').forEach((item, index) => {
            const views = ['home', 'bookings', 'prescriptions', 'settings'];
            if (views[index] === activeView) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    // Show/hide based on role
    updateVisibility(role) {
        const nav = document.getElementById('mobileNav');
        if (nav) {
            // Only show for patients on mobile
            nav.style.display = role === 'patient' ? '' : 'none';
        }
    }
};

// Expose to window
window.mobileNav = mobileNav;

// Initialize patient call listener after app loads
setTimeout(initPatientCallListener, 2000);

// Start app on load
document.addEventListener('DOMContentLoaded', initApp);


