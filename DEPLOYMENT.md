# Husl-OS v2 — Hostinger VPS Deployment Guide

This guide covers deploying the full stack on a **Hostinger VPS (Ubuntu 22.04 LTS)**.

- **Server IP**: `193.203.160.42`
- **Domain**: `HustleOs.thehustlehouseofficial.com` *(optional SSL)*

---

## Architecture Overview

```
Internet
    │
    ▼
 Nginx (port 80 / 443)
    │
    ├─── /            → Serves built React frontend (dist/)
    ├─── /api/analytics/voice → Node.js voice proxy  (port 5005)
    ├─── /api/analytics       → Python Flask AI API  (port 5002)
    ├─── /api                 → Node.js Express API  (port 5001)
    └─── /uploads             → Node.js Express API  (port 5001)

Services (managed by PM2 / Supervisor):
  ├── backend/server.js        → PM2 (port 5001 + 5005 voice proxy)
  └── Auto-LLM/analytics-llm/api.py → Supervisor (port 5002)

Database:
  └── MongoDB Atlas (cloud) — no local DB required
```

---

## 1. Initial VPS Setup

SSH into your Hostinger VPS as root:

```bash
ssh root@193.203.160.42
```

### Update the system

```bash
apt update && apt upgrade -y
apt install -y git curl wget unzip build-essential software-properties-common
```

---

## 2. Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v20.x.x
npm -v
```

### Install PM2 globally

```bash
sudo npm install -g pm2
```

---

## 3. Install Python 3.11

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
python3.11 --version   # 3.11.x
```

---

## 4. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 5. Clone the Repository

```bash
cd /var/www
git clone https://github.com/<your-org>/Inhouse-Husl-OS-v2.git
cd Inhouse-Husl-OS-v2
```

> Replace the GitHub URL with your actual private repo URL. If the repo is private, set up an SSH deploy key or use a personal access token.

---

## 6. Configure Environment Variables

### Backend `.env`

```bash
nano backend/.env
```

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRE=7d
FRONTEND_URL=http://193.203.160.42
EMAIL_SERVICE=gmail
EMAIL_USER=Thhworkspaces@gmail.com
EMAIL_PASS=<gmail-app-password>
EMAIL_FROM=The Hustle OS <Thhworkspaces@gmail.com>
CALENDLY_API_KEY=<calendly-pat>
CALENDLY_ORGANIZATION_URI=<org-uri>
CALENDLY_USER_URI=<user-uri>
N8N_WEBHOOK_URL=https://n8n.srv812138.hstgr.cloud/webhook/fetch
```

### Frontend `.env`

```bash
nano frontend/.env
```

```env
VITE_API_URL=/api
VITE_ENV=production
VITE_BACKEND_URL=http://193.203.160.42
```

> In production the frontend is a static build — `VITE_*` variables are baked in at build time. Make sure these are set **before** running `npm run build`.

### Python AI Service `.env`

```bash
nano Auto-LLM/analytics-llm/.env
```

```env
OPENROUTER_API_KEY=<openrouter-api-key>
ANALYTICS_MODEL=openai/gpt-4o-mini
ANALYTICS_TEMPERATURE=0.3
ANALYTICS_MAX_TOKENS=2000
MONGODB_URI=<your-mongodb-atlas-connection-string>
DB_NAME=test
CACHE_ENABLED=true
CACHE_TTL=300
CHROMA_PERSIST_DIR=./chroma_db
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RESULTS=5
RAG_TEMPERATURE=0.3
SYNC_INTERVAL_HOURS=1
ELEVENLABS_API_KEY=<elevenlabs-key>
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
VOICE_ENABLED=false
```

---

## 7. Install Backend Dependencies

```bash
cd /var/www/Inhouse-Husl-OS-v2/backend
npm install --omit=dev
```

---

## 8. Build the Frontend

```bash
cd /var/www/Inhouse-Husl-OS-v2/frontend
npm install
npm run build
```

The production assets are output to `frontend/dist/`. Nginx will serve this directory.

---

## 9. Set Up the Python AI Service

```bash
cd /var/www/Inhouse-Husl-OS-v2/Auto-LLM/analytics-llm

