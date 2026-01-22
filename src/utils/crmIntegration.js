/**
 * CRM Integration Module
 * Handles real-time data sync, call logging, and customer relationship management
 */

import { supabase, isSupabaseInitialized } from './supabaseClient';

export const crmIntegration = {
    /**
     * Log a conversation to the CRM
     */
    async logConversation(data) {
        if (!isSupabaseInitialized()) {
            console.warn('Supabase not initialized, storing conversation locally');
            return this.logConversationLocally(data);
        }

        try {
            const { data: logData, error } = await supabase
                .from('conversation_logs')
                .insert([{
                    company_id: data.companyId,
                    user_id: data.userId || null,
                    session_id: data.sessionId,
                    user_message: data.userMessage,
                    agent_response: data.agentResponse,
                    language: data.language || 'en-US',
                    detected_intent: data.detectedIntent || null,
                    function_called: data.functionCalled || null,
                    function_result: data.functionResult || null
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: logData };
        } catch (error) {
            console.error('Error logging conversation:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Store conversation locally as fallback
     */
    logConversationLocally(data) {
        try {
            const logs = JSON.parse(localStorage.getItem('conversation_logs') || '[]');
            logs.push({
                ...data,
                id: `local_${Date.now()}`,
                created_at: new Date().toISOString()
            });

            // Keep only last 100 logs
            if (logs.length > 100) {
                logs.shift();
            }

            localStorage.setItem('conversation_logs', JSON.stringify(logs));
            return { success: true, data: logs[logs.length - 1] };
        } catch (error) {
            console.error('Error storing conversation locally:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create or update appointment
     */
    async syncAppointment(appointmentData) {
        if (!isSupabaseInitialized()) {
            console.warn('Supabase not initialized');
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert([appointmentData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error syncing appointment:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create or update order
     */
    async syncOrder(orderData) {
        if (!isSupabaseInitialized()) {
            console.warn('Supabase not initialized');
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error syncing order:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Save feedback to CRM
     */
    async syncFeedback(feedbackData) {
        if (!isSupabaseInitialized()) {
            console.warn('Supabase not initialized');
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase
                .from('feedback')
                .insert([feedbackData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error syncing feedback:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get customer profile by email or phone
     */
    async getCustomerProfile(identifier) {
        if (!isSupabaseInitialized()) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`email.eq.${identifier},phone.eq.${identifier}`)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

            return { success: true, data: data || null };
        } catch (error) {
            console.error('Error fetching customer profile:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get customer's appointment history
     */
    async getCustomerAppointments(userId) {
        if (!isSupabaseInitialized()) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          companies:entity_id (name, industry),
          doctors:doctor_id (name, specialization)
        `)
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(10);

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching customer appointments:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get customer's order history
     */
    async getCustomerOrders(userId) {
        if (!isSupabaseInitialized()) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          companies:company_id (name, industry)
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching customer orders:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update customer last interaction
     */
    async updateCustomerInteraction(userId, interactionData) {
        if (!isSupabaseInitialized()) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    last_login: new Date().toISOString(),
                    ...interactionData
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error updating customer interaction:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get conversation history for a session
     */
    async getConversationHistory(sessionId) {
        if (!isSupabaseInitialized()) {
            // Fallback to local storage
            const logs = JSON.parse(localStorage.getItem('conversation_logs') || '[]');
            return {
                success: true,
                data: logs.filter(log => log.sessionId === sessionId)
            };
        }

        try {
            const { data, error } = await supabase
                .from('conversation_logs')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Generate analytics report
     */
    async getAnalytics(companyId, dateRange = 7) {
        if (!isSupabaseInitialized()) {
            return { success: false, error: 'Database not available' };
        }

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - dateRange);

            // Get conversation count
            const { count: conversationCount } = await supabase
                .from('conversation_logs')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .gte('created_at', startDate.toISOString());

            // Get appointment count
            const { count: appointmentCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('entity_id', companyId)
                .gte('created_at', startDate.toISOString());

            // Get order count
            const { count: orderCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .gte('created_at', startDate.toISOString());

            // Get average feedback rating
            const { data: feedbackData } = await supabase
                .from('feedback')
                .select('rating')
                .eq('entity_id', companyId)
                .gte('created_at', startDate.toISOString());

            const avgRating = feedbackData && feedbackData.length > 0
                ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
                : 0;

            return {
                success: true,
                data: {
                    conversationCount: conversationCount || 0,
                    appointmentCount: appointmentCount || 0,
                    orderCount: orderCount || 0,
                    averageRating: avgRating.toFixed(1),
                    dateRange
                }
            };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return { success: false, error: error.message };
        }
    }
};

export default crmIntegration;
