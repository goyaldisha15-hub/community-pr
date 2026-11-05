import { createServer } from 'node:http';
import { getOrCreateSigningSecret, openDatabase } from './db.js';
import { createApp } from './app.js';

const db = openDatabase();
const secret = getOrCreateSigningSecret(db);
const port = Number(process.env.API_PORT || 5000);
const server = createServer(createApp(db, secret));

server.listen(port, '127.0.0.1', () => {
  console.log(`SevaConnect API listening at http://localhost:${port}/api`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
