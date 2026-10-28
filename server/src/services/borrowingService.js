import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateFine } from './fineService.js';

// Runs fn inside a transaction when enabled (needs Atlas / replica set); otherwise plain.
async function run(fn) {
  if (!env.useTransactions) return fn(null);
  const session = await mongoose.startSession();
  try { let out; await session.withTransaction(async () => { out = await fn(session); }); return out; }
  finally { session.endSession(); }
}

export const borrowBook = (userId, bookId) => run(async (session) => {
  const user = await User.findById(userId).session(session);
  if (!user || !user.isActive) throw new ApiError(403, 'Account is inactive');
  const active = await Borrowing.countDocuments({ user: userId, status: 'BORROWED' }).session(session);
  if (active >= env.rules.maxActive) throw new ApiError(409, `Maximum of ${env.rules.maxActive} active borrowings reached`);
  if (await Borrowing.exists({ user: userId, book: bookId, status: 'BORROWED' }).session(session))
    throw new ApiError(409, 'You already have this book borrowed');
  // Atomic decrement: fails if no copies remain, so copies can never be over-allocated
  const book = await Book.findOneAndUpdate(
    { _id: bookId, isArchived: false, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } }, { new: true, session });
  if (!book) throw new ApiError(409, 'Book is unavailable');
  const dueDate = new Date(Date.now() + env.rules.loanDays * 86400000);
  try {
    const [b] = await Borrowing.create([{ user: userId, book: bookId, dueDate }], { session });
    return b;
  } catch (e) {
    if (!session) await Book.updateOne({ _id: bookId }, { $inc: { availableCopies: 1 } }); // compensate
    if (e.code === 11000) throw new ApiError(409, 'You already have this book borrowed');
    throw e;
  }
});

export const returnBook = (borrowingId, actor) => run(async (session) => {
  const existing = await Borrowing.findById(borrowingId).session(session);
  if (!existing) throw new ApiError(404, 'Borrowing not found');
  if (actor.role !== 'ADMIN' && String(existing.user) !== String(actor._id)) throw new ApiError(403, 'Forbidden');
  const now = new Date();
  // Status filter makes a second return a no-op -> 409
  const done = await Borrowing.findOneAndUpdate(
    { _id: borrowingId, status: 'BORROWED' },
    { status: 'RETURNED', returnedAt: now, fineAmount: calculateFine(existing.dueDate, now) },
    { new: true, session });
  if (!done) throw new ApiError(409, 'Book already returned');
  await Book.updateOne({ _id: done.book }, { $inc: { availableCopies: 1 } }, { session });
  return done;
});
