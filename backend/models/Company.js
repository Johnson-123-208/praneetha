import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    industry: { type: String, required: true },
    logo: { type: String, default: '🏢' },
    context_summary: String,
    nlp_context: String,
    website_url: String,
    contact_email: String,
    contact_phone: String,
    contact_address: String,
    social_media: mongoose.Schema.Types.Mixed,
    gender: { type: String, default: 'female' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const Company = mongoose.model('Company', companySchema);
