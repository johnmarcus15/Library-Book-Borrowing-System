import 'dotenv/config';

export const env = {
  port: +process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_library_system_2026_change_in_prod',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  useTransactions: process.env.USE_TRANSACTIONS === 'true',
  rules: {
    loanDays: +process.env.LOAN_DAYS || 14,
    maxActive: +process.env.MAX_ACTIVE_BORROWINGS || 5,
    finePerDay: +process.env.FINE_PER_DAY || 5,
  },
};
