import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryMember',
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
  deviceId: {
    type: String,
  },
  wifiIp: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  ipAddress: {
    type: String,
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  failureReason: {
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

// Force reload model in dev to catch schema changes
if (mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}

export default mongoose.model('Attendance', AttendanceSchema);