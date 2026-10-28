import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login, logout, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true });
const r = Router();
r.post('/register', limiter,
  body('name').trim().notEmpty(), body('email').isEmail().normalizeEmail(),
  body('studentId').trim().notEmpty(), body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
  body('confirmPassword').custom((v, { req }) => v === req.body.password).withMessage('Passwords do not match'),
  register);
r.post('/login', limiter, body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty(), login);
r.post('/logout', logout);
r.get('/me', authenticate, me);
export default r;
