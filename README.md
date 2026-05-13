# Cove

A sleek, Netflix-style streaming platform for anime and animated films — built as a full-stack personal project.

---

## Features

### Browsing & Discovery
- **Hero section** — randomly featured title with a full-screen landscape backdrop, Watch Now CTA, and save button
- **Category rows** — separate horizontally-scrollable rows for Anime and Animated, each with drag-to-scroll and arrow buttons
- **Portrait cards** — 2:3 ratio cards with hover scale, Movie/Series badge, and heart button that appears on hover
- **Continue Watching** — resumes right where you left off with a snapshot thumbnail and progress bar

### Video Player
- Custom HTML5 player with play/pause, scrubbing, volume, fullscreen, and auto-hiding controls
- Progress saved to server every 10 seconds and on pause
- Episode switcher in the right panel — click any episode to jump directly
- Keyboard shortcuts: `Space`/`K` play/pause · `←`/`→` seek ±5s · `↑`/`↓` volume · `M` mute · `F` fullscreen

### Social
- **Comments** — threaded replies with `@mention` pre-fill, edit, delete, and like/dislike per comment
- **Reactions** — per-episode like/dislike with a live ratio bar
- **Favorites** — save series to your list, synced to your account
- **Bookmarks** — bookmark individual episodes

### Account
- JWT auth with persistent sessions
- Settings page: edit display name, change email/password, upload profile photo, delete account
- Avatar upload with a drag-to-reposition crop modal

---

## Tech Stack

**Frontend**
| | |
|---|---|
| React 19 + TypeScript | UI |
| Vite | Dev server & bundler |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations, shared-element card morphs |
| GSAP | Comment entrance and delete animations |
| React Icons | Icon set |

**Backend**
| | |
|---|---|
| Node.js + Express | REST API |
| MongoDB + Mongoose | Database |
| JWT + bcrypt | Auth |

---

## Project Structure

```
cove/
├── src/
│   ├── App.tsx                  # Root — page state, transitions, overlays
│   ├── data.ts                  # All series/episode data + TMDB image URLs
│   ├── Hero.tsx                 # Featured title hero
│   ├── Navbar.tsx               # Top bar with search
│   ├── Sidebar.tsx              # Left nav + mobile bottom bar
│   ├── SeriesBrowse.tsx         # Category rows with drag scroll
│   ├── ContinueWatching.tsx     # Resume watching row
│   ├── VideoDetailsPage.tsx     # Series detail, video player, comments
│   ├── VideoPlayer.tsx          # Custom HTML5 player
│   ├── Favorites.tsx            # Saved series page
│   ├── SearchResultsPage.tsx    # Search results
│   ├── SettingsPage.tsx         # Account settings
│   ├── AuthContext.tsx          # Auth state
│   ├── FavoritesContext.tsx     # Favorites state
│   └── WatchProgressContext.tsx # Watch progress state
│
└── server/
    ├── index.js
    ├── models/
    │   ├── user.js
    │   ├── WatchProgress.js
    │   ├── Comment.js
    │   └── VideoReaction.js
    └── routes/
        ├── userRoutes.js
        ├── watchProgressRoutes.js
        ├── commentRoutes.js
        └── videoReactionRoutes.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Configure environment

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/cove
JWT_SECRET=your_secret_key_here
PORT=5000
```

### 3. Start the backend

```bash
cd server
node index.js
```

### 4. Start the frontend

```bash
# From project root
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:5000`.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | | Register |
| POST | `/api/users/login` | | Login, returns JWT |
| GET | `/api/users/me` | ✓ | Restore session |
| PUT | `/api/users/profile` | ✓ | Update display name |
| PUT | `/api/users/email` | ✓ | Change email |
| PUT | `/api/users/password` | ✓ | Change password |
| PUT | `/api/users/avatar` | ✓ | Upload avatar |
| DELETE | `/api/users/account` | ✓ | Delete account + all data |
| GET | `/api/watch-progress` | ✓ | Get all video progress |
| POST | `/api/watch-progress` | ✓ | Save/update progress |
| DELETE | `/api/watch-progress/:seriesId/:episodeId` | ✓ | Remove entry |
| GET | `/api/comments/:seriesId/:episodeId` | | Fetch comments |
| POST | `/api/comments` | ✓ | Post comment or reply |
| PUT | `/api/comments/:id` | ✓ | Edit comment |
| DELETE | `/api/comments/:id` | ✓ | Delete comment |
| POST | `/api/comments/:id/like` | ✓ | Toggle like |
| POST | `/api/comments/:id/dislike` | ✓ | Toggle dislike |
| GET | `/api/video-reactions/:seriesId/:episodeId` | | Get reaction counts |
| POST | `/api/video-reactions` | ✓ | Toggle like/dislike |

---

## Credits

- Backdrop and poster images from [TMDB](https://www.themoviedb.org/)
- Anime thumbnails from [MyAnimeList](https://myanimelist.net/)
- Placeholder video: [Big Buck Bunny](https://peach.blender.org/) — Blender Foundation, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
