const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

async function testPersistentMongo() {
  const dbPath = path.join(__dirname, 'local-db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath);
  }

  try {
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: dbPath,
        storageEngine: 'wiredTiger'
      }
    });
    console.log('Mongo started at', mongoServer.getUri());
    await mongoServer.stop();
    console.log('Mongo stopped successfully');
  } catch (err) {
    console.error('Error:', err);
  }
}

testPersistentMongo();
