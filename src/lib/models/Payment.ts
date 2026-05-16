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
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
});

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
