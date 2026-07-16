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
  currentStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryMember', 
  }],
  type: {
    type: String,
    enum: ['regular', 'premium', 'vip'],
    default: 'regular',
  },
  genderCategory: {
    type: String,
    enum: ['any', 'boys', 'girls'],
    default: 'any',
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

// Force reload model in dev to catch schema changes
if (mongoose.models.Seat) {
  delete mongoose.models.Seat;
}

export default mongoose.model('Seat', SeatSchema);