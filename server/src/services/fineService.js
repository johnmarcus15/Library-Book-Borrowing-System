import { env } from '../config/env.js';
const DAY = 86400000;
// Fine stops growing at returnedAt; for unreturned books it grows until "now".
export function overdueDays(dueDate, returnedAt) {
  const end = returnedAt ? new Date(returnedAt) : new Date();
  return Math.max(0, Math.ceil((end - new Date(dueDate)) / DAY));
}
export const calculateFine = (dueDate, returnedAt) => overdueDays(dueDate, returnedAt) * env.rules.finePerDay;
