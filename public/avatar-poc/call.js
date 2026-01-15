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

            // Show transcript summary if we have content
            if (transcript) {
                this.showTranscriptSummary(transcript);
            }
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

            // Clear transcript box for new call
            const transcriptBox = document.getElementById('liveTranscription');
            if (transcriptBox) {
                transcriptBox.innerHTML = '<p style="color: #4ade80; font-style: italic;">🎙️ Call connected - speak to see live transcription</p>';
            }

            this.startTranscription();

            // Start periodic AI hint updates for doctor
            if (this.role === 'doctor') {
                this.startPeriodicHints();
            }
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
        console.log('[Call] Starting transcription...');

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('[Call] Speech recognition NOT supported in this browser!');
            alert('Speech recognition is not supported in your browser. Please use Chrome.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        let finalTranscript = '';
        let lastSentText = '';

        // Debug events
        this.recognition.onstart = () => {
            console.log('[Call] ✅ Speech recognition STARTED - speak now!');
        };

        this.recognition.onaudiostart = () => {
            console.log('[Call] 🎤 Audio capture started');
        };

        this.recognition.onsoundstart = () => {
            console.log('[Call] 🔊 Sound detected');
        };

        this.recognition.onspeechstart = () => {
            console.log('[Call] 🗣️ Speech detected!');
        };

        this.recognition.onresult = (event) => {
            console.log('[Call] Got result event:', event.results.length, 'results');
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                console.log('[Call] Transcript segment:', transcript, 'isFinal:', event.results[i].isFinal);

                if (event.results[i].isFinal) {
                    finalTranscript = transcript;

                    // Only send if different from last sent
                    if (finalTranscript !== lastSentText && finalTranscript.trim()) {
                        lastSentText = finalTranscript;
                        console.log('[Call] Sending final transcript:', finalTranscript);

                        // Show own speech immediately in transcript
                        this.appendTranscript(this.userName, finalTranscript);

                        // Send to other party via Socket.io
                        this.socket.emit('transcript', {
                            roomId: this.roomId,
                            speaker: this.userName,
                            text: finalTranscript
                        });
                    }
                } else {
                    interimTranscript += transcript;
                    console.log('[Call] Interim:', interimTranscript);
                }
            }
        };

        this.recognition.onend = () => {
            console.log('[Call] Speech recognition ended, isInCall:', this.isInCall);
            this.isTranscribing = false;

            // Restart if still in call and recognition object exists
            if (this.isInCall && this.recognition) {
                console.log('[Call] Restarting recognition...');
                try {
                    this.recognition.start();
                    this.isTranscribing = true;
                } catch (e) {
                    // Ignore "already started" errors
                    if (e.name !== 'InvalidStateError') {
                        console.error('[Call] Failed to restart:', e);
                    }
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('[Call] Speech recognition ERROR:', event.error);

            // Don't restart on 'aborted' as it usually means we stopped it or it's being restarted
            if (event.error === 'aborted') return;

            if (event.error !== 'no-speech' && this.isInCall && this.recognition) {
                setTimeout(() => {
                    if (this.isInCall && this.recognition && !this.isTranscribing) {
                        try {
                            this.recognition.start();
                            this.isTranscribing = true;
                        } catch (e) {
                            if (e.name !== 'InvalidStateError') {
                                console.error('[Call] Retry failed:', e);
                            }
                        }
                    }
                }, 1000);
            }
        };

        try {
            this.recognition.start();
            this.isTranscribing = true;
            console.log('[Call] ✅ Transcription start() called');
        } catch (e) {
            if (e.name !== 'InvalidStateError') {
                console.error('[Call] Failed to start recognition:', e);
            }
        }
    },

    // Start periodic AI hint updates every 10 seconds
    startPeriodicHints() {
        // Clear any existing interval
        if (this.hintInterval) {
            clearInterval(this.hintInterval);
        }

        // Request hints immediately
        setTimeout(() => this.requestAIHints(), 2000);

        // Then every 10 seconds
        this.hintInterval = setInterval(() => {
            if (this.isInCall) {
                this.requestAIHints();
            }
        }, 10000);

        console.log('[Call] Periodic AI hints started');
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
        // Try to find transcript box - doctor view or patient view
        let transcriptBox = document.getElementById('liveTranscription');
        if (!transcriptBox) {
            transcriptBox = document.getElementById('patientTranscript');
        }
        if (!transcriptBox) {
            console.log('[Call] No transcript box found, transcript:', speaker, text);
            return;
        }

        // Clear the "listening" placeholder if it's the first real transcript
        if (transcriptBox.querySelector('p[style*="italic"]')) {
            transcriptBox.innerHTML = '';
        }

        const entry = document.createElement('p');
        entry.innerHTML = `<strong>${speaker}:</strong> ${text}`;
        entry.style.marginBottom = '8px';
        entry.style.color = speaker === this.userName ? '#38bdf8' : '#e2e8f0';

        transcriptBox.appendChild(entry);
        transcriptBox.scrollTop = transcriptBox.scrollHeight;

        console.log('[Call] Transcript appended:', speaker, text);
    },

    // End the call
    endCall() {
        this.socket.emit('end-call', { roomId: this.roomId });
        this.cleanup();
    },

    // Cleanup resources
    cleanup() {
        this.isInCall = false;

        // Stop periodic hint updates
        if (this.hintInterval) {
            clearInterval(this.hintInterval);
            this.hintInterval = null;
        }

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
    },
    // Show transcript summary modal
    showTranscriptSummary(transcript) {
        // Remove existing modal if any
        const existing = document.getElementById('transcript-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'transcript-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
        `;

        modal.innerHTML = `
            <div style="background: #1e293b; color: #fff; padding: 25px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                <h2 style="margin-top: 0; color: #38bdf8;">📝 Consultation Summary</h2>
                <div style="background: #0f172a; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; white-space: pre-wrap; line-height: 1.5; color: #e2e8f0; max-height: 50vh; overflow-y: auto;">${transcript}</div>
                <div style="text-align: right;">
                    <button onclick="document.getElementById('transcript-modal').remove()" style="background: #3b82f6; border: none; padding: 10px 20px; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }
};

// Expose globally
window.CallManager = CallManager;
