import mongoose from 'mongoose';

const FeeReminderSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'overdue', 'paid'],
    default: 'pending',
  },
  reminderType: {
    type: String,
    enum: ['first', 'second', 'final', 'overdue'],
    default: 'first',
  },
  sentDate: {
    type: Date,
  },
  sentVia: [{
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'notification'],
  }],
  message: {
    type: String,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidDate: {
    type: Date,
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
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

FeeReminderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  ;
});

export default mongoose.models.FeeReminder || mongoose.model('FeeReminder', FeeReminderSchema);