import { z } from 'zod';
import mongoose from 'mongoose';

// Reusable: a string that must be a valid Mongo ObjectId.
export const objectIdString = z
    .string()
    .refine((v) => mongoose.Types.ObjectId.isValid(v), {
        message: 'Invalid ObjectId',
    });
