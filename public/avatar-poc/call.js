/**
 * call.js - Audio Call Module with Live Transcription
 * Handles WebRTC peer connection and Web Speech API
 */

const CallManager = {
    socket: null,
    peerConnection: null,
    localStream: null,
    remoteAudio: null,
    roomId: null,
    role: null,
    userName: null,
    isInCall: false,

    // Speech recognition
    recognition: null,
    isTranscribing: false,

    // UI Elements (will be set on init)
    elements: {
        callBtn: null,
        endBtn: null,
        callStatus: null,
        transcriptBox: null,
        hintsBox: null
    },

    // Initialize the call manager
    init(role, userName) {
        this.role = role;
        this.userName = userName;

        // Connect to Socket.io
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('[Call] Socket connected:', this.socket.id);
        });

        // Setup socket event handlers
        this.setupSocketHandlers();

        // Create hidden audio element for remote audio
        this.remoteAudio = document.createElement('audio');
        this.remoteAudio.autoplay = true;
        document.body.appendChild(this.remoteAudio);

        console.log('[Call] Manager initialized for', role);
    },

    setupSocketHandlers() {
        // Someone joined the room
        this.socket.on('user-joined', ({ role, userName }) => {
            console.log(`[Call] ${role} (${userName}) joined`);
            this.updateStatus(`${userName} joined`);
        });

        // Ready to start call (both parties present)
        this.socket.on('ready-to-call', () => {
            console.log('[Call] Both parties ready');
            if (this.role === 'doctor') {
                // Doctor initiates the call
                this.startCall();
            }
        });

        // Receive offer (patient side)
        this.socket.on('offer', async ({ offer }) => {
            console.log('[Call] Received offer');
            await this.handleOffer(offer);
        });

        // Receive answer (doctor side)
        this.socket.on('answer', async ({ answer }) => {
            console.log('[Call] Received answer');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        // Receive ICE candidate
        this.socket.on('ice-candidate', async ({ candidate }) => {
            if (candidate && this.peerConnection) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        // Transcript update from other party
        this.socket.on('transcript-update', ({ speaker, text }) => {
            this.appendTranscript(speaker, text);
        });

        // AI hints data received
        this.socket.on('ai-hints-data', ({ transcript, medicalHistory }) => {
            this.generateAIHints(transcript, medicalHistory);
        });

        // Call ended
        this.socket.on('call-ended', ({ transcript }) => {
            console.log('[Call] Call ended, transcript saved');
            this.cleanup();
            this.updateStatus('Call ended');
        });

        // User left
        this.socket.on('user-left', ({ role }) => {
            console.log(`[Call] ${role} left`);
            this.updateStatus(`${role} left the call`);
            this.cleanup();
        });
    },

    // Join a consultation room
    async joinRoom(appointmentId) {
        this.roomId = `consultation-${appointmentId}`;

        // Get microphone access
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            console.log('[Call] Microphone access granted');
        } catch (err) {
            console.error('[Call] Microphone access denied:', err);
            alert('Microphone access is required for the call. Please allow microphone access.');
            return false;
        }

        // Join the room
        this.socket.emit('join-room', {
            roomId: this.roomId,
            role: this.role,
            userName: this.userName
        });

        this.updateStatus('Waiting for other party...');
        return true;
    },

    // Create peer connection
    createPeerConnection() {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(config);

        // Add local audio track
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });

        // Handle incoming audio
        this.peerConnection.ontrack = (event) => {
            console.log('[Call] Received remote track');
            this.remoteAudio.srcObject = event.streams[0];
            this.isInCall = true;
            this.updateStatus('Connected - In Call');
            this.startTranscription();
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    roomId: this.roomId,
                    candidate: event.candidate
                });
            }
        };

        // Connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('[Call] Connection state:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'disconnected') {
                this.updateStatus('Connection lost');
            }
        };
    },

    // Doctor starts the call
    async startCall() {
        console.log('[Call] Starting call...');
        this.createPeerConnection();

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.socket.emit('offer', {
            roomId: this.roomId,
            offer: offer
        });

        this.updateStatus('Calling...');
    },

    // Patient handles incoming call
    async handleOffer(offer) {
        this.createPeerConnection();

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit('answer', {
            roomId: this.roomId,
            answer: answer
        });
    },

    // Start speech recognition
    startTranscription() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('[Call] Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        let finalTranscript = '';
        let lastSentText = '';

        this.recognition.onresult = (event) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript = transcript;

                    // Only send if different from last sent
                    if (finalTranscript !== lastSentText && finalTranscript.trim()) {
                        lastSentText = finalTranscript;
                        this.socket.emit('transcript', {
                            roomId: this.roomId,
                            speaker: this.userName,
                            text: finalTranscript
                        });

                        // Request AI hints every few transcript updates (doctor only)
                        if (this.role === 'doctor') {
                            this.requestAIHints();
                        }
                    }
                } else {
                    interimTranscript += transcript;
                }
            }
        };

        this.recognition.onend = () => {
            // Restart if still in call
            if (this.isInCall) {
                this.recognition.start();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('[Call] Speech recognition error:', event.error);
            if (event.error !== 'no-speech' && this.isInCall) {
                setTimeout(() => this.recognition.start(), 1000);
            }
        };

        this.recognition.start();
        this.isTranscribing = true;
        console.log('[Call] Transcription started');
    },

    // Request AI hints from server
    requestAIHints() {
        const medicalHistory = doctorApp.currentAppointment?.medicalHistory || '';
        this.socket.emit('request-ai-hints', {
            roomId: this.roomId,
            medicalHistory
        });
    },

    // Generate AI hints (called when server sends transcript data)
    async generateAIHints(transcript, medicalHistory) {
        if (!transcript) return;

        const hintsBox = document.getElementById('aiHints');
        if (!hintsBox) return;

        hintsBox.innerHTML = '<span class="typing-text" style="color: #fbbf24;">Updating hints...</span>';

        const diagnosisPrompt = `
        You are an AI clinical decision support assistant in a LIVE consultation. Based on the ongoing conversation, provide 3-5 quick diagnostic hints.

        === PATIENT HISTORY ===
        ${medicalHistory || 'No prior history available'}

        === LIVE TRANSCRIPT ===
        ${transcript}

        === INSTRUCTIONS ===
        - Provide real-time relevant hints
        - Flag concerning patterns
        - Suggest follow-up questions if needed
        - Keep hints brief (2-5 words)
        - Return ONLY JSON array: ["Hint 1", "Hint 2"]
        `;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${getApiKey()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: diagnosisPrompt }] }]
                })
            });

            const data = await response.json();
            let hintsText = data.candidates[0].content.parts[0].text;

            hintsText = hintsText
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/g, '')
                .trim();

            try {
                const hintsArray = JSON.parse(hintsText);
                hintsBox.innerHTML = hintsArray
                    .map(hint => `<div class="hint-tag">${hint}</div>`)
                    .join('');
            } catch {
                // Fallback
                hintsBox.innerHTML = '<div class="hint-tag">Listen carefully</div>';
            }
        } catch (e) {
            console.error('[Call] AI hints failed:', e);
        }
    },

    // Append transcript to UI
    appendTranscript(speaker, text) {
        const transcriptBox = document.getElementById('liveTranscription');
        if (!transcriptBox) return;

        const entry = document.createElement('p');
        entry.innerHTML = `<strong>${speaker}:</strong> ${text}`;
        entry.style.marginBottom = '8px';
        entry.style.color = speaker === this.userName ? '#38bdf8' : '#e2e8f0';

        transcriptBox.appendChild(entry);
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    },

    // End the call
    endCall() {
        this.socket.emit('end-call', { roomId: this.roomId });
        this.cleanup();
    },

    // Cleanup resources
    cleanup() {
        this.isInCall = false;

        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.updateStatus('Call ended');
    },

    // Update status display
    updateStatus(status) {
        const statusEl = document.getElementById('callStatus');
        if (statusEl) {
            statusEl.textContent = status;
        }
        console.log('[Call] Status:', status);
    }
};

// Expose globally
window.CallManager = CallManager;
