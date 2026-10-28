import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
await connectDB();
app.listen(env.port, '0.0.0.0', () => console.log(`API on http://localhost:${env.port}`));
