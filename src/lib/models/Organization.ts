import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  logo: {
    type: String,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'trial', 'expired', 'cancelled'],
    default: 'trial',
  },
  subscriptionExpiry: {
    type: Date,
  },
  settings: {
    totalSeats: {
      type: Number,
      default: 50,
    },
    feeAmount: {
      type: Number,
      default: 1000,
    },
    checkInTime: {
      type: String,
      default: '09:00',
    },
    checkOutTime: {
      type: String,
      default: '18:00',
    },
    gracePeriod: {
      type: Number,
      default: 15, // minutes
    },
    allowedWifiIps: [{
      type: String,
    }],
    location: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
      radiusMeters: { type: Number, default: 50 },
    },
  },
  isActive: {
    type: Boolean,
    default: true,
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

OrganizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  ;
});

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);