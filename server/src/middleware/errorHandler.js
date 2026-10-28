import { env } from '../config/env.js';
export const notFound = (req, _res, next) => next({ status: 404, message: `Route not found: ${req.originalUrl}` });
export function errorHandler(err, _req, res, _next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message: status === 500 && env.nodeEnv === 'production' ? 'Server error' : err.message, details: err.details });
}
