# ⚡ PLETTO — Distributed Real-Time Collaboration OS

<div align="center">

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**A unified, hyper-responsive digital workspace for high-velocity teams.**  
*Merge team chat, 1-on-1 direct messaging, knowledge documents, and live presence into a single synchronized operating system.*

[Features](#-key-features) • [Architecture](#-architecture--tech-stack) • [Quick Start](#-quick-start) • [Environment Variables](#-environment-variables) • [WebSocket Events](#-real-time-websocket-engine) • [API Reference](#-api-endpoints-overview)

</div>

---

## 🌟 Overview

Modern teams suffer from tool fragmentation — switching endlessly between Slack, Notion, Google Docs, and standalone messaging utilities. 

**PLETTO** solves this by delivering a **multiplayer operating system for teams**:
- **Sub-40ms Event Synchronization**: Driven by Socket.IO and MongoDB.
- **Unified Workspace Interface**: Access channels, documents, direct messages, and team presence in a single cohesive window.
- **Keyboard-First Workflow**: Jump anywhere instantaneously with the global **⌘K Command Palette**.
- **Enterprise-Ready Workspace Security**: Granular member roles, public/private room privacy, and JWT authentication.

---

## ⚙️ Key Features

### 💬 Real-Time Team Channels
- **Public & Private Discussion Rooms**: Organize conversations by team, squad, or topic.
- **Live Threaded Discussions & Reactions**: Keep conversations organized with threads and emojis.
- **Typing Indicators & Live Message Delivery**: Real-time Socket.IO broadcasts ensure zero-delay communication.
- **Pinned Announcements & Topic Headers**: Highlight mission-critical channel announcements.

### ✉️ 1-on-1 Direct Messaging (DM)
- **Private Conversations**: Instant peer-to-peer discussions with team members.
- **Teammate Directory**: Search and start conversations directly from your team roster.
- **Integrated Presence**: View whether your colleague is online, away, or offline before messaging.

### 📄 Real-Time Knowledge Documents
- **Full-Screen Markdown & Plain Text Spec Editor**: Dedicated distraction-free focus view.
- **Side-by-Side Live Markdown Preview**: Render headings, code blocks, tables, task checkboxes, and quotes in real time.
- **Collaborative Sync**: State updates persisted to MongoDB and synced live across open client sessions.

### 🎛️ Mission Control Dashboard
- **Real-Time Pulse**: Overview of total workspace channels, knowledge docs, and active members.
- **Live Activity Stream**: Immediate chronological stream of recent workspace actions and document revisions.
- **Instant Quick Navigation**: One-click jump to active channels, documents, and team members.

### ⚡ Global Command Palette (⌘K)
- **Instant Jump Navigation**: Press `⌘K` (or `Ctrl+K`) anywhere in the app to jump to any page, channel, or document.
- **Keyboard Navigation**: Use `↑` / `↓` arrows and `Enter` to navigate without touching your mouse.
- **Live Filtering**: Fast fuzzy search across all application modules.

### 🏢 Workspace Control Center (`/my-channels`)
- **Central Asset Registry**: Single focus view for managing all channels and documents.
- **Fast Filtering & Search**: Filter by all assets, channels only, or documents only.
- **Asset Creator Permissions**: Securely manage or delete channels and documents.

### 🟢 Live Presence & Team Roster
- **Presence Stacks**: Real-time visual avatar stacks displaying active collaborators in the header.
- **Automated Heartbeats**: Heartbeat-driven online/offline detection with socket disconnect cleanup.

---

## 🏗️ Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │                     PLETTO Client (Vite + React 19)         │
   │  React Router 7 │ Tailwind CSS │ Context API │ Socket.io    │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ HTTP / REST  &  WebSockets (WSS)
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                     PLETTO Server (Node.js + Express 5)     │
   │  Socket.IO Engine │ JWT Auth Middleware │ Error Handlers    │
   └──────────────┬───────────────────────────────┬──────────────┘
                  │                               │
                  ▼                               ▼
   ┌─────────────────────────────┐ ┌─────────────────────────────┐
   │   MongoDB Atlas (Mongoose)  │ │      Cloudinary Media       │
   │ Users, Workspaces, Messages │ │     Avatars & File Uploads  │
   │ Presence, Documents         │ └─────────────────────────────┘
   └─────────────────────────────┘
```

### Frontend
- **Framework**: [React 19](https://react.dev/) with [Vite 8](https://vitejs.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) with custom dark theme, glassmorphism, and responsive layouts
- **Icons**: [React Icons (Heroicons)](https://react-icons.github.io/react-icons/)
- **State & Networking**: Axios, Socket.IO Client, React Context API (`AuthContext`, `SocketContext`)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES6+ / CommonJS)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose 9](https://mongoosejs.com/)
- **Real-Time Engine**: [Socket.IO 4.8](https://socket.io/)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), bcrypt password hashing
- **File Storage**: [Cloudinary](https://cloudinary.com/) via Multer

---

## 📂 Project Structure

```text
PLETTO/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── app/            # App-level components (e.g., PresenceStack)
│   │   │   ├── brand/          # Logo & branding assets
│   │   │   └── common/         # Layout, CommandPalette, PageShell, ProtectedRoute
│   │   ├── context/            # Global React Context (AuthContext, SocketContext)
│   │   ├── pages/              # Route views
│   │   │   ├── Landing/        # Interactive marketing & simulation landing page
│   │   │   ├── Login/          # Authentication login page
│   │   │   ├── Register/       # Workspace creation & signup page
│   │   │   ├── Dashboard/      # Mission control overview & live activity
│   │   │   ├── Chat/           # Team channels & threaded messaging
│   │   │   ├── DM/             # Direct 1-on-1 messaging
│   │   │   ├── Docs/           # Full-screen markdown & spec editor
│   │   │   ├── MyChannels/     # Workspace Control Center & asset directory
│   │   │   ├── People/         # Team member directory & status
│   │   │   ├── Profile/        # User profile & avatar editor
│   │   │   └── Settings/       # Workspace roles & member invite controls
│   │   ├── routes/             # AppRoutes configuration
│   │   ├── services/           # Axios HTTP API services
│   │   └── index.css           # Global Tailwind & design system styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Node.js + Express + Socket.IO application
│   ├── src/
│   │   ├── config/             # MongoDB connection (db.js)
│   │   ├── controllers/        # Request handlers (auth, chat, docs, workspace, etc.)
│   │   ├── middleware/         # Auth verification & error handling
│   │   ├── models/             # Mongoose schemas (User, Workspace, Channel, Message, etc.)
│   │   ├── routes/             # Express API route declarations
│   │   ├── utils/              # Workspace membership helpers
│   │   ├── app.js              # Express app definition & middleware setup
│   │   └── server.js           # HTTP server initialization & Socket.IO real-time engine
│   └── package.json
│
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas** database URI (or local MongoDB server)

---

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/PLETTO.git
cd PLETTO

# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

---

### 2. Configure Environment Variables

#### Backend (`server/.env`)
Create a file at `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/PLETTO?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary configuration for media uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Frontend (`client/.env`)
Create a file at `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Run Locally

#### Start the Server
```bash
cd server
npm run dev
# Server starts at http://localhost:5000
```

#### Start the Client
```bash
cd client
npm run dev
# Client runs at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Environment Variables

| Variable | Scope | Description | Default / Example |
|---|---|---|---|
| `PORT` | Server | HTTP and WebSocket port | `5000` |
| `MONGO_URI` | Server | MongoDB connection connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Server | Secret key used for signing session tokens | `your-secret-key` |
| `CLIENT_URL` | Server | Allowed CORS origin for client web requests | `http://localhost:5173` |
| `CLOUDINARY_*` | Server | Cloudinary credentials for avatar/file hosting | Cloudinary API credentials |
| `VITE_API_URL` | Client | Base URL pointing to the Express REST API | `http://localhost:5000/api` |

---

## ⚡ Real-Time WebSocket Engine

PLETTO's real-time communication engine is built on Socket.IO and authenticated via JWT on handshake.

### Key Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `userOnline` | Client → Server | `{}` | Authenticates socket connection and updates user status to online |
| `joinChannel` | Client → Server | `channelId` | Subscribes socket to channel room (`channel:<id>`) |
| `sendMessage` | Client → Server | `{ channelId, text, parentMessageId? }` | Sends message to channel and broadcasts to room members |
| `newMessage` | Server → Client | `messageObject` | Emitted when a new channel message arrives |
| `typing` | Client → Server | `{ channelId, isTyping }` | Broadcasts live typing indicator to channel members |
| `joinDoc` | Client → Server | `docId` | Subscribes socket to document room (`doc:<id>`) |
| `docUpdate` | Client ⇆ Server | `{ docId, content, title? }` | Broadcasts live document changes to collaborators |
| `userPresenceUpdate` | Server → Client | `{ userId, status }` | Broadcasts teammate online/offline status changes |

---

## 📡 API Endpoints Overview

All protected routes require an `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create user account and initialize workspace
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Fetch current user profile and workspace metadata

### Channels & Chat (`/api/chat`)
- `GET /api/chat/channels` — List workspace channels
- `POST /api/chat/channels` — Create new public or private channel
- `DELETE /api/chat/channels/:id` — Delete channel (creator only)
- `GET /api/chat/messages/:channelId` — Fetch message history with threads and reactions

### Documents (`/api/docs`)
- `GET /api/docs` — List workspace documents
- `POST /api/docs` — Create new Markdown/Plain text document
- `GET /api/docs/:id` — Fetch single document content
- `PUT /api/docs/:id` — Update document title, content, or type
- `DELETE /api/docs/:id` — Delete document

### Team & Workspaces (`/api/workspace`, `/api/profile`, `/api/presence`)
- `GET /api/workspace/members` — List all members in workspace
- `POST /api/workspace/invite` — Invite new teammate to workspace
- `PUT /api/profile` — Update user name, title, avatar, and color preferences
- `GET /api/presence` — Retrieve real-time presence roster

---

## 🛠️ Verification & Quality Assurance

Both frontend and backend are covered by linting and build validation:

```bash
# Verify backend syntax
node --check server/src/app.js
node --check server/src/server.js

# Verify client production build
cd client
npm run build
```

---

## 🗺️ Roadmap & Future Scope

- [ ] **WebRTC Voice & Video Calls**: Peer-to-peer audio/video rooms directly inside channels.
- [ ] **AI Co-pilot**: Automated document summarization, thread catchup, and smart replies.
- [ ] **Pair Code Collaboration**: Real-time collaborative code editor with syntax highlighting.
- [ ] **Offline Sync Queue**: Optimistic offline updates with conflict resolution.

---

## 📄 License

Distributed under the **ISC License**. See `LICENSE` for more information.