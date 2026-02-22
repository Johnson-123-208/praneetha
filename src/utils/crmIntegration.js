/**
 * CRM Integration Module (Independent Version)
 * Automatically falls back to LocalStorage if the Backend API is unavailable.
 */

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:5000/api');

// --- Local Storage Helper (Unified with database.js) ---
const getLocal = (key) => {
    try { return JSON.parse(localStorage.getItem(`callix_${key}`)) || []; }
    catch { return []; }
};
const saveLocal = (key, data) => {
    const existing = getLocal(key);
    const newEntry = {
        ...data,
        _id: data._id || data.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        created_at: data.created_at || new Date().toISOString()
    };
    existing.push(newEntry);
    localStorage.setItem(`callix_${key}`, JSON.stringify(existing));
};

export const crmIntegration = {
    /**
     * Log a conversation to the CRM
     */
    async logConversation(data) {
        try {
            const res = await fetch(`${API_URL}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(() => null);

            if (res && res.ok) {
                const logData = await res.json();
                return { success: true, data: logData };
            }

            // Fallback: Save log locally
            saveLocal('conversation_logs', data);
            return { success: true, message: 'Log saved locally' };
        } catch (error) {
            saveLocal('conversation_logs', data);
            return { success: true, message: 'Log saved locally' };
        }
    },

    /**
     * Create or update appointment
     */
    async syncAppointment(appointmentData) {
        try {
            const res = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentData)
            }).catch(() => null);

            if (res && res.ok) {
                const data = await res.json();
                return { success: true, data };
            }

            saveLocal('appointments', appointmentData);
            return { success: true, message: 'Sync skipped - saved locally' };
        } catch (error) {
            saveLocal('appointments', appointmentData);
            return { success: true };
        }
    },

    /**
     * Create or update order
     */
    async syncOrder(orderData) {
        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            }).catch(() => null);

            if (res && res.ok) {
                const data = await res.json();
                return { success: true, data };
            }

            saveLocal('orders', orderData);
            return { success: true };
        } catch (error) {
            saveLocal('orders', orderData);
            return { success: true };
        }
    },

    /**
     * Save feedback to CRM
     */
    async syncFeedback(feedbackData) {
        try {
            const res = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData)
            }).catch(() => null);

            if (res && res.ok) {
                const data = await res.json();
                return { success: true, data };
            }

            saveLocal('feedback', feedbackData);
            return { success: true };
        } catch (error) {
            saveLocal('feedback', feedbackData);
            return { success: true };
        }
    },

    /**
     * Get conversation history for a session
     */
    async getConversationHistory(sessionId) {
        try {
            const res = await fetch(`${API_URL}/logs?session_id=${sessionId}`).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                return { success: true, data: data || [] };
            }

            const localLogs = getLocal('conversation_logs').filter(l => l.session_id === sessionId);
            return { success: true, data: localLogs };
        } catch (error) {
            const localLogs = getLocal('conversation_logs').filter(l => l.session_id === sessionId);
            return { success: true, data: localLogs };
        }
    }
};

export default crmIntegration;
