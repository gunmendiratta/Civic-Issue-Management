# CivicConnect

The current milestone includes issue reporting, tracking, filtering, assignment, and status management.

1. Start MongoDB locally, or copy `server/.env.example` to `server/.env` and configure `MONGODB_URI`.
2. Run `cd server && npm install && npm run dev`.
3. Run `cd client && npm install && npm run dev` in a second terminal.

Open `http://localhost:5173`. The local API runs on port 3000: `GET /api/issues`, `POST /api/issues` (multipart form; image optional), and `PATCH /api/issues/:id`.
