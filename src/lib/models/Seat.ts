import mongoose from 'mongoose';

const SeatSchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: true,
    unique: true,
  },
  isOccupied: {
    type: Boolean,
    default: false,
  },
  currentStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryMember', // Updated to match fresh model name
  },
  type: {
    type: String,
    enum: ['regular', 'premium', 'vip'],
    default: 'regular',
  },
  isAC: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
  },
  features: [{
    type: String,
  }],
  floor: {
    type: String,
  },
  section: {
    type: String,
  },
  session: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Full Day'],
  },
  includeFees: {
    type: Boolean,
    default: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  maintenanceStatus: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
  },
}, { 
  timestamps: true 
});

export default mongoose.models.Seat || mongoose.model('Seat', SeatSchema);