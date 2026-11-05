import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from './app.js';
import { hashPassword } from './auth.js';
import { openDatabase } from './db.js';

test('API supports accounts, events, registrations, attendance, and reports', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'community-pr-api-'));
  const db = openDatabase(path.join(directory, 'test.sqlite'));
  const server = createServer(createApp(db, 'test-signing-secret'));

  try {
    const adminHash = await hashPassword('AdminTestPass123!');
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'admin', ?)
    `).run('Test Admin', 'admin@example.test', adminHash, new Date().toISOString());

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}/api`;
    const request = async (method, endpoint, body, token) => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const contentType = response.headers.get('content-type') || '';
      return {
        response,
        data: contentType.includes('application/json') ? await response.json() : await response.text(),
      };
    };

    const health = await request('GET', '/health');
    assert.equal(health.response.status, 200);

    const initialEvents = await request('GET', '/events');
    assert.equal(initialEvents.response.status, 200);
    assert.ok(initialEvents.data.length >= 1);
    const publicEventId = initialEvents.data[0].id;

    const signup = await request('POST', '/auth/register', {
      name: 'Test Participant',
      email: 'person@example.test',
      password: 'participant-password',
    });
    assert.equal(signup.response.status, 201);
    assert.equal(signup.data.user.role, 'participant');
    assert.ok(signup.data.token);

    const duplicateSignup = await request('POST', '/auth/register', {
      name: 'Another Person',
      email: 'PERSON@example.test',
      password: 'participant-password',
    });
    assert.equal(duplicateSignup.response.status, 409);

    const me = await request('GET', '/auth/me', undefined, signup.data.token);
    assert.equal(me.data.user.email, 'person@example.test');
    const login = await request('POST', '/auth/login', {
      email: 'person@example.test',
      password: 'participant-password',
    });
    assert.equal(login.response.status, 200);

    const registration = await request('POST', '/registrations', {
      name: 'Test Participant',
      email: 'person@example.test',
      phone: '555-0100',
      event_id: publicEventId,
    }, signup.data.token);
    assert.equal(registration.response.status, 201);
    assert.equal(registration.data.event.id, publicEventId);
    assert.ok(registration.data.token);

    const mine = await request('GET', '/registrations/mine', undefined, signup.data.token);
    assert.equal(mine.response.status, 200);
    assert.equal(mine.data.length, 1);

    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@example.test',
      password: 'AdminTestPass123!',
    });
    assert.equal(adminLogin.response.status, 200);
    const adminToken = adminLogin.data.token;

    const forbiddenCreateEvent = await request('POST', '/events', {
      title: 'Forbidden Event',
    }, signup.data.token);
    assert.equal(forbiddenCreateEvent.response.status, 403);

    const event = await request('POST', '/events', {
      title: 'Single Slot Event',
      description: 'A capacity limit test event.',
      date: new Date(Date.now() + 86400000).toISOString(),
      location: 'Test Hall',
      category: 'Community',
      total_slots: 1,
    }, adminToken);
    assert.equal(event.response.status, 201);
    assert.equal(event.data.registered_count, 0);

    const firstCapacityRegistration = await request('POST', '/registrations', {
      name: 'First Guest',
      email: 'first@example.test',
      phone: '555-0101',
      event_id: event.data.id,
    });
    assert.equal(firstCapacityRegistration.response.status, 201);

    const fullRegistration = await request('POST', '/registrations', {
      name: 'Second Guest',
      email: 'second@example.test',
      phone: '555-0102',
      event_id: event.data.id,
    });
    assert.equal(fullRegistration.response.status, 409);

    const volunteer = await request('POST', '/auth/volunteers', {
      name: 'Test Volunteer',
      email: 'volunteer@example.test',
      password: 'volunteer-password',
    }, adminToken);
    assert.equal(volunteer.response.status, 201);
    assert.equal(volunteer.data.name, 'Test Volunteer');
    const volunteerLogin = await request('POST', '/auth/login', {
      email: 'volunteer@example.test',
      password: 'volunteer-password',
    });
    assert.equal(volunteerLogin.response.status, 200);
    assert.equal(volunteerLogin.data.user.role, 'volunteer');

    const eventRegistrations = await request(
      'GET',
      `/registrations/event/${publicEventId}`,
      undefined,
      volunteerLogin.data.token,
    );
    assert.equal(eventRegistrations.response.status, 200);
    assert.equal(eventRegistrations.data.length, 1);

    const scan = await request('POST', '/attendance/scan', {
      token: registration.data.token,
      event_id: publicEventId,
    }, volunteerLogin.data.token);
    assert.equal(scan.response.status, 200);
    assert.equal(scan.data.participant.email, 'person@example.test');

    const repeatScan = await request('POST', '/attendance/scan', {
      token: registration.data.token,
      event_id: publicEventId,
    }, volunteerLogin.data.token);
    assert.equal(repeatScan.response.status, 409);
    assert.match(repeatScan.data.message, /already checked in/i);

    const attendance = await request('GET', '/attendance', undefined, adminToken);
    assert.equal(attendance.response.status, 200);
    assert.equal(attendance.data.length, 1);

    const summary = await request('GET', '/reports/summary', undefined, adminToken);
    assert.equal(summary.response.status, 200);
    assert.equal(summary.data.total_attendance, 1);
    assert.equal(summary.data.attendance_percentage, 50);

    const exportReport = await request('GET', '/reports/export/attendance', undefined, adminToken);
    assert.equal(exportReport.response.status, 200);
    assert.match(exportReport.data, /Test Participant/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
