# POST App — BluOm7

Social media app with posts, friends, messages, and notifications.

## Run & Operate

- `pnpm --filter @workspace/post-app run dev` — frontend preview (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — Node.js API server (port 8080)

## GitHub Repos (direct access)

| Folder | GitHub Repo | Purpose |
|--------|-------------|---------|
| `frontend-source/` | `bluOm7/post-app-frontend` | Main HTML+React frontend |
| `python-backend/` | `bluOm7/post-app-backend` | FastAPI Python backend |

### Change workflow
1. Edit file in `frontend-source/` or `python-backend/`
2. For frontend: also copy `index.html` → `artifacts/post-app/index.html` for live preview
3. Commit + push from that folder to GitHub → Render auto-deploys

### Git commands (run inside the folder)
```bash
# Pull latest
cd frontend-source && git pull origin main
cd python-backend  && git pull origin main

# Commit + push after changes
git add -A && git commit -m "fix: description" && git push origin main
```

## Stack

- **Frontend**: React 18 (UMD CDN), plain HTML/CSS/JS — `frontend-source/index.html`
- **Backend**: Python FastAPI + MongoDB (Motor) + Cloudinary — `python-backend/server.py`
- **Auth**: JWT (PyJWT) + bcrypt
- **Email**: Resend
- **Hosting**: Render (both frontend + backend)
- **Live backend URL**: `https://post-app-backend-n47s.onrender.com/api`

## Where things live

- `frontend-source/index.html` — entire frontend (22K lines, React UMD)
- `frontend-source/sw.js` — service worker for push notifications
- `python-backend/server.py` — entire backend (~4K lines, FastAPI)
- `artifacts/post-app/index.html` — copy of frontend used for Replit preview

## User preferences

- Make changes as instructed, then commit and push to GitHub.
