# Weather Dashboard Deployment Guide

This guide covers deploying the Weather Dashboard application using Docker, Render, or Vercel.

## 🐳 Docker Deployment

### Prerequisites
- Docker installed and running
- At least 2GB RAM available
- Port 3000 available

### Quick Start
```bash
# Test Docker build and deployment
npm run docker:test

# Or manually:
npm run docker:build
npm run docker:run
```

### Manual Docker Commands
```bash
# Build the image
docker build -t weather-dashboard .

# Run the container
docker run -p 3000:3000 --name weather-dashboard weather-dashboard

# Run in background
docker run -d -p 3000:3000 --name weather-dashboard weather-dashboard

# View logs
docker logs weather-dashboard

# Stop and remove
docker stop weather-dashboard
docker rm weather-dashboard
```

### Docker Compose (Recommended)
```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## 🌐 Render Deployment

### Prerequisites
- Render account
- GitHub repository
- Render CLI (optional)

### Automatic Deployment
1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` file
3. The application will build and deploy automatically

### Manual Deployment
```bash
# Install Render CLI
npm install -g @render/cli

# Deploy
npm run deploy:render
```

### Configuration
The `render.yaml` file includes:
- Docker-based deployment
- Health checks on `/api/health`
- Auto-scaling configuration
- Environment variables

## ▲ Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository
- Vercel CLI (optional)

### Automatic Deployment
1. Import your GitHub repository to Vercel
2. Vercel will automatically detect Next.js and deploy
3. The `vercel.json` configuration will be applied

### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
npm run deploy:vercel
```

### Configuration
The `vercel.json` file includes:
- Next.js build configuration
- Custom headers for security
- API route configuration
- Caching rules

## 🏥 Health Checks

All deployments include a health check endpoint:
- **URL**: `/api/health`
- **Method**: GET
- **Response**: JSON with status, uptime, memory usage

Example response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "memory": {
    "used": 45.2,
    "total": 128.0
  }
}
```

## 🔧 Environment Variables

### Required Variables
- `NODE_ENV`: Set to `production` for production builds
- `PORT`: Port number (default: 3000)
- `HOSTNAME`: Hostname (default: 0.0.0.0 for Docker)

### Optional Variables
- `NEXT_TELEMETRY_DISABLED`: Set to `1` to disable Next.js telemetry

## 📊 Performance Considerations

### Docker Optimization
- Multi-stage build reduces image size
- Standalone output for minimal runtime
- Non-root user for security
- Health checks for reliability

### Build Optimization
- SWC minification enabled
- CSS optimization
- Package import optimization
- Static asset caching

## 🚀 Deployment Scripts

Use the provided scripts for easy deployment:

```bash
# Local development
npm run deploy:local

# Docker deployment
npm run deploy:docker

# Render deployment
npm run deploy:render

# Vercel deployment
npm run deploy:vercel

# Test Docker build
npm run docker:test
```

## 🐛 Troubleshooting

### Docker Issues
1. **Build fails**: Check Docker daemon is running
2. **Port conflicts**: Use different port mapping
3. **Memory issues**: Increase Docker memory limit
4. **Permission errors**: Check file permissions

### Render Issues
1. **Build timeout**: Increase build timeout in render.yaml
2. **Memory errors**: Upgrade to higher plan
3. **Health check fails**: Check `/api/health` endpoint

### Vercel Issues
1. **Function timeout**: Check function duration limits
2. **Build errors**: Check build logs in Vercel dashboard
3. **Static files**: Ensure proper public folder structure

## 📝 Logs and Monitoring

### Docker Logs
```bash
# View logs
docker logs weather-dashboard

# Follow logs
docker logs -f weather-dashboard

# View last 100 lines
docker logs --tail 100 weather-dashboard
```

### Production Monitoring
- Health endpoint: `/api/health`
- Performance monitor in app (bottom right)
- Browser developer tools for client-side issues

## 🔒 Security

### Docker Security
- Non-root user (nextjs:nodejs)
- Minimal base image (Alpine Linux)
- Security headers configured
- No sensitive data in image

### Production Security
- HTTPS enforced
- Security headers (CSP, XSS protection)
- No telemetry in production
- Secure cookie settings

## 📈 Scaling

### Render Scaling
- Auto-scaling configured in render.yaml
- CPU and memory-based scaling
- Min 1, Max 3 instances

### Vercel Scaling
- Automatic serverless scaling
- Edge network distribution
- Function-based scaling

## 🆘 Support

If you encounter issues:
1. Check the health endpoint
2. Review application logs
3. Verify environment variables
4. Check resource usage
5. Test locally with Docker first
