import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    full_name: String,
    phone: String,
    preferred_language: { type: String, default: 'en-US' },
    last_login: Date,
    created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
