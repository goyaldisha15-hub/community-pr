import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { createToken, hashPassword, verifyPassword, verifyToken } from './auth.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const eventFields = ['title', 'description', 'date', 'location', 'category'];

export function createApp(db, secret) {
  const app = express();
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }));
  app.use(express.json({ limit: '100kb' }));

  const users = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?');

  function authenticate(req, res, next) {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ message: 'Authentication required' });
    try {
      const claims = verifyToken(match[1], secret);
      const user = users.get(claims.sub);
      if (!user || user.role !== claims.role) {
        return res.status(401).json({ message: 'Invalid authentication token' });
      }
      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired authentication token' });
    }
  }

  function allowRoles(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'You do not have permission to perform this action' });
      }
      return next();
    };
  }

  function optionalAuthentication(req, res, next) {
    if (!req.get('authorization')) return next();
    return authenticate(req, res, next);
  }

  function eventById(id) {
    return db.prepare(`
      SELECT e.*, COUNT(r.id) AS registered_count
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      WHERE e.id = ?
      GROUP BY e.id
    `).get(id);
  }

  function registrationRows(where = '', params = []) {
    return db.prepare(`
      SELECT r.*, e.title AS event_title, e.date AS event_date,
        e.location AS event_location, e.category AS event_category,
        a.check_in_time, u.name AS volunteer_name
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      LEFT JOIN attendance a ON a.registration_id = r.id
      LEFT JOIN users u ON u.id = a.scanned_by
      ${where}
      ORDER BY r.created_at DESC
    `).all(...params).map(registrationJson);
  }

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/auth/register', async (req, res, next) => {
    try {
      const name = cleanString(req.body?.name);
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      if (!name || name.length > 120 || !emailPattern.test(email) || email.length > 254) {
        return res.status(400).json({ message: 'Enter a valid name and email address' });
      }
      if (typeof password !== 'string' || password.length < 6 || password.length > 256) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      const passwordHash = await hashPassword(password);
      const result = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, 'participant', ?)
      `).run(name, email, passwordHash, new Date().toISOString());
      const user = users.get(Number(result.lastInsertRowid));
      return res.status(201).json({ user, token: createToken(user, secret) });
    } catch (error) {
      if (isUniqueConstraint(error)) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      return next(error);
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      const account = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!account || typeof password !== 'string' || !(await verifyPassword(password, account.password_hash))) {
        return res.status(401).json({ message: 'Email or password is incorrect' });
      }
      const user = users.get(account.id);
      return res.json({ user, token: createToken(user, secret) });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }));

  app.get('/api/auth/volunteers', authenticate, allowRoles('admin'), (_req, res) => {
    const volunteers = db.prepare(`
      SELECT id, name, email FROM users WHERE role = 'volunteer' ORDER BY name
    `).all();
    return res.json(volunteers);
  });

  app.post('/api/auth/volunteers', authenticate, allowRoles('admin'), async (req, res, next) => {
    try {
      const name = cleanString(req.body?.name);
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      if (!name || name.length > 120 || !emailPattern.test(email) || email.length > 254) {
        return res.status(400).json({ message: 'Enter a valid name and email address' });
      }
      if (typeof password !== 'string' || password.length < 6 || password.length > 256) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      const passwordHash = await hashPassword(password);
      const result = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, 'volunteer', ?)
      `).run(name, email, passwordHash, new Date().toISOString());
      return res.status(201).json(users.get(Number(result.lastInsertRowid)));
    } catch (error) {
      if (isUniqueConstraint(error)) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      return next(error);
    }
  });

  app.get('/api/events', (_req, res) => {
    const events = db.prepare(`
      SELECT e.*, COUNT(r.id) AS registered_count
      FROM events e LEFT JOIN registrations r ON r.event_id = e.id
      GROUP BY e.id ORDER BY e.date
    `).all();
    return res.json(events);
  });

  app.get('/api/events/:id', (req, res) => {
    const event = eventById(toPositiveInteger(req.params.id));
    if (!event) return res.status(404).json({ message: 'Event not found' });
    return res.json(event);
  });

  app.post('/api/events', authenticate, allowRoles('admin'), (req, res, next) => {
    try {
      const event = validateEvent(req.body);
      if (event.error) return res.status(400).json({ message: event.error });
      const result = db.prepare(`
        INSERT INTO events (title, description, date, location, category, image_url, total_slots, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ...event.values,
        new Date().toISOString(),
      );
      return res.status(201).json(eventById(Number(result.lastInsertRowid)));
    } catch (error) {
      return next(error);
    }
  });

  app.put('/api/events/:id', authenticate, allowRoles('admin'), (req, res, next) => {
    try {
      const id = toPositiveInteger(req.params.id);
      if (!id || !eventById(id)) return res.status(404).json({ message: 'Event not found' });
      const event = validateEvent(req.body);
      if (event.error) return res.status(400).json({ message: event.error });
      const registered = db.prepare('SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?').get(id).count;
      if (event.values[6] < registered) {
        return res.status(400).json({ message: 'Total slots cannot be less than the number of existing registrations' });
      }
      db.prepare(`
        UPDATE events SET title = ?, description = ?, date = ?, location = ?, category = ?, image_url = ?, total_slots = ?
        WHERE id = ?
      `).run(...event.values, id);
      return res.json(eventById(id));
    } catch (error) {
      return next(error);
    }
  });

  app.delete('/api/events/:id', authenticate, allowRoles('admin'), (req, res) => {
    const id = toPositiveInteger(req.params.id);
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(id || -1);
    if (!result.changes) return res.status(404).json({ message: 'Event not found' });
    return res.status(204).end();
  });

  app.post('/api/registrations', optionalAuthentication, (req, res, next) => {
    try {
      const name = cleanString(req.body?.name);
      const email = normalizeEmail(req.body?.email);
      const phone = cleanString(req.body?.phone);
      const eventId = toPositiveInteger(req.body?.event_id);
      if (!name || name.length > 120 || !emailPattern.test(email) || email.length > 254 || !phone || phone.length > 40 || !eventId) {
        return res.status(400).json({ message: 'Enter a valid name, email, phone number, and event' });
      }
      const event = eventById(eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      if (event.registered_count >= event.total_slots) {
        return res.status(409).json({ message: 'This event is full' });
      }
      const token = randomUUID();
      const result = db.prepare(`
        INSERT INTO registrations (token, event_id, user_id, name, email, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        token,
        eventId,
        req.user?.id ?? null,
        name,
        email,
        phone,
        new Date().toISOString(),
      );
      const registration = registrationRows('WHERE r.id = ?', [Number(result.lastInsertRowid)])[0];
      return res.status(201).json(registration);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ message: 'This email is already registered for the event' });
      }
      return next(error);
    }
  });

  app.get('/api/registrations/mine', authenticate, allowRoles('participant'), (req, res) => {
    return res.json(registrationRows('WHERE r.user_id = ? OR r.email = ?', [req.user.id, req.user.email]));
  });

  app.get('/api/registrations/event/:eventId', authenticate, allowRoles('admin', 'volunteer'), (req, res) => {
    const eventId = toPositiveInteger(req.params.eventId);
    if (!eventById(eventId)) return res.status(404).json({ message: 'Event not found' });
    return res.json(registrationRows('WHERE r.event_id = ?', [eventId]));
  });

  app.get('/api/registrations', authenticate, allowRoles('admin'), (_req, res) => {
    return res.json(registrationRows());
  });

  app.delete('/api/registrations/:id', authenticate, allowRoles('admin'), (req, res) => {
    const id = toPositiveInteger(req.params.id);
    const result = db.prepare('DELETE FROM registrations WHERE id = ?').run(id || -1);
    if (!result.changes) return res.status(404).json({ message: 'Registration not found' });
    return res.status(204).end();
  });

  app.post('/api/attendance/scan', authenticate, allowRoles('admin', 'volunteer'), (req, res, next) => {
    try {
      const token = cleanString(req.body?.token);
      const eventId = toPositiveInteger(req.body?.event_id);
      if (!token || !eventId) return res.status(400).json({ message: 'A QR token and event are required' });
      const registration = registrationRows('WHERE r.token = ? AND r.event_id = ?', [token, eventId])[0];
      if (!registration) return res.status(404).json({ message: 'Invalid QR code for this event' });
      if (registration.checked_in) {
        return res.status(409).json({
          message: 'Participant has already checked in',
          participant: { name: registration.name, email: registration.email, phone: registration.phone },
          event: registration.event,
          check_in_time: registration.check_in_time,
        });
      }
      const checkInTime = new Date().toISOString();
      db.prepare(`
        INSERT INTO attendance (registration_id, event_id, scanned_by, check_in_time)
        VALUES (?, ?, ?, ?)
      `).run(registration.id, eventId, req.user.id, checkInTime);
      return res.json({
        participant: { name: registration.name, email: registration.email, phone: registration.phone },
        event: registration.event,
        check_in_time: checkInTime,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/attendance', authenticate, allowRoles('admin'), (_req, res) => {
    const records = db.prepare(`
      SELECT a.id, r.name AS participant_name, r.name, r.email, r.phone,
        e.title AS event_title, a.check_in_time, u.name AS scanned_by, u.name AS volunteer_name
      FROM attendance a
      JOIN registrations r ON r.id = a.registration_id
      JOIN events e ON e.id = a.event_id
      JOIN users u ON u.id = a.scanned_by
      ORDER BY a.check_in_time DESC
    `).all();
    return res.json(records);
  });

  app.get('/api/reports/summary', authenticate, allowRoles('admin'), (_req, res) => {
    const totalEvents = db.prepare('SELECT COUNT(*) AS count FROM events').get().count;
    const totalRegistrations = db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count;
    const totalAttendance = db.prepare('SELECT COUNT(*) AS count FROM attendance').get().count;
    return res.json({
      total_events: totalEvents,
      total_registrations: totalRegistrations,
      total_attendance: totalAttendance,
      attendance_percentage: totalRegistrations ? Math.round((totalAttendance / totalRegistrations) * 100) : 0,
    });
  });

  app.get('/api/reports/daily', authenticate, allowRoles('admin'), (_req, res) => {
    const rows = db.prepare(`
      SELECT date(created_at) AS date, COUNT(*) AS registrations
      FROM registrations
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at) ORDER BY date
    `).all();
    return res.json(rows);
  });

  app.get('/api/reports/events', authenticate, allowRoles('admin'), (_req, res) => {
    return res.json(db.prepare(`
      SELECT e.id, e.title, COUNT(r.id) AS registrations
      FROM events e LEFT JOIN registrations r ON r.event_id = e.id
      GROUP BY e.id ORDER BY registrations DESC, e.date
    `).all());
  });

  app.get('/api/reports/export/:type', authenticate, allowRoles('admin'), (req, res) => {
    const columns = {
      registrations: ['Name', 'Email', 'Phone', 'Event', 'Registered At'],
      attendance: ['Name', 'Email', 'Phone', 'Event', 'Checked In At', 'Scanned By'],
      events: ['Event', 'Registrations'],
    };
    const type = req.params.type;
    if (!columns[type]) return res.status(400).json({ message: 'Unsupported report type' });
    let rows;
    if (type === 'registrations') {
      rows = registrationRows().map(r => [r.name, r.email, r.phone, r.event_title, r.created_at]);
    } else if (type === 'attendance') {
      rows = db.prepare(`
        SELECT r.name, r.email, r.phone, e.title AS event_title, a.check_in_time, u.name AS scanned_by
        FROM attendance a JOIN registrations r ON r.id = a.registration_id
        JOIN events e ON e.id = a.event_id JOIN users u ON u.id = a.scanned_by
        ORDER BY a.check_in_time DESC
      `).all().map(r => [r.name, r.email, r.phone, r.event_title, r.check_in_time, r.scanned_by]);
    } else {
      rows = db.prepare(`
        SELECT e.title, COUNT(r.id) AS registrations
        FROM events e LEFT JOIN registrations r ON r.event_id = e.id
        GROUP BY e.id ORDER BY e.date
      `).all().map(r => [r.title, r.registrations]);
    }
    const csv = [columns[type], ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    res.type('text/csv');
    res.set('Content-Disposition', `attachment; filename="${type}_report.csv"`);
    return res.send(csv);
  });

  app.use((_req, res) => res.status(404).json({ message: 'API route not found' }));
  app.use((error, _req, res, _next) => {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}

function validateEvent(body) {
  const values = eventFields.map(field => cleanString(body?.[field]));
  if (values.some(value => !value) || values.some(value => value.length > 2000)) {
    return { error: 'Complete all required event fields' };
  }
  const date = new Date(values[2]);
  if (!Number.isFinite(date.getTime())) return { error: 'Enter a valid event date and time' };
  const slots = Number(body?.total_slots);
  if (!Number.isInteger(slots) || slots < 1 || slots > 100000) {
    return { error: 'Total slots must be a positive whole number' };
  }
  return {
    values: [
      values[0],
      values[1],
      date.toISOString(),
      values[3],
      values[4],
      cleanString(body?.image_url).slice(0, 2048),
      slots,
    ],
  };
}

function registrationJson(row) {
  const event = {
    id: row.event_id,
    title: row.event_title,
    date: row.event_date,
    location: row.event_location,
    category: row.event_category,
  };
  return {
    id: row.id,
    token: row.token,
    event_id: row.event_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    created_at: row.created_at,
    checked_in: Boolean(row.check_in_time),
    attendance_status: row.check_in_time ? 'present' : 'pending',
    check_in_time: row.check_in_time,
    scanned_by: row.volunteer_name,
    volunteer_name: row.volunteer_name,
    event,
    event_title: row.event_title,
    event_date: row.event_date,
    event_location: row.event_location,
  };
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function isUniqueConstraint(error) {
  return error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.errcode === 2067;
}
