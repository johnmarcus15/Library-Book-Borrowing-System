import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  studentId: { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['MEMBER', 'ADMIN'], default: 'MEMBER' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
schema.set('toJSON', { transform: (_d, r) => { delete r.passwordHash; delete r.__v; return r; } });
export default mongoose.model('User', schema);