# Create a fresh virtualenv (ignore the existing venv/ from dev)
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

> **Note on GPU acceleration**: `faster-whisper` and `torch` can run on CPU if no GPU is present on the VPS. Expect higher latency for STT when `VOICE_ENABLED=true`. For a CPU-only server, the voice feature is best left disabled (`VOICE_ENABLED=false`).

### Test the Python service manually

```bash
source /var/www/Inhouse-Husl-OS-v2/Auto-LLM/analytics-llm/venv/bin/activate
cd /var/www/Inhouse-Husl-OS-v2/Auto-LLM/analytics-llm
python api.py
# Should print: * Running on http://0.0.0.0:5002
# Ctrl+C to stop
```

---

## 10. Start Node.js Backend with PM2

```bash
cd /var/www/Inhouse-Husl-OS-v2/backend
pm2 start server.js --name hustle-backend

# Save the process list so it survives a reboot
pm2 save

# Register PM2 to start on system boot
pm2 startup
# PM2 will print a sudo command — copy and run it exactly as shown
```

> The frontend does **not** need PM2. It is a static build served directly by Nginx from the `frontend/dist/` folder.

---

## 11. Configure Supervisor for Python Service

```bash
mkdir -p /var/www/logs
sudo apt install -y supervisor
sudo nano /etc/supervisor/conf.d/hustle-analytics.conf
```

```ini
[program:hustle-analytics]
command=/var/www/Inhouse-Husl-OS-v2/Auto-LLM/analytics-llm/venv/bin/python api.py
directory=/var/www/Inhouse-Husl-OS-v2/Auto-LLM/analytics-llm
user=root
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stdout_logfile=/var/www/logs/analytics-out.log
stderr_logfile=/var/www/logs/analytics-error.log
environment=PATH="/var/www/Inhouse-Husl-OS-v2/Auto-LLM/analytics-llm/venv/bin:%(ENV_PATH)s"
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start hustle-analytics
sudo supervisorctl status
```

---

