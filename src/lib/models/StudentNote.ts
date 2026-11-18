import mongoose from 'mongoose';

const StudentNoteSchema = new mongoose.Schema(
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
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      default: 'General',
      trim: true,
    },
    examTag: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.StudentNote) {
  delete mongoose.models.StudentNote;
}

export default mongoose.models.StudentNote ||
  mongoose.model('StudentNote', StudentNoteSchema);

