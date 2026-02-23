import { getApiUrl } from './database.js';

const API_URL = getApiUrl();

// --- Local Storage Helper (Unified with database.js) ---
const getLocal = (key) => {
    try { return JSON.parse(localStorage.getItem(`callix_${key}`)) || []; }
    catch { return []; }
};
// --- Semantic Deduplication Cache ---
const recentCache = new Set();
const dedupe = (data) => {
    // Generate a unique semantic key based on core fields
    const coreFields = [
        data.user_email || data.customer_name,
        data.entity_id || data.company_id,
        data.date,
        data.time,
        data.person_name,
        data.item
    ].filter(Boolean).join('|');

    if (recentCache.has(coreFields)) return true;
    recentCache.add(coreFields);
    setTimeout(() => recentCache.delete(coreFields), 30000); // 30s dedupe window
    return false;
};

const saveLocal = (key, data) => {
    if (dedupe(data)) return;
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
        if (dedupe(appointmentData)) return { success: true, message: 'Duplicate blocked' };
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
        if (dedupe(orderData)) return { success: true, message: 'Duplicate blocked' };
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
        if (dedupe(feedbackData)) return { success: true, message: 'Duplicate blocked' };
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
