import mongoose from 'mongoose';
import { env } from './env.js';

let cachedPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const uri = env.mongoUri || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not configured. Please set MONGODB_URI in environment variables.');
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    };

    cachedPromise = mongoose.connect(uri, opts)
      .then((instance) => {
        console.log('MongoDB connected successfully');
        return instance;
      })
      .catch((err) => {
        cachedPromise = null;
        console.error('MongoDB connection failed:', err.message);
        throw err;
      });
  }

  return cachedPromise;
}

