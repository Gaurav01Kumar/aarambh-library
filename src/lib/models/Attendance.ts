import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
  },
  seatNumber: {
    type: String,
  },
  checkInMethod: {
    type: String,
    enum: ['qr', 'manual', 'biometric'],
    default: 'qr',
  },
  checkOutMethod: {
    type: String,
    enum: ['qr', 'manual', 'biometric'],
  },
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

AttendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  ;
});

export default mongoose.models?.Attendance || mongoose.model('Attendance', AttendanceSchema);