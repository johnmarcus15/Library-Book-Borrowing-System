import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const isProduction = env.nodeEnv === 'production';
export const getCookieOpts = () => ({
  httpOnly: true,
  sameSite: isProduction ? (process.env.COOKIE_SAME_SITE || 'lax') : 'lax',
  secure: isProduction,
  maxAge: 7 * 86400000,
});
const check = (req) => { const e = validationResult(req); if (!e.isEmpty()) throw new ApiError(400, 'Validation failed', e.array().map(x => ({ field: x.path, message: x.msg }))); };

export const register = asyncHandler(async (req, res) => {
  check(req);
  const { name, email, studentId, password } = req.body;
  try {
    // role is never read from the request body
    const user = await User.create({ name, email, studentId, passwordHash: await bcrypt.hash(password, 12), role: 'MEMBER' });
    res.status(201).json({ success: true, data: user });
  } catch (e) {
    if (e.code === 11000) throw new ApiError(409, 'Email or register number already registered');
    throw e;
  }
});

export const login = asyncHandler(async (req, res) => {
  check(req);
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  const ok = user && await bcrypt.compare(req.body.password, user.passwordHash);
  if (!ok || !user.isActive) throw new ApiError(401, 'Invalid email or password');
  const token = jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie('token', token, getCookieOpts()).json({ success: true, data: user });
});

export const logout = (_req, res) => res.clearCookie('token', getCookieOpts()).json({ success: true });
export const me = (req, res) => res.json({ success: true, data: req.user });
