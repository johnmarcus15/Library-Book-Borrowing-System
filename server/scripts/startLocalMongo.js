import { MongoMemoryServer } from 'mongodb-memory-server';

console.log('Starting local MongoDB server on port 27017...');
try {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'library',
    },
  });

  console.log(`\n======================================================`);
  console.log(`  Local MongoDB is RUNNING at: mongodb://127.0.0.1:27017/library`);
  console.log(`  Test database available at:  mongodb://127.0.0.1:27017/library_test`);
  console.log(`======================================================`);
  console.log('Keep this terminal open while developing or testing.');
  console.log('Press Ctrl+C to stop.\n');

  const cleanup = async () => {
    console.log('\nShutting down local MongoDB server...');
    await mongod.stop();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
} catch (err) {
  console.error('Failed to start local MongoDB:', err.message);
  process.exit(1);
}
