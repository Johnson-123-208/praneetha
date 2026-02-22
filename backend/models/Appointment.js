import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    entity_id: String,
    entity_name: String,
    type: { type: String, required: true }, // doctor, ceo, table, etc.
    person_name: String,
    doctor_id: String,
    date: { type: String, required: true },
    time: { type: String, required: true },
    user_email: String,
    user_info: mongoose.Schema.Types.Mixed,
    status: { type: String, default: 'scheduled' },
    created_at: { type: Date, default: Date.now }
});

export const Appointment = mongoose.model('Appointment', appointmentSchema);
