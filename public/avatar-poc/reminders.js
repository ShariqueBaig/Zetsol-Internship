/**
 * reminders.js
 * Client-side appointment reminder system using Browser Notifications
 */

const ReminderService = {
    checkInterval: null,
    notifiedAppointments: new Set(), // Track which appts we've already notified

    async init() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('[Reminders] Notification permission:', permission);
        }

        // Start checking for upcoming appointments every minute
        this.startChecking();
    },

    startChecking() {
        // Check immediately
        this.checkUpcoming();

        // Then check every 60 seconds
        this.checkInterval = setInterval(() => {
            this.checkUpcoming();
        }, 60000);

        console.log('[Reminders] Started appointment monitoring');
    },

    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    },

    async checkUpcoming() {
        const user = getCurrentUser();
        const role = getCurrentRole();

        if (!user || role !== 'patient') return;

        try {
            // Fetch patient's upcoming appointments
            const response = await fetch(`/api/appointments?patient_id=${user.id}`);
            const appointments = await response.json();

            const now = new Date();

            appointments.forEach(appt => {
                if (appt.status !== 'upcoming') return;

                // Parse appointment date/time
                const apptDateTime = new Date(`${appt.date}T${appt.time}`);
                const timeDiff = apptDateTime - now;
                const minutesUntil = Math.floor(timeDiff / 60000);

                // Notify 15 minutes before (and only once)
                if (minutesUntil > 0 && minutesUntil <= 15 && !this.notifiedAppointments.has(appt.id)) {
                    this.notifiedAppointments.add(appt.id);
                    this.showReminder(appt, minutesUntil);
                }
            });
        } catch (error) {
            console.error('[Reminders] Failed to check appointments:', error);
        }
    },

    showReminder(appointment, minutesUntil) {
        const title = '🏥 Appointment Reminder';
        const body = `Your appointment with ${appointment.doctor_name || 'your doctor'} is in ${minutesUntil} minutes!`;

        // Browser notification (if permitted)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/assets/icon-192.png',
                badge: '/assets/icon-192.png',
                tag: `appt-${appointment.id}`,
                requireInteraction: true
            });
        }

        // Also show in-app toast
        this.showToast(body);
    },

    showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'reminder-toast';
        toast.innerHTML = `
            <div class="toast-icon">🔔</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add styles if not present
        if (!document.getElementById('reminder-styles')) {
            const style = document.createElement('style');
            style.id = 'reminder-styles';
            style.textContent = `
                .reminder-toast {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #38bdf8, #6366f1);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10000;
                    animation: slideDown 0.3s ease;
                    max-width: 90vw;
                }
                .toast-icon { font-size: 1.5rem; }
                .toast-message { flex: 1; font-weight: 500; }
                .toast-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                }
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto-remove after 10 seconds
        setTimeout(() => toast.remove(), 10000);
    }
};

// Export to window
window.ReminderService = ReminderService;
