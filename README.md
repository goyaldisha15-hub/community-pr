# community-pr
SevaConnect NGO Platform

## Run locally

Install dependencies once, then start the frontend and API together:

```powershell
npm install
npm run dev
```

Use Node.js 22.13 or newer. Open the frontend at <http://localhost:3000>. The
API runs at <http://127.0.0.1:5000/api>, and its SQLite database is created at
`data/community-pr.sqlite`.

New signups create participant accounts. To create the first admin, set
credentials in PowerShell and run the seed command:

```powershell
$env:ADMIN_NAME = "Project Admin"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "choose-a-strong-password"
npm run seed:admin
```

Admin accounts can create volunteer accounts in Volunteer Management. For
production, set a long random `JWT_SECRET` and configure `CLIENT_ORIGIN` to the
frontend's origin before starting the API. Local development generates and
persists a signing secret in the SQLite database automatically.
