# Deployment Guide

This guide covers deploying Insight Flow to production environments.

## Prerequisites

- Node.js 18+ for frontend
- Python 3.11+ for backend
- Docker (optional, for containerized deployment)

## Environment Variables

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Backend (.env)

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (for real data)
FMP_API_KEY=your-fmp-key
FRED_API_KEY=your-fred-key

# Optional (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

---

## Option 1: Vercel (Frontend) + Railway (Backend)

### Frontend on Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `frontend`

2. **Configure Build**
   ```
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**
   Add `NEXT_PUBLIC_API_URL` pointing to your Railway backend

4. **Deploy**
   Click Deploy - Vercel handles the rest

### Backend on Railway

1. **Create New Project**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select repository, set root to `api`

2. **Configure Service**
   ```
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   Add all required API keys

4. **Generate Domain**
   Settings → Generate Domain
   Use this URL for `NEXT_PUBLIC_API_URL`

---

## Option 2: Docker Compose (Self-Hosted)

### Build and Run

```bash
# Build images
docker-compose build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### Docker Compose Environment

Create `.env` in project root:

```bash
# API Keys
OPENAI_API_KEY=sk-...
FMP_API_KEY=your-key
FRED_API_KEY=your-key

# URLs (for production)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Reverse Proxy (Nginx)

For production, use Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Option 3: Cloud Platforms

### AWS (ECS/Fargate)

1. Push images to ECR
2. Create ECS cluster
3. Define task definitions
4. Create services with ALB

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/insight-flow-api api/
gcloud builds submit --tag gcr.io/PROJECT_ID/insight-flow-frontend frontend/

# Deploy
gcloud run deploy insight-flow-api --image gcr.io/PROJECT_ID/insight-flow-api
gcloud run deploy insight-flow-frontend --image gcr.io/PROJECT_ID/insight-flow-frontend
```

---

## Post-Deployment Checklist

### Verification Steps

- [ ] Frontend loads at production URL
- [ ] API health check passes: `curl https://api-domain/health`
- [ ] Navigation works between all pages
- [ ] AI Analysis triggers successfully
- [ ] No console errors in browser
- [ ] SSL/HTTPS configured correctly
- [ ] CORS settings allow frontend origin

### Performance Checks

- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Images and assets load correctly
- [ ] Mobile responsive design works

### Security Checks

- [ ] API keys not exposed in frontend
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] No sensitive data in logs

---

## Troubleshooting

### CORS Errors

Update `api/main.py` CORS settings:
```python
allow_origins=["https://your-frontend-domain.com"]
```

### API Connection Failed

1. Check `NEXT_PUBLIC_API_URL` is set correctly
2. Verify backend is running and accessible
3. Check network/firewall rules

### Build Failures

```bash
# Clear caches
rm -rf frontend/.next frontend/node_modules
rm -rf api/__pycache__

# Reinstall dependencies
cd frontend && npm install
cd ../api && pip install -r requirements.txt
```

---

## Monitoring

### Recommended Tools

- **Uptime**: UptimeRobot, Pingdom
- **Logs**: Datadog, LogDNA, Papertrail
- **APM**: New Relic, Datadog APM
- **Error Tracking**: Sentry

### Health Endpoints

- Frontend: `https://your-domain.com/` (should return 200)
- Backend: `https://api.your-domain.com/health` (returns `{"status": "healthy"}`)
- Cache Stats: `https://api.your-domain.com/api/cache/stats`
