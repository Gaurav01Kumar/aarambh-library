import mongoose from 'mongoose';

const DailyCurrentAffairsSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String, // Format: "YYYY-MM-DD"
      required: true,
    },
    examType: {
      type: String,
      required: true,
      trim: true,
    },
    editorialHighlight: {
      source: { type: String, default: '' },
      headline: { type: String, default: '' },
      summary: { type: String, default: '' },
      relevance: { type: String, default: '' },
    },
    newsBites: [
      {
        id: String,
        category: String,
        title: String,
        takeaway: String,
      },
    ],
    questions: [
      {
        id: { type: String, required: true },
        question: { type: String, required: true },
        options: [{ type: String }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
        topic: { type: String, default: 'Current Affairs' },
        difficulty: { type: String, default: 'Medium' },
      },
    ],
    generatedByAI: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

DailyCurrentAffairsSchema.index({ dateKey: 1, examType: 1 }, { unique: true });

if (mongoose.models && mongoose.models.DailyCurrentAffairs) {
  delete mongoose.models.DailyCurrentAffairs;
}

export default mongoose.models.DailyCurrentAffairs ||
  mongoose.model('DailyCurrentAffairs', DailyCurrentAffairsSchema);

