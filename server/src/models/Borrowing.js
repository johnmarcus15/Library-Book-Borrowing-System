import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  borrowedAt: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnedAt: Date,
  status: { type: String, enum: ['BORROWED', 'RETURNED'], default: 'BORROWED' },
  fineAmount: { type: Number, default: 0, min: 0 },
  finePaid: { type: Boolean, default: false },
}, { timestamps: true });
// One active loan per member per title, enforced by the database even under races
schema.index({ user: 1, book: 1 }, { unique: true, partialFilterExpression: { status: 'BORROWED' } });
schema.index({ status: 1, dueDate: 1 });
export default mongoose.model('Borrowing', schema);
