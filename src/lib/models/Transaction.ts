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
    enum: ['cash', 'online', 'bank_transfer', 'others', 'card'],
    default: 'cash',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'fake'],
    default: 'completed',
  },
  isFake: {
    type: Boolean,
    default: false,
  },
  fakeReason: {
    type: String,
    default: '',
  },
  fakeFlaggedAt: {
    type: Date,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryMember',
  },
  studentName: {
    type: String,
  },
  studentEmail: {
    type: String,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  receiptNumber: {
    type: String,
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

if (mongoose.models && mongoose.models.LibraryTransaction) {
  delete mongoose.models.LibraryTransaction;
}

export default mongoose.models.LibraryTransaction || mongoose.model('LibraryTransaction', TransactionSchema);