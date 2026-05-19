import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let replSet;

export async function setupTestDB() {
    // Single-node replica set: enough to enable transactions for our tests.
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri());
}

export async function teardownTestDB() {
    await mongoose.disconnect();
    if (replSet) await replSet.stop();
}

export async function clearTestDB() {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
}
