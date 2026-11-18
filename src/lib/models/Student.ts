import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  idProof: {
    type: String,
    required: true,
  },
  idProofNumber: {
    type: String,
    required: true,
  },
  seatNumber: {
    type: String,
  },
  qrCode: {
    type: String,
    unique: true,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  feeStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'partial'],
    default: 'unpaid',
  },
  feeAmount: {
    type: Number,
    default: 0,
  },
  feeDueDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  subscriptionPlan: {
    type: String,
    default: 'free',
  },
  subscriptionExpiry: {
    type: Date,
  },
  profileImage: {
    type: String,
  },
  targetExam: {
    type: String,
    default: '',
  },
  studyStage: {
    type: String,
    default: '',
  },
  examTargets: [{
    examName: { type: String, required: true },
    examDate: { type: Date, required: true },
    totalScore: { type: Number, required: true },
    targetScore: { type: Number, required: true },
    isPrimary: { type: Boolean, default: false },
    studyPlan: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  }],
  startTime: {
    type: String, // HH:mm
  },
  endTime: {
    type: String, // HH:mm
  },
  selectedShifts: [{
    startTime: { type: String },
    endTime: { type: String },
    label: { type: String },
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },
  registeredDeviceId: {
    type: String,
    default: null,
  },
  attendance: [{
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
    },
  }],
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
}, { 
  timestamps: true 
});

// Clear Mongoose model cache in Next.js dev mode to apply schema updates
if (mongoose.models && mongoose.models.LibraryMember) {
  delete mongoose.models.LibraryMember;
}

export default mongoose.models.LibraryMember || mongoose.model('LibraryMember', StudentSchema);