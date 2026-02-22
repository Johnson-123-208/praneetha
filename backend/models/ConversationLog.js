import mongoose from 'mongoose';

const conversationLogSchema = new mongoose.Schema({
    company_id: String,
    user_id: String,
    session_id: { type: String, required: true },
    user_message: String,
    agent_response: String,
    language: { type: String, default: 'en-US' },
    detected_intent: String,
    function_called: String,
    function_result: mongoose.Schema.Types.Mixed,
    created_at: { type: Date, default: Date.now }
});

export const ConversationLog = mongoose.model('ConversationLog', conversationLogSchema);
