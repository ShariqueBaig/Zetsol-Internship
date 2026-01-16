# MedAssist AI - SRS (Business) v2.0
## Software Requirements Specification

**Version:** 2.0  
**Date:** January 16, 2026  
**Status:** MVP + Mobile Polish  
**Author:** Sharique Baig

---

## 1. Executive Summary

MedAssist AI is a comprehensive telemedicine platform designed to bridge the gap between patients and doctors through AI-enhanced interactions. Version 2.0 introduces a fully responsive **Mobile-First Design** and robust **Cloud-Based Transcription** capabilities, ensuring the application is accessible on any device.

### Core Value Proposition
- **For Patients:** Instant symptom analysis via AI Avatar, seamless mobile booking, and engaging health tracking.
- **For Doctors:** AI Copilot aimed at reducing administrative burden by transcribing consultations and suggesting diagnoses in real-time.

---

## 2. New Features in v2.0

### 📱 Enhanced Mobile Experience
- **Bottom Navigation:** Sticky navigation bar for patients (Home, Bookings, Rx, Settings) for intuitive mobile access.
- **Responsive Design:** Optimized layouts for phones (360px+) and tablets, including stacked chat interfaces and touch-friendly buttons.
- **Adaptive UI:** Smart resizing of the 3D Avatar and chat components to fit smaller viewports without losing functionality.

### ☁️ Cloud-Based Speech Engine
- **Universal Compatibility:** Replaced reliance on inconsistent browser APIs with a robust **MediaRecorder + Gemini Cloud** pipeline.
- **Accuracy:** Leverages Google's Gemini 1.5 Multimodal capabilities for superior speech-to-text accuracy compared to native browser engines.

---

## 3. Product Scope & Features

### 3.1 Patient Module
| Feature | Status | Description |
|---------|--------|-------------|
| **AI Symptom Checker** | ✅ Live | Interactive 3D Avatar chat for symptom triage. |
| **Smart Booking** | ✅ Live | AI recommends doctors based on triage; 2-click booking. |
| **Mobile Dashboard** | ✅ **NEW** | Optimized mobile view with bottom navigation. |
| **My Bookings** | ✅ Live | View past and upcoming appointments with status tracking. |
| **Prescription View** | ✅ Live | Digital access to doctor-issued prescriptions. |

### 3.2 Doctor Module
| Feature | Status | Description |
|---------|--------|-------------|
| **Smart Dashboard** | ✅ Live | Overview of daily appointments and patient waitlist. |
| **Patient Summary** | ✅ Live | AI generates specific summaries from patient chat history. |
| **Live Consultation** | ✅ Live | WebRTC-based audio calls with patients. |
| **Clinical Hints** | ✅ Live | AI suggests 3-5 potential diagnoses during the call. |
| **Live Transcription** | ⚠️ Desktop | Real-time speech-to-text (Desktop optimized). |

---

## 4. Modified User Flows

### Mobile Patient Journey
```mermaid
graph TD
    A[Open Mobile App] --> B{Role Selection}
    B -->|Patient| C[Mobile Dashboard]
    
    subgraph "Mobile Dashboard"
    C --> D[🏠 Home / AI Chat]
    C --> E[📅 My Bookings]
    C --> F[💊 Prescriptions]
    C --> G[⚙️ Settings]
    end
    
    D --> H[Describe Symptoms (Voice/Text)]
    H --> I[AI Recommend Specialist]
    I --> J[Book Slot (Mobile Grid)]
```

---

## 5. System Architecture (High Level)

The system utilizes a **Hybrid Architecture**:
- **Frontend:** Vanilla JS + CSS3 (No Framework Overhead), optimized for performance.
- **AI Core:** Direct-to-Cloud architecture where the Client communicates with Gemini API for privacy and speed.
- **Real-Time:** Socket.io for proprietary signaling + WebRTC for peer-to-peer data/audio.

---

## 6. Future Roadmap (v3.0)

1.  **Video Consultations:** Upgrade WebRTC to support video streams.
2.  **Pharmacy Integration:** Allow patients to order prescribed meds directly.
3.  **Preventive Care:** AI-driven push notifications for health checkups.
4.  **Multi-Language:** Support for Spanish and Hindi via Gemini translation.

---
*MedAssist AI - Enabling the Future of Healthcare*
