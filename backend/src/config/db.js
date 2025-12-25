import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async () => {
    try {
       const connection =  await mongoose.connect(ENV.DB_URL);
       console.log(`MongoDB connected: ${connection.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
}