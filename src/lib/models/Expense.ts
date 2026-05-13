import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  month: {
    type: String, // Format: "2024-01"
  },
  year: {
    type: Number,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'online'],
  },
  receiptNumber: {
    type: String,
  },
  vendor: {
    type: String,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  attachments: [{
    type: String,
  }],
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ExpenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  ;
});

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);