import { database } from './database.js';

/**
 * CRM INTEGRATION LAYER (Refactored for Supabase)
 * This layer bridges the AI Voice Agent results to our Supabase tables.
 */

// --- Semantic Deduplication Cache ---
const recentCache = new Set();
const dedupe = (data) => {
    // Generate a unique semantic key based on core fields to prevent double-logging
    const coreFields = [
        data.user_email || data.userEmail,
        data.entity_id || data.company_id || data.companyId,
        data.date,
        data.time,
        data.person_name || data.personName,
        data.item
    ].filter(Boolean).join('|');

    if (recentCache.has(coreFields)) return true;
    recentCache.add(coreFields);
    setTimeout(() => recentCache.delete(coreFields), 30000); // 30s dedupe window
    return false;
};

export const crmIntegration = {
    /**
     * Log a conversation to Supabase
     */
    async logConversation(data) {
        // Conversation logs can be saved to a logs table if needed
        console.log('CRM: Logging Conversation', data);
        return { success: true };
    },

    /**
     * Create or update appointment
     */
    async syncAppointment(appointmentData) {
        if (dedupe(appointmentData)) return { success: true, message: 'Duplicate blocked' };

        try {
            // Map the flat data from VoiceOverlay to the expected logic in database.js
            const result = await database.saveAppointment({
                companyId: appointmentData.entity_id || appointmentData.companyId,
                userEmail: appointmentData.user_email || appointmentData.userEmail,
                date: appointmentData.date,
                time: appointmentData.time,
                industry: appointmentData.industry || (appointmentData.type === 'doctor' ? 'Healthcare' : 'Technology'),
                relatedId: appointmentData.relatedId || appointmentData.person_name
            });

            return result.error ? { error: result.error } : { success: true, data: result };
        } catch (error) {
            console.error('CRM Sync Error (Appointment):', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create or update order
     */
    async syncOrder(orderData) {
        if (dedupe(orderData)) return { success: true, message: 'Duplicate blocked' };

        try {
            const result = await database.saveOrder({
                companyId: orderData.company_id || orderData.companyId,
                userEmail: orderData.user_email || orderData.userEmail,
                productId: orderData.product_id || orderData.productId,
                quantity: orderData.quantity || 1,
                industry: orderData.industry || 'E-Commerce'
            });

            return result.error ? { error: result.error } : { success: true, data: result };
        } catch (error) {
            console.error('CRM Sync Error (Order):', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Save feedback to Supabase
     */
    async syncFeedback(feedbackData) {
        if (dedupe(feedbackData)) return { success: true, message: 'Duplicate blocked' };

        try {
            const result = await database.saveFeedback({
                companyId: feedbackData.entity_id || feedbackData.company_id,
                userEmail: feedbackData.user_email || feedbackData.userEmail,
                rating: feedbackData.rating,
                comment: feedbackData.comment
            });

            return result.error ? { error: result.error } : { success: true, data: result };
        } catch (error) {
            console.error('CRM Sync Error (Feedback):', error);
            return { success: false, error: error.message };
        }
    }
};

export default crmIntegration;
