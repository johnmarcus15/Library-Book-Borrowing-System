import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seedData.js';

try {
  await connectDB();
  const res = await seedDatabase();
  console.log(`\n======================================================`);
  console.log(`  ${res.message}`);
  console.log(`  Books in database: ${res.stats.totalBooks}`);
  console.log(`  Users in database: ${res.stats.totalUsers}`);
  console.log(`------------------------------------------------------`);
  console.log(`  Demo Accounts:`);
  console.log(`  Admin:  ${res.demoAccounts.admin.email}  |  ${res.demoAccounts.admin.password}`);
  console.log(`  Member: ${res.demoAccounts.member.email} |  ${res.demoAccounts.member.password}`);
  console.log(`======================================================\n`);
} catch (err) {
  console.error('Seed error:', err.message);
  process.exit(1);
} finally {
  await mongoose.disconnect();
}
