import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    company_id: { type: String, required: true },
    item: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit_price: Number,
    total_price: Number,
    currency: { type: String, default: 'INR' },
    customer_name: String,
    user_email: String,
    status: { type: String, default: 'completed' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

export const Order = mongoose.model('Order', orderSchema);
