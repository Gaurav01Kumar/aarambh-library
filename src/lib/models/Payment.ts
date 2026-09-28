import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  months: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  paidAmount: {
    type: Number,
    default: function(this: any): number {
      return this.totalPrice || 0;
    },
  },
  dueAmount: {
    type: Number,
    default: 0,
  },
  advanceAmount: {
    type: Number,
    default: 0,
  },
  paymentType: {
    type: String,
    enum: ['full', 'partial', 'advance'],
    default: 'full',
  },
  remarks: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'bank_transfer', 'card'],
    default: 'cash',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  transactionId: {
    type: String,
    sparse: true,
  },
  utr: {
    type: String,
  },
  receiptNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'partial', 'failed'],
    default: 'completed',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Clear Mongoose model cache in Next.js dev mode to apply enum updates
if (mongoose.models && mongoose.models.Payment) {
  delete mongoose.models.Payment;
}

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
