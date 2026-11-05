import { hashPassword } from './auth.js';
import { openDatabase } from './db.js';

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password) {
  console.error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this command.');
  process.exitCode = 1;
} else if (password.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters long.');
  process.exitCode = 1;
} else {
  const db = openDatabase();
  try {
    const hash = await hashPassword(password);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'admin', ?)
    `).run(name, email, hash, new Date().toISOString());
    console.log(`Created admin account for ${email}`);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.errcode === 2067) {
      console.error(`An account already exists for ${email}`);
      process.exitCode = 1;
    } else {
      throw error;
    }
  } finally {
    db.close();
  }
}
