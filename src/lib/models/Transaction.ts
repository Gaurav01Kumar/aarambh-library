import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'bank_transfer', 'others'],
    default: 'cash',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
  utr: {
    type: String, // Transaction ID / UTR for online payments
  },
  referenceId: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { 
  timestamps: true 
});

// Rename to LibraryTransaction to bypass any cached models named Transaction
export default mongoose.models.LibraryTransaction || mongoose.model('LibraryTransaction', TransactionSchema);