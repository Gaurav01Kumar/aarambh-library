import mongoose from 'mongoose';

const PracticeAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMember',
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    dateKey: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    examType: {
      type: String,
      required: true,
    },
    questions: [
      {
        id: String,
        question: String,
        options: [String],
        correctIndex: Number,
        explanation: String,
        topic: String,
        difficulty: String,
      },
    ],
    userAnswers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 20,
    },
    accuracyPercent: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    generatedByAI: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

PracticeAttemptSchema.index({ studentId: 1, dateKey: 1 });

if (mongoose.models && mongoose.models.PracticeAttempt) {
  delete mongoose.models.PracticeAttempt;
}

export default mongoose.models.PracticeAttempt ||
  mongoose.model('PracticeAttempt', PracticeAttemptSchema);

