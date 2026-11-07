# SevaConnect

SevaConnect is a community event and volunteer management app. It helps organizations publish events, manage registrations, coordinate volunteers, and track attendance.

## Features

- Browse community events and view event details
- Register for events and view a personal participant dashboard
- Role-based access for admins, volunteers, and participants
- Admin tools for managing events, participants, volunteers, and reports
- Volunteer attendance check-in using a QR scanner
- SQLite database with demo events created automatically on first run

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** SQLite (`node:sqlite`)
- **Authentication:** JWT

## Requirements

- Node.js **22.9 or later** (the API uses Node's built-in `node:sqlite` and `--env-file-if-exists`)
- npm

## Getting started

From the project directory, install dependencies:

```bash
npm install
```

Start the API and frontend together:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API runs at [http://localhost:5000/api](http://localhost:5000/api); check that it is available at [http://localhost:5000/api/health](http://localhost:5000/api/health).

The SQLite database is created automatically at `data/community-pr.sqlite`. On an empty database, the app adds a few sample events.

## Create an admin account

Create a `.env` file in the project directory with the following values:

```dotenv
ADMIN_NAME=Project Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

Use a password of at least 12 characters, then run:

```bash
npm run seed:admin
```

Sign in through the app with the admin email and password. Keep `.env` private and never commit real credentials. In production, set a strong `JWT_SECRET`; the API refuses to start in production without it.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and Vite development server |
| `npm run dev:api` | Start only the API |
| `npm run dev:web` | Start only the frontend |
| `npm run build` | Build the frontend for production |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run test:api` | Run the API tests |
| `npm run seed:admin` | Create an admin account from `.env` values |

## API overview

All API routes use the `/api` prefix.

| Area | Routes | Access |
| --- | --- | --- |
| Health | `GET /health` | Public |
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Public or signed-in |
| Events | `GET /events`, `GET /events/:id` | Public |
| Event management | `POST`, `PUT`, `DELETE /events...` | Admin |
| Registrations | `POST /registrations`, `GET /registrations/mine` | Public/participant |
| Attendance | `POST /attendance/scan` | Admin or volunteer |
| Reports | `GET /reports/...` | Admin |

Protected API requests use a bearer token in the `Authorization` header.

## Project structure

```text
src/
  components/   Shared navigation, layouts, and route protection
  context/      Authentication state
  pages/        Public, participant, volunteer, and admin screens
  api/          Frontend API client
server/
  app.js        Express routes and request handling
  auth.js       Password hashing and token helpers
  db.js         SQLite schema and database setup
  seed-admin.js Admin account setup command
  app.test.js   API integration tests
data/           Local SQLite database
```
