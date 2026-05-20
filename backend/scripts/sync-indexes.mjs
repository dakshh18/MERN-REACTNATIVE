// One-off index migration.
//
// Mongoose only CREATES missing indexes on startup — it never drops or
// modifies indexes that already exist. So when a schema's indexes change
// (e.g. Cart/Order moved off `clerkId` onto `user`, or User's `clerkId`
// became sparse), the old indexes linger on the live collection and cause
// duplicate-key errors.
//
// `Model.syncIndexes()` reconciles each collection's indexes with its
// current schema: it drops indexes no longer in the schema and creates the
// ones that are. Run this once after deploying a schema change:
//
//   npm run migrate:indexes        (from backend/)
//
// Safe to run repeatedly — it's idempotent.

import { ENV } from '../src/config/env.js';
import mongoose from 'mongoose';
import { User } from '../src/models/user.model.js';
import { Cart } from '../src/models/cart.model.js';
import { Order } from '../src/models/order.model.js';

async function run() {
    if (!ENV.DB_URL) throw new Error('DB_URL is not set');
    await mongoose.connect(ENV.DB_URL);
    console.log(`Connected: ${mongoose.connection.host}`);

    for (const Model of [User, Cart, Order]) {
        const before = (await Model.collection.indexes()).map((i) => i.name);
        // syncIndexes drops indexes not in the schema, creates missing ones.
        await Model.syncIndexes();
        const after = (await Model.collection.indexes()).map((i) => i.name);
        console.log(`\n${Model.modelName}`);
        console.log(`  before: ${before.join(', ')}`);
        console.log(`  after:  ${after.join(', ')}`);
    }

    await mongoose.disconnect();
    console.log('\nIndex sync complete.');
}

run().catch((err) => {
    console.error('Index sync failed:', err);
    process.exit(1);
});
