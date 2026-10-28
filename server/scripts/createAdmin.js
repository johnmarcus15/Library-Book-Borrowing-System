import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_STUDENT_ID } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) { console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars) in .env'); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI);
const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
if (existing) {
  existing.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  if (ADMIN_NAME) existing.name = ADMIN_NAME;
  if (ADMIN_STUDENT_ID) existing.studentId = ADMIN_STUDENT_ID;
  existing.role = 'ADMIN';
  existing.isActive = true;
  await existing.save();
  console.log('Admin updated');
} else {
  await User.create({ name: ADMIN_NAME || 'Librarian', email: ADMIN_EMAIL, studentId: ADMIN_STUDENT_ID || undefined, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'ADMIN' });
  console.log('Admin created');
}
await mongoose.disconnect();
