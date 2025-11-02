

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // 🔑 Critical: Explicitly enable TLS
      tls: true,

      // 🛡️ Required for modern MongoDB Atlas clusters
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },

      // ⏱️ Optional: Increase timeout for cold starts on Render
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

export default connectDB;