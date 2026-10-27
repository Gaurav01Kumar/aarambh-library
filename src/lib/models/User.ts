import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
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
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'student'],
    default: 'student',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryMember',
    default: null,
  },
  phone: {
    type: String,
  },
  avatar: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  permissions: [{
    type: String,
  }],
  lastLogin: {
    type: Date,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
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

// updatedAt is handled by mongoose timestamps: true if added to schema options

export default mongoose.models.User || mongoose.model('User', UserSchema);