## 12. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/hustle-os
```

```nginx
server {
    listen 80;
    server_name 193.203.160.42 HustleOs.thehustlehouseofficial.com;

    # Increase body size for file uploads
    client_max_body_size 50m;

    # Serve React SPA static files
    root /var/www/Inhouse-Husl-OS-v2/frontend/dist;
    index index.html;

    # ── Voice proxy (Node.js) ─────────────────────────────────────
    location /api/analytics/voice {
        proxy_pass http://127.0.0.1:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # ── Python Flask AI API ──────────────────────────────────────
    location /api/analytics {
        proxy_pass http://127.0.0.1:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # ── Node.js Express API ──────────────────────────────────────
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # ── Uploaded files (profile photos, docs) ────────────────────
    location /uploads {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
    }

    # ── React SPA fallback ───────────────────────────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and test:

```bash
sudo ln -s /etc/nginx/sites-available/hustle-os /etc/nginx/sites-enabled/
sudo nginx -t          # must say "syntax is ok"
sudo systemctl reload nginx
```

> **Note**: The Hostinger VPS has the frontend accessible on port `9000` in the legacy setup. After this Nginx configuration, the app is served on the standard **port 80**. If you need to keep port 9000, change `listen 80` to `listen 9000` and open that port in the firewall step below.

---

## 13. Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # opens 80 and 443
# If you still need direct VPS port access (optional):
# sudo ufw allow 9000
sudo ufw enable
sudo ufw status
```

---

## 14. (Optional) SSL with Let's Encrypt

This requires a domain pointed at the VPS IP first.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d HustleOs.thehustlehouseofficial.com
# Follow prompts; Certbot will auto-update the Nginx config

# Auto-renewal is set up by default; verify:
sudo systemctl status certbot.timer
```

Update `FRONTEND_URL` in `backend/.env` to `https://HustleOs.thehustlehouseofficial.com` and restart the backend after enabling SSL.

---

## 15. Seed the Database (First Deploy Only)

```bash
cd /var/www/Inhouse-Husl-OS-v2/backend
node config/seedCEO.js
```

---

## 16. Verify All Services

```bash
# Node.js backend
pm2 status
pm2 logs hustle-backend --lines 30

# Python AI service
sudo supervisorctl status hustle-analytics
tail -f /var/www/logs/analytics-out.log

# Nginx
sudo systemctl status nginx

# Quick smoke test
curl -s http://localhost:5001/api/health   # or any health endpoint
curl -s http://localhost:5002/health
```

---

## Day-2 Operations

### Deploying code updates

```bash
cd /var/www/Inhouse-Husl-OS-v2
git pull origin main

# Rebuild frontend if changed
cd frontend && npm install && npm run build && cd ..

# Restart backend if changed
pm2 restart hustle-backend

# Restart Python service if changed
sudo supervisorctl restart hustle-analytics
```

### Useful PM2 commands

| Command | Description |
|---|---|
| `pm2 status` | Show process status |
| `pm2 logs hustle-backend` | Tail backend logs |
| `pm2 restart hustle-backend` | Restart backend |
| `pm2 reload hustle-backend` | Zero-downtime reload |
| `pm2 stop hustle-backend` | Stop backend |

### Useful Supervisor commands

| Command | Description |
|---|---|
| `sudo supervisorctl status` | Show all program status |
| `sudo supervisorctl restart hustle-analytics` | Restart Python service |
| `sudo supervisorctl tail hustle-analytics stderr` | Tail error logs |

### Log locations

| Log | Path |
|---|---|
| Backend stdout | `~/.pm2/logs/hustle-backend-out.log` |
| Backend stderr | `~/.pm2/logs/hustle-backend-error.log` |
| Analytics stdout | `/var/www/logs/analytics-out.log` |
| Analytics stderr | `/var/www/logs/analytics-error.log` |
| Nginx access | `/var/log/nginx/access.log` |
| Nginx error | `/var/log/nginx/error.log` |

---

## Port Reference

| Service | Port | Managed by |
|---|---|---|
| Nginx (HTTP) | 80 | systemd |
| Nginx (HTTPS) | 443 | systemd |
| Node.js Express API | 5001 | PM2 |
| Python Flask AI API | 5002 | Supervisor |
| Node.js Voice Proxy | 5005 | PM2 (same process as backend) |
| MongoDB | — | Atlas (cloud) |

---

## Troubleshooting

### Nginx 502 Bad Gateway
The upstream service (backend or Python) is not running. Check:
```bash
pm2 status
sudo supervisorctl status
```

### CORS errors in the browser
Ensure `FRONTEND_URL` in `backend/.env` matches the exact origin the browser uses (e.g., `http://193.203.160.42` — no trailing slash, correct port).

### Python service crashes on startup
Missing system library for `pydub` / `av`:
```bash
sudo apt install -y ffmpeg libavcodec-dev libavformat-dev libavutil-dev
```

### `better_profanity` or other pip install failures
```bash
source /var/www/Inhouse-Husl-OS-v2/Auto-LLM/analytics-llm/venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Frontend shows blank page / 404 on refresh
The Nginx `try_files $uri $uri/ /index.html` fallback handles SPA routing. If it is missing, add it to the `location /` block and reload Nginx.

### MongoDB connection refused
The app uses **MongoDB Atlas** (cloud). Ensure:
1. Your VPS IP is whitelisted in Atlas → Network Access.
2. The `MONGODB_URI` in both `backend/.env` and `Auto-LLM/analytics-llm/.env` is correct.

---

*Last updated: 2026-03-06*
