import mongoose from 'mongoose';

const StudyChatMessageSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'English',
    },
  },
  { timestamps: true }
);

StudyChatMessageSchema.index({ studentId: 1, createdAt: 1 });

if (mongoose.models && mongoose.models.StudyChatMessage) {
  delete mongoose.models.StudyChatMessage;
}

export default mongoose.models.StudyChatMessage ||
  mongoose.model('StudyChatMessage', StudyChatMessageSchema);

