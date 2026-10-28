// Sets test env BEFORE the app modules are imported (env.js reads process.env at import time).
export function testEnv() {
  const uri = process.env.MONGODB_URI_TEST;
  if (!uri || !/test/i.test(uri)) throw new Error('Set MONGODB_URI_TEST to a database whose name contains "test"');
  Object.assign(process.env, { MONGODB_URI: uri, JWT_SECRET: 'test-secret-not-for-production', NODE_ENV: 'test', USE_TRANSACTIONS: process.env.USE_TRANSACTIONS || 'false',
    MAX_ACTIVE_BORROWINGS: '2', FINE_PER_DAY: '5', LOAN_DAYS: '14', CLIENT_URL: 'http://localhost:5173' });
}
