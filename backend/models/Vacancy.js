import mongoose from 'mongoose';

const vacancySchema = new mongoose.Schema({
    company_id: String,
    position: String,
    department: String,
    status: { type: String, default: 'open' },
    description: String,
    created_at: { type: Date, default: Date.now }
});

export const Vacancy = mongoose.model('Vacancy', vacancySchema);
