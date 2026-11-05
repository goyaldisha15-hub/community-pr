import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const demoEvents = [
  {
    title: 'Community Food Drive',
    description: 'Help collect, sort, and distribute essential groceries to local families.',
    daysFromNow: 7,
    location: 'Community Centre',
    category: 'Community',
    totalSlots: 40,
  },
  {
    title: 'Neighborhood Clean-Up',
    description: 'Join neighbors for a morning of park and streetside clean-up.',
    daysFromNow: 14,
    location: 'Riverside Park',
    category: 'Environment',
    totalSlots: 30,
  },
  {
    title: 'After-School Learning Day',
    description: 'Support local students with reading, homework, and creative activities.',
    daysFromNow: 21,
    location: 'Sunrise Learning Centre',
    category: 'Education',
    totalSlots: 25,
  },
];

export function openDatabase(
  filename = process.env.SQLITE_PATH || path.resolve('data/community-pr.sqlite'),
) {
  mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'volunteer', 'participant')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      total_slots INTEGER NOT NULL CHECK (total_slots > 0),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE,
      phone TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (event_id, email)
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY,
      registration_id INTEGER NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      scanned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      check_in_time TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS registrations_user_id_idx ON registrations(user_id);
    CREATE INDEX IF NOT EXISTS registrations_event_id_idx ON registrations(event_id);
    CREATE INDEX IF NOT EXISTS attendance_event_id_idx ON attendance(event_id);
  `);

  if (!db.prepare('SELECT 1 FROM events LIMIT 1').get()) {
    const insert = db.prepare(`
      INSERT INTO events (title, description, date, location, category, total_slots, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    for (const event of demoEvents) {
      const date = new Date(Date.now() + event.daysFromNow * 24 * 60 * 60 * 1000).toISOString();
      insert.run(event.title, event.description, date, event.location, event.category, event.totalSlots, now);
    }
  }

  return db;
}

export function getOrCreateSigningSecret(db) {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production.');
  }
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  let secret = db.prepare("SELECT value FROM settings WHERE key = 'jwt_secret'").get()?.value;
  if (!secret) {
    secret = crypto.randomUUID() + crypto.randomUUID();
    db.prepare("INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)").run(secret);
  }
  return secret;
}
