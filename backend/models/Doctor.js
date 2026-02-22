import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    hospital_id: { type: String, required: true },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience_years: Number,
    is_available: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

export const Doctor = mongoose.model('Doctor', doctorSchema);
