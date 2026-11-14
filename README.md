# LeadFlow made by Michael Uzoma

A portfolio demo of a lead capture and follow-up workspace for small businesses and real estate teams. Response drafts use deterministic text templates, follow-ups are simulated reminders, and no email or SMS is sent. The public demo asks visitors to use fictional contact details and isolates each visitor's submitted leads to an HttpOnly browser workspace cookie.

## Run locally

Requirements: Node.js 24.22.1 (pinned in `.node-version`) and npm. SQLite is stored in `data/leads.db` locally and created automatically on first run.

```bash
npm install
npm run dev
```

Run these commands from the project folder (the folder containing `package.json`).

Open [http://localhost:5173](http://localhost:5173). The Vite development server proxies relative `/api` requests to Express on port `3001`. Press `Ctrl+C` to stop both servers.

For a production-style local preview:

```bash
npm run build
npm start
```

The built front end and API are served together on port `3001` by default. Set `PORT` to use another port. `npm start` serves the frontend after `npm run build`; `npm run dev` is the combined hot-reload workflow.

## Public demo deployment (Render)

The repository includes [`render.yaml`](render.yaml) for one Render Node web service that serves the Vite build and Express API from the same origin. It mounts a persistent disk at `/var/data` and stores SQLite at `/var/data/leads.db`. Render's free web services have ephemeral filesystems and cannot attach a persistent disk, so they are not suitable for this SQLite deployment.

### Deployment steps

1. Create an empty GitHub repository and push the contents of this project folder to its root. Do not commit `node_modules`, `dist`, `data/`, or `.env` files; `.gitignore` excludes them.
2. Create or sign in to a Render account, choose **New → Blueprint**, connect the GitHub repository, and review the `render.yaml` resources.
3. Applying the Blueprint creates a paid `0.5c-512mb` web service and a 1 GB persistent disk. This publishes the app at a public `onrender.com` URL and starts billing. Wait for the service health check at `/api/health` to pass.
4. Test the public capture form with fictional details, confirm the lead appears in that browser's dashboard, refresh to confirm persistence, and test reset. Keep real contact information out of this portfolio demo.

### Cost estimate

Render's currently listed smallest always-on web service is **$7/month**. Persistent disks are **$0.25 per GB per month**; this Blueprint's 1 GB disk adds **$0.25/month**, for an estimated baseline of **$7.25/month** before bandwidth, taxes, or any plan changes. Render bills compute prorated by runtime. Verify the current pricing in Render before applying the Blueprint. The free web tier cannot be used with persistent SQLite storage.

The disk-backed SQLite service is intentionally a single instance. Render persistent disks are attached to one service instance and prevent horizontal scaling and zero-downtime deploys. That is appropriate for a small portfolio demo, not a production CRM.

### Runtime configuration

| Variable | Local default | Render value | Purpose |
| --- | --- | --- | --- |
| `PORT` | `3001` | Set by Render | HTTP listener port |
| `DATABASE_PATH` | `data/leads.db` | `/var/data/leads.db` | Persistent SQLite file path |
| `TRUST_PROXY` | `false` | `true` | Trust the single Render proxy for client IP and HTTPS detection |
| `NODE_ENV` | unset | `production` | Production runtime mode |

No API secrets are required. The API is same-origin with the frontend; CORS is not enabled. Express applies per-IP rate limits, validates submission fields server-side, limits JSON bodies, sets an HttpOnly/SameSite workspace cookie, and only returns sample leads plus the current browser workspace's submissions. Reset deletes only that browser workspace's submissions and restores the fictional sample rows. Rate limits are in-memory and reset when the single service restarts.

## Features

- Responsive SaaS dashboard with sidebar navigation, lead metrics, status filters, search, and lead detail drawer.
- Public inquiry form with name, email, optional phone, service interest, message, accessible labels, inline validation, loading, success, and error states.
- Express API with server-side validation and persistent SQLite storage.
- Deterministic personalized response drafts based on the lead's name and selected service. This is template-based automation, not a live AI integration.
- Activity log for lead creation, draft preparation, simulated reminder scheduling, and status changes. No outbound email or SMS is sent.
- Fictional sample leads on first run and a reset action that restores the original sample dataset.
- Lead status updates, copyable draft, filterable directory, and empty-state handling.

## Architecture

```text
React + Vite (src/)
       │ /api proxy during development
       ▼
Express (server/app.js)
       │
       ├── server/validation.js  Server-side lead validation
       ├── server/templates.js   Deterministic response template
       └── server/db.js          Built-in SQLite schema, seed data, and activity log
```

The API creates the lead, response draft, and three initial activity entries in one SQLite transaction. Sample rows are marked with `is_sample` and labeled in the dashboard. Public submissions are associated with a random HttpOnly workspace cookie; API list, detail, status, and reset operations are scoped to that workspace. Seeded sample rows are fictional and shared. The SQLite database is excluded from version control.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Local API health check |
| `GET` | `/api/leads` | List leads; optional `status` and `search` query parameters |
| `GET` | `/api/leads/:id` | Retrieve one lead and activity history |
| `POST` | `/api/leads` | Validate and create a lead, draft, and simulated follow-up |
| `PATCH` | `/api/leads/:id/status` | Update a lead status and record the change |
| `POST` | `/api/reset` | Restore the fictional sample dataset |

## Tests

```bash
npm test
npm run build
```

Tests cover input validation, optional phone handling, API-side rejection of invalid data, and successful lead creation with a draft and follow-up activity.

## Screenshots

Start the app with `npm run dev`, then capture screenshots in a browser at desktop and mobile widths. Suggested portfolio captures:

1. Dashboard with the seeded sample leads and the lead detail panel open.
2. Capture form in its initial state.
3. Capture form after a successful submission, showing the success state.
4. Dashboard at a narrow mobile width, with navigation closed and the lead table scrollable.

The UI uses a restrained navy, white, and blue palette and includes explicit sample-data and automation disclosures in the screenshots.

## Limitations

- Intended for local development and portfolio demonstration only; the browser workspace cookie provides visitor isolation, not account authentication or a security boundary for real customer data.
- Visitors should enter fictional details only. Do not use this demo as a real lead-management system.
- Response text is assembled from fixed templates and is not generated by a model.
- Follow-ups are activity-log entries only. Nothing is scheduled with an external service and no email or text message is sent.
- Demo contact details are fictional `example.com` addresses and reserved-style phone numbers.
- The project includes Render deployment configuration, but no hosted service has been created or published.

## portfolio description

> Built LeadFlow AI, a responsive lead-management demo with a React/Vite dashboard, Express API, and SQLite persistence. Implemented server-side validation, deterministic personalized response drafts, simulated follow-up activity, seeded fictional data, and resettable local workflows. Clearly disclosed the demo's non-AI and no-send limitations.
