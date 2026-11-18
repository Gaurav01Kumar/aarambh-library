import mongoose from 'mongoose';

const AppFeedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMember',
      required: true,
      unique: true, // Strictly one-time feedback per student
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    studentName: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    category: {
      type: String,
      default: 'Overall Experience',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.AppFeedback) {
  delete mongoose.models.AppFeedback;
}

export default mongoose.models.AppFeedback ||
  mongoose.model('AppFeedback', AppFeedbackSchema);

