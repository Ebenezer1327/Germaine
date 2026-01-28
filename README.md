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

### API Routes
- `GET /api/journal` - Get user's journal entries
- `POST /api/journal` - Create new journal entry
- `PUT /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry

## Technologies

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon DB)
- **Frontend**: HTML, CSS, JavaScript
- **3D Graphics**: Three.js
- **Authentication**: express-session, bcryptjs
