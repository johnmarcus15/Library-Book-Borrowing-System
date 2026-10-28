// Pure unit tests: need no database.
import { jest } from '@jest/globals';
Object.assign(process.env, { MONGODB_URI: 'mongodb://unused/test', JWT_SECRET: 'x', FINE_PER_DAY: '5' });
const { calculateFine, overdueDays } = await import('../src/services/fineService.js');
const DAY = 86400000;
describe('fine calculation', () => {
  test('no fine before or on the due date', () => {
    expect(calculateFine(new Date(Date.now() + DAY))).toBe(0);
    expect(overdueDays(new Date(Date.now() + 1000))).toBe(0);
  });
  test('₹5 per started overdue day', () => {
    expect(calculateFine(new Date(Date.now() - 2.5 * DAY))).toBe(15);
    expect(calculateFine(new Date(Date.now() - 10 * DAY + 1000))).toBe(50);
  });
  test('fine stops growing at the return date', () => {
    const due = new Date(Date.now() - 10 * DAY), returned = new Date(due.getTime() + 2 * DAY);
    expect(calculateFine(due, returned)).toBe(10);
  });
  test('returned before due date costs nothing', () => {
    const due = new Date(Date.now() + 5 * DAY);
    expect(calculateFine(due, new Date())).toBe(0);
  });
});
