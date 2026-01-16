# MedAssist AI - System Architecture Document v2.0

## 1. Executive Summary
MedAssist AI v2.0 is a scalable telemedicine platform capable of delivering high-fidelity AI interactions across desktop and mobile devices. The architecture has been evolved to support **Cloud-Based Speech Processing** to overcome mobile browser limitations, ensuring a consistent experience for all users.

---

## 2. Updated Technology Stack

### Frontend (Client-Side)
- **Core:** HTML5, CSS3 (Mobile-First Responsiveness), Vanilla JavaScript.
- **Mobile UI:** New bottom navigation, adaptive layouts, and touch-optimized controls.
- **Audio Capture:** 
  - **MediaRecorder API** (New): For reliable cross-platform audio capture (Blob based).
  - **Web Speech API**: Retained as legacy/desktop optimization.

### Backend (Server-Side)
- **Runtime:** Node.js + Express.js.
- **Protocol:** HTTP/2 for API, WebSocket (`socket.io`) for signaling.
- **Database:** SQLite (Embedded) for zero-config persistence.

### AI & Cloud Services
- **Gemini 2.5 Flash Lite:** Main text-chat engine.
- **Gemini 1.5 Flash (Multimodal):** **NEW** - Handles raw audio processing for robust speech-to-text on mobile.
- **Google STUN:** NAT traversal for WebRTC.

---

## 3. v2.0 Architecture Diagram

```mermaid
graph TD
    subgraph Client [Client Device (Mobile/Desktop)]
        UI[Responsive UI]
        Recorder[MediaRecorder API]
        SocketClient[Socket.io Client]
        GeminiClient[Gemini Client SDK]
    end

    subgraph Server [Node.js Backend]
        API[Express API]
        Signaling[Socket.io Signaling]
        DB[(SQLite Database)]
    end

    subgraph Cloud [Google Cloud AI]
        GeminiText[Gemini 2.5 (Chat)]
        GeminiAudio[Gemini 1.5 (Speech-to-Text)]
    end

    %% Flows
    UI -->|1. Record Audio| Recorder
    Recorder -->|2. Audio Blob| GeminiClient
    GeminiClient -->|3. POST Audio| GeminiAudio
    GeminiAudio -->|4. Text Transcript| GeminiClient
    
    GeminiClient -->|5. Chat Context| GeminiText
    GeminiText -->|6. AI Response| UI

    UI -->|7. API Requests| API
    API --> DB

    UI -->|8. Real-time Events| Signaling
```

---

## 4. Key Architectural Decisions

### A. Cloud-Based Transcription Strategy
To solve the "Mobile Speech" issue (where `webkitSpeechRecognition` fails on iOS/Android Chrome):
1.  **Capture Refactor**: We switched to `MediaRecorder`, which is supported by all modern mobile browsers.
2.  **Audio Pipeline**: Instead of local transcription, 5-10 second audio chunks are sent directly to **Gemini 1.5 Flash**.
3.  **Benefits**: 
    - Works on 99% of devices.
    - Higher accuracy (context-aware AI vs simple phoneme matching).
    - Reduces client-side processing load.

### B. Mobile-First UI Overhaul
The CSS architecture was refactored to support a **bottom-up navigation** model on small screens, separating "global actions" (Nav Bar) from "contextual actions" (Chat/Mic), aligning with modern mobile UX patterns (like WhatsApp/Telegram).

### C. Client-Direct AI Calls
We maintain the architecture of calling Gemini directly from the Client.
- **Pros**: Reduces server latency, bandwidth, and complexity. No need for a "proxy" server to handle heavy audio streams.
- **Cons**: API Key is on client (secure enough for MVP with origin restrictions).

---

## 5. Deployment Package

The application is packaged with Docker for "write once, run anywhere" deployment:
- **Dockerfile**: Multi-stage build (Node Alpine).
- **Docker Compose**: Orchestrates Server + Volume persistence.
- **Persistence**: `medassist.db` is mounted as a volume to survive container restarts.

---

*Architected by Sharique Baig - Zetsol Internship 2026*
