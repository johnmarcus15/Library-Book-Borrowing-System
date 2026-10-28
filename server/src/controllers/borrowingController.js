import { body, validationResult } from 'express-validator';
import Borrowing from '../models/Borrowing.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { borrowBook, returnBook } from '../services/borrowingService.js';
import { calculateFine, overdueDays } from '../services/fineService.js';

const withFine = (b) => {
  const o = b.toJSON();
  o.overdueDays = overdueDays(b.dueDate, b.returnedAt);
  o.isOverdue = b.status === 'BORROWED' && o.overdueDays > 0;
  if (b.status === 'BORROWED') o.fineAmount = calculateFine(b.dueDate);
  return o;
};
export const borrowValidators = [body('bookId').isMongoId().withMessage('Valid bookId required')];
export const create = asyncHandler(async (req, res) => {
  if (!validationResult(req).isEmpty()) throw new ApiError(400, 'Valid bookId required');
  // user comes from the session, never from the body
  res.status(201).json({ success: true, data: await borrowBook(req.user._id, String(req.body.bookId)) });
});
export const mine = asyncHandler(async (req, res) => {
  const list = await Borrowing.find({ user: req.user._id }).populate('book', 'title author isbn').sort('-borrowedAt');
  res.json({ success: true, data: list.map(withFine) });
});
export const getOne = asyncHandler(async (req, res) => {
  const b = await Borrowing.findById(req.params.id).populate('book', 'title author isbn');
  if (!b || (req.user.role !== 'ADMIN' && String(b.user) !== String(req.user._id))) throw new ApiError(404, 'Borrowing not found');
  res.json({ success: true, data: withFine(b) });
});
export const giveBack = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await returnBook(req.params.id, req.user) });
});
