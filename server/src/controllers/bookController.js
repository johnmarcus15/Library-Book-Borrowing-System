import { body, validationResult } from 'express-validator';
import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const FIELDS = ['title', 'author', 'isbn', 'category', 'description', 'publicationYear', 'coverImage'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined); // blocks operator objects like {$ne:..}
const pick = (b) => Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));
const check = (req) => { const e = validationResult(req); if (!e.isEmpty()) throw new ApiError(400, 'Validation failed', e.array().map((x) => ({ field: x.path, message: x.msg }))); };
const dupe = (e) => { if (e.code === 11000) throw new ApiError(409, 'ISBN already exists'); throw e; };

export const bookRules = (opt) => {
  const f = (chain) => (opt ? chain.optional() : chain);
  return [
    f(body('title').trim().notEmpty()), f(body('author').trim().notEmpty()), f(body('category').trim().notEmpty()),
    body('isbn').optional({ values: 'falsy' }).trim().isLength({ min: 10, max: 17 }),
    f(body('totalCopies').isInt({ min: 0 }).toInt()),
    body('publicationYear').optional().isInt({ min: 0, max: 3000 }).toInt(),
    body('description').optional().isLength({ max: 2000 }),
  ];
};

export const list = asyncHandler(async (req, res) => {
  const { category, available, sort = 'title' } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const filter = { isArchived: false };
  const q = str(req.query.q);
  if (q) { const rx = new RegExp(esc(q), 'i'); filter.$or = [{ title: rx }, { author: rx }, { isbn: rx }]; }
  if (str(category)) filter.category = str(category);
  if (available === 'true') filter.availableCopies = { $gt: 0 };
  if (available === 'false') filter.availableCopies = 0;
  const sortBy = sort === 'recent' ? { createdAt: -1 } : { title: 1 };
  const [data, total] = await Promise.all([
    Book.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit), Book.countDocuments(filter)]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const categories = asyncHandler(async (_req, res) =>
  res.json({ success: true, data: await Book.distinct('category', { isArchived: false }) }));
export const getOne = asyncHandler(async (req, res) => {
  const b = await Book.findById(req.params.id);
  if (!b) throw new ApiError(404, 'Book not found');
  res.json({ success: true, data: b });
});
export const create = asyncHandler(async (req, res) => {
  check(req);
  try { res.status(201).json({ success: true, data: await Book.create({ ...pick(req.body), totalCopies: req.body.totalCopies, availableCopies: req.body.totalCopies }) }); }
  catch (e) { dupe(e); }
});
export const update = asyncHandler(async (req, res) => {
  check(req);
  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Book not found');
  const set = pick(req.body), update = {}, filter = { _id: book._id };
  if (req.body.totalCopies !== undefined) {
    const delta = req.body.totalCopies - book.totalCopies;
    set.totalCopies = req.body.totalCopies; update.$inc = { availableCopies: delta };
    filter.totalCopies = book.totalCopies;
    if (delta < 0) filter.availableCopies = { $gte: -delta }; // cannot drop below copies currently on loan
  }
  if (!Object.keys(set).length) throw new ApiError(400, 'Nothing to update');
  update.$set = set;
  try {
    const out = await Book.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    if (!out) throw new ApiError(409, 'Total copies cannot be lower than copies currently borrowed (or book changed, retry)');
    res.json({ success: true, data: out });
  } catch (e) { if (e instanceof ApiError) throw e; dupe(e); }
});
export const remove = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!(await Book.exists({ _id: id }))) throw new ApiError(404, 'Book not found');
  if (await Borrowing.exists({ book: id, status: 'BORROWED' })) throw new ApiError(409, 'Book has active borrowings');
  if (await Borrowing.exists({ book: id })) { // keep history: archive instead of delete
    await Book.updateOne({ _id: id }, { isArchived: true });
    return res.json({ success: true, message: 'Book archived (borrowing history preserved)' });
  }
  await Book.deleteOne({ _id: id });
  res.json({ success: true, message: 'Book deleted' });
});
