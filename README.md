# Germaine & Snowy

A personal website for Germaine featuring countdown timers, games, mystery boxes, and a private journal.

## Project Structure

```
Germaine/
├── index.js                 # Main server file
├── package.json            # Dependencies
├── .env                    # Environment variables
│
├── db/                     # Database initialization
│   └── init.js            # Database setup and migrations
│
├── middleware/             # Express middleware
│   └── auth.js            # Authentication middleware
│
├── controllers/            # Business logic
│   ├── authController.js  # Authentication logic
│   └── journalController.js # Journal CRUD operations
│
├── routes/                 # Route handlers
│   ├── pages.js           # Page routes (HTML)
│   ├── auth.js            # Authentication routes
│   └── api.js             # API routes
│
└── public/                 # Frontend files
    ├── *.html             # HTML pages
    ├── css/               # Stylesheets
    │   └── style.css      # Main stylesheet
    └── js/                # JavaScript files
        ├── script.js      # Countdown timer
        ├── rabbit.js      # 3D characters (Three.js)
        ├── journal.js     # Journal functionality
        └── wordle.js      # Wordle game logic
```

## Features

- **Countdown Timer**: Countdown to August 20, 2026
- **3D Characters**: Interactive 3D rabbit (Snowy) and girl (Germaine)
- **Mystery Boxes**: 24 weekly mystery boxes with countdown timers
- **Games Hub**: 10 mini games (Wordle implemented)
- **Private Journal**: Text and image moodboard with drag-and-drop
- **Authentication**: Login system with session management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=3000
NODE_ENV=development
DATABASE_URL=your_neon_db_connection_string
SESSION_SECRET=your_secret_key
```

   **Optional – Spotify (full songs on Music page):** Create an app at [Spotify for Developers](https://developer.spotify.com/dashboard), add a Redirect URI (e.g. `http://localhost:3000/music/spotify-callback`), then set:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/music/spotify-callback
```
   Users need a **Spotify Premium** account to play full tracks in the browser.

   **Optional – Chat (mascot “Need me?”):** The mascot opens a chat so your partner (e.g. Germaine) feels they’re talking to you. Add your OpenAI API key to `.env` (never commit it; if it was ever pasted in chat, rotate it at platform.openai.com):
```
OPENAI_API_KEY=your_openai_api_key
```
   **To make the AI think and talk like you when Germaine uses the site**, set these in `.env` (no UI; you set it once before giving her the site):
```
CHAT_AS_NAME=YourName
CHAT_VOICE_INSTRUCTIONS=How you want to sound, e.g. Casual and warm. I use "haha" and emojis sometimes. I call my partner babe.
CHAT_VOICE_SAMPLES=["Love you, talk later!", "Miss you already.", "Can't wait to see you."]
```
   - `CHAT_AS_NAME`: The name the AI uses (you). When set, the chat always replies as you, no matter who is logged in.
   - `CHAT_VOICE_INSTRUCTIONS`: Short description of your tone and style.
   - `CHAT_VOICE_SAMPLES`: JSON array of example phrases (up to 10) that sound like you. Use double quotes inside the string.

3. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## Default Users

- Username: `germaine` | Password: `T270819i`
- Username: `admin` | Password: `T270819i`

## Routes

### Public Routes
- `/` - Public countdown page
- `/countdown` - Countdown page with navbar
- `/login` - Login page

### Protected Routes (require login)
- `/home` - Home dashboard with bento layout
- `/mystery` - Mystery boxes page
- `/games` - Games hub
- `/wordle` - Wordle game
- `/journal` - Private journal
- `/music` - Music page (YouTube audio + optional Spotify full playback)

### Spotify (Music page)
- `GET /music/spotify-login` - Redirect to Spotify authorization
- `GET /music/spotify-callback` - OAuth callback (exchange code for tokens)

### API Routes
- `GET /api/journal` - Get user's journal entries
- `POST /api/journal` - Create new journal entry
- `PUT /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry
- `GET /api/spotify/token` - Get access token for Web Playback SDK
- `POST /api/spotify/refresh` - Refresh Spotify token
- `POST /api/spotify/disconnect` - Clear Spotify session

## Technologies

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon DB)
- **Frontend**: HTML, CSS, JavaScript
- **3D Graphics**: Three.js
- **Authentication**: express-session, bcryptjs
