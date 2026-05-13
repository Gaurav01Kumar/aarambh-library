import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  label: { type: String }, // e.g., "Morning Shift"
});

const SubscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  totalHours: {
    type: Number,
    required: true,
  },
  shifts: [ShiftSchema],
  startTime: { type: String },
  endTime: { type: String },
  regularPrice: {
    type: Number,
    required: true,
  },
  salePrice: {
    type: Number,
  },
  price: {
    type: Number,
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'],
    default: 'monthly',
  },
  allowDiscount: {
    type: Boolean,
    default: false,
  },
  discountRange: {
    type: String,
  },
  planType: {
    type: String,
    enum: ['free', 'basic', 'pro'],
    default: 'basic',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { 
  timestamps: true 
});

// Using a brand new name to completely bypass any cached models or hooks
export default mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionSchema);