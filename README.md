# MERN-Based Remote Technical Interview Platform

A full-stack web application for conducting remote technical interviews with live coding, video calls, real-time chat, and automated code evaluation.

## Technologies Used

- **Frontend:** React.js, Tailwind CSS, TanStack Query
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Tools & Services:** Clerk, Stream, Inngest, GitHub

## Key Features

- **VSCode-powered live code editor** — Monaco Editor with syntax highlighting and IntelliSense
- **One-on-one video interview rooms** — Stream Video SDK (HD video calls)
- **Real-time chat messaging** — In-interview chat sidebar
- **Secure code execution** — Sandboxed via Piston API
- **Automated success/failure feedback** — Test case validation
- **Practice problems module** — Curated coding challenges (Easy/Medium/Hard)

## Project Structure

```
├── backend/
│   ├── config/           # MongoDB connection
│   ├── controllers/      # Route handlers
│   ├── inngest/          # Background job processing
│   ├── middleware/       # Auth middleware (Clerk JWT)
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   └── server.js         # Express app entry point
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── lib/          # API client
│       └── pages/        # Page components
└── README.md
```

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Clerk account (authentication)
- Stream account (video/chat) — optional for basic usage

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd "final year"
```

### 2. Backend setup

```bash
cd backend
npm install
```

Edit `backend/.env` with your credentials:

```
MONGODB_URI=mongodb://localhost:27017/interview-platform
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
STREAM_API_KEY=your_key
STREAM_API_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key

```

Start the server:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Edit `frontend/.env`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:5000
VITE_STREAM_API_KEY=your_key
```

Start the dev server:

```bash
npm run dev
```

### 4. Open the app

Navigate to `http://localhost:5173` in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/webhook` | Clerk webhook |
| POST | `/api/auth/sync` | Sync user |
| GET | `/api/problems` | List problems |
| GET | `/api/problems/:id` | Get problem |
| POST | `/api/problems` | Create problem |
| POST | `/api/code/execute` | Execute code |
| POST | `/api/submissions` | Submit solution |
| GET | `/api/interviews` | List interviews |
| POST | `/api/interviews` | Create interview |
| GET | `/api/interviews/stream-token` | Get video token |

## Future Enhancements

- Multi-language code execution support
- AI-based code analysis and feedback
- Interview recording and playback
- Company-level interview management
- Advanced collaborative editing (CRDT-based)

## License

This project is part of a final year academic submission.
