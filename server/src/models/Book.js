import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  isbn: { type: String, trim: true, unique: true, sparse: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 2000 },
  publicationYear: { type: Number, min: 0, max: 3000 },
  coverImage: String,
  totalCopies: { type: Number, required: true, min: 0 },
  availableCopies: { type: Number, required: true, min: 0 },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ title: 'text', author: 'text' });
schema.index({ category: 1, isArchived: 1 });
export default mongoose.model('Book', schema);
