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
  startTime: {
    type: String, // HH:mm
  },
  endTime: {
    type: String, // HH:mm
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
}, { 
  timestamps: true 
});

// Final rename to bypass cache one last time
export default mongoose.models.LibraryMember || mongoose.model('LibraryMember', StudentSchema);