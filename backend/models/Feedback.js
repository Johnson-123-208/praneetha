import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    entity_id: String,
    entity_name: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    category: String,
    user_email: String,
    created_at: { type: Date, default: Date.now }
});

export const Feedback = mongoose.model('Feedback', feedbackSchema);
