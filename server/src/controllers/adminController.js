import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { borrowBook } from '../services/borrowingService.js';
import { overdueDays, calculateFine } from '../services/fineService.js';

const DAY = 86400000;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const paging = (req) => { const page = Math.max(1, parseInt(req.query.page) || 1); const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); return { page, limit, skip: (page - 1) * limit }; };
const idOk = (id) => /^[a-f\d]{24}$/i.test(id);

async function outstandingFines() {
  const now = new Date();
  const [active] = await Borrowing.aggregate([
    { $match: { status: 'BORROWED', dueDate: { $lt: now } } },
    { $group: { _id: null, t: { $sum: { $multiply: [{ $ceil: { $divide: [{ $subtract: [now, '$dueDate'] }, DAY] } }, env.rules.finePerDay] } } } }]);
  const [returned] = await Borrowing.aggregate([
    { $match: { status: 'RETURNED', finePaid: false, fineAmount: { $gt: 0 } } },
    { $group: { _id: null, t: { $sum: '$fineAmount' } } }]);
  return (active?.t || 0) + (returned?.t || 0);
}
const activity = (days = 30) => Borrowing.aggregate([
  { $match: { borrowedAt: { $gte: new Date(Date.now() - days * DAY) } } },
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$borrowedAt' } }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } }]);

export const dashboard = asyncHandler(async (_req, res) => {
  const now = new Date();
  const [titles, [copies], members, overdue, fines, byCategory, borrowActivity] = await Promise.all([
    Book.countDocuments({ isArchived: false }),
    Book.aggregate([{ $match: { isArchived: false } }, { $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }]),
    User.countDocuments({ role: 'MEMBER' }),
    Borrowing.countDocuments({ status: 'BORROWED', dueDate: { $lt: now } }),
    outstandingFines(),
    Book.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    activity(30)]);
  const total = copies?.total || 0, available = copies?.available || 0;
  res.json({ success: true, data: { totalTitles: titles, totalCopies: total, availableCopies: available, borrowedCopies: total - available, members, overdueBorrowings: overdue, outstandingFines: fines, byCategory, borrowActivity } });
});

export const users = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req);
  const filter = {}, q = str(req.query.q);
  if (q) { const rx = new RegExp(esc(q), 'i'); filter.$or = [{ name: rx }, { email: rx }, { studentId: rx }]; }
  const [data, total] = await Promise.all([User.find(filter).sort('-createdAt').skip(skip).limit(limit), User.countDocuments(filter)]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const userDetail = asyncHandler(async (req, res) => {
  if (!idOk(req.params.id)) throw new ApiError(400, 'Invalid id');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const list = await Borrowing.find({ user: user._id }).populate('book', 'title author').sort('-borrowedAt');
  res.json({ success: true, data: { user, borrowings: list.map((b) => ({ ...b.toJSON(), overdueDays: overdueDays(b.dueDate, b.returnedAt), fineAmount: b.status === 'BORROWED' ? calculateFine(b.dueDate) : b.fineAmount })) } });
});
export const statusRules = [body('isActive').isBoolean().withMessage('isActive must be boolean').toBoolean()];
export const setStatus = asyncHandler(async (req, res) => {
  if (!validationResult(req).isEmpty() || !idOk(req.params.id)) throw new ApiError(400, 'Invalid request');
  if (String(req.user._id) === req.params.id) throw new ApiError(400, 'You cannot change your own status');
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true }); // history untouched
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

export const borrowings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req);
  const filter = {}, { status, overdue } = req.query, q = str(req.query.q);
  if (['BORROWED', 'RETURNED'].includes(status)) filter.status = status;
  if (overdue === 'true') { filter.status = 'BORROWED'; filter.dueDate = { $lt: new Date() }; }
  if (q) {
    const rx = new RegExp(esc(q), 'i');
    const [us, bs] = await Promise.all([User.find({ $or: [{ name: rx }, { email: rx }, { studentId: rx }] }).select('_id'), Book.find({ $or: [{ title: rx }, { isbn: rx }] }).select('_id')]);
    filter.$or = [{ user: { $in: us.map((u) => u._id) } }, { book: { $in: bs.map((b) => b._id) } }];
  }
  const [rows, total] = await Promise.all([
    Borrowing.find(filter).populate('user', 'name email studentId').populate('book', 'title').sort('-borrowedAt').skip(skip).limit(limit),
    Borrowing.countDocuments(filter)]);
  const data = rows.map((b) => ({ ...b.toJSON(), overdueDays: overdueDays(b.dueDate, b.returnedAt), isOverdue: b.status === 'BORROWED' && b.dueDate < new Date(), fineAmount: b.status === 'BORROWED' ? calculateFine(b.dueDate) : b.fineAmount }));
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const issueRules = [body('userId').isMongoId(), body('bookId').isMongoId()];
export const issue = asyncHandler(async (req, res) => {
  if (!validationResult(req).isEmpty()) throw new ApiError(400, 'Valid userId and bookId required');
  res.status(201).json({ success: true, data: await borrowBook(String(req.body.userId), String(req.body.bookId)) });
});

export const reports = asyncHandler(async (_req, res) => {
  const now = new Date();
  const [mostBorrowed, memberActivity, overdueList, fines, act] = await Promise.all([
    Borrowing.aggregate([{ $group: { _id: '$book', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } }, { $unwind: '$book' }, { $project: { title: '$book.title', author: '$book.author', count: 1 } }]),
    Borrowing.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } }, { $unwind: '$u' }, { $project: { name: '$u.name', studentId: '$u.studentId', count: 1 } }]),
    Borrowing.find({ status: 'BORROWED', dueDate: { $lt: now } }).populate('user', 'name studentId').populate('book', 'title').sort('dueDate'),
    outstandingFines(), activity(90)]);
  res.json({ success: true, data: { mostBorrowed, memberActivity, outstandingFines: fines, borrowingActivity: act,
    overdue: overdueList.map((b) => ({ ...b.toJSON(), overdueDays: overdueDays(b.dueDate), fineAmount: calculateFine(b.dueDate) })) } });
});
