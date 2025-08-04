# 🌤️ Weather Dashboard - Render Deployment Guide

This guide provides comprehensive instructions for deploying the Weather Dashboard to Render using Docker.

## 📋 Prerequisites

Before deploying, ensure you have:

- [Docker](https://www.docker.com/get-started) installed locally
- [Git](https://git-scm.com/) installed and configured
- A [Render](https://render.com/) account
- [Render CLI](https://render.com/docs/cli) installed (optional, but recommended)

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
# Make sure you're in the project root directory
cd weather-dashboard-main

# Run the automated deployment script
./deploy-render.sh
```

### Option 2: Manual Deployment

1. **Connect your repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**
   - **Name:** `weather-dashboard`
   - **Runtime:** `Docker`
   - **Build Command:** (leave empty - Docker handles this)
   - **Start Command:** (leave empty - Docker handles this)
   - **Plan:** `Starter` (or higher based on your needs)

3. **Set environment variables:**
   ```
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   PORT=3000
   HOSTNAME=0.0.0.0
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

## 🐳 Docker Configuration

### Multi-Stage Build

The Dockerfile uses a multi-stage build process for optimal production deployment:

1. **Base Stage:** Sets up Node.js 18 Alpine base image
2. **Dependencies Stage:** Installs only production dependencies
3. **Builder Stage:** Builds the Next.js application
4. **Runner Stage:** Creates the final production image

### Key Features

- **Security:** Runs as non-root user (`nextjs`)
- **Performance:** Uses Alpine Linux for smaller image size
- **Health Checks:** Built-in health monitoring
- **Optimization:** Leverages Next.js standalone output
- **Caching:** Optimized layer caching for faster builds

## 📁 File Structure

```
weather-dashboard-main/
├── Dockerfile              # Production-ready Docker configuration
├── .dockerignore           # Docker build optimization
├── render.yaml             # Render service configuration
├── deploy-render.sh        # Automated deployment script
├── next.config.js          # Next.js production configuration
└── src/
    └── app/
        └── api/
            └── health/
                └── route.ts # Health check endpoint
```

## ⚙️ Configuration Files

### Dockerfile
- Multi-stage build for production optimization
- Security hardening with non-root user
- Health check integration
- Optimized for Render deployment

### render.yaml
- Service configuration for Render
- Environment variables setup
- Health check configuration
- Auto-scaling settings
- Security headers

### .dockerignore
- Optimized build context
- Excludes development files
- Reduces image size
- Faster build times

## 🔍 Health Monitoring

The application includes a comprehensive health check endpoint at `/api/health`:

```json
{
  "status": "ok",
  "timestamp": "2024-08-04T20:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "memory": {
    "used": 45.67,
    "total": 128.00
  }
}
```

## 🚦 Deployment Process

1. **Pre-deployment Checks:**
   - Dependencies installation
   - Type checking
   - Linting
   - Local build verification
   - Docker build test

2. **Git Operations:**
   - Commit changes
   - Push to repository

3. **Render Deployment:**
   - Automatic build trigger
   - Docker image creation
   - Service deployment
   - Health check verification

## 📊 Performance Optimizations

### Next.js Configuration
- Standalone output for Docker
- SWC minification
- Package import optimization
- Image optimization (WebP/AVIF)
- Compression enabled

### Docker Optimizations
- Multi-stage build
- Layer caching
- Minimal base image (Alpine)
- Production dependencies only
- Optimized file copying

### Render Configuration
- Auto-scaling based on CPU/Memory
- CDN integration
- Security headers
- Caching strategies

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node.js environment | `production` |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | `1` |
| `PORT` | Application port | `3000` |
| `HOSTNAME` | Bind hostname | `0.0.0.0` |

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Check Docker build locally
   docker build -t weather-dashboard-test .
   
   # Run container locally
   docker run -p 3000:3000 weather-dashboard-test
   ```

2. **Memory Issues:**
   - Upgrade to a higher Render plan
   - Optimize bundle size
   - Check memory usage in health endpoint

3. **Deployment Timeouts:**
   - Check build logs in Render dashboard
   - Verify all dependencies are properly installed
   - Ensure Docker build completes successfully

### Logs and Monitoring

- **Render Dashboard:** View deployment and runtime logs
- **Health Endpoint:** Monitor application status at `/api/health`
- **Docker Logs:** Use `docker logs <container-id>` for local debugging

## 🔄 Updates and Maintenance

### Updating the Application

1. Make your changes locally
2. Test thoroughly
3. Run the deployment script: `./deploy-render.sh`
4. Monitor deployment in Render dashboard

### Scaling

Render automatically scales based on the configuration in `render.yaml`:
- **Min Instances:** 1
- **Max Instances:** 3
- **CPU Threshold:** 70%
- **Memory Threshold:** 70%

## 📞 Support

For deployment issues:

1. Check the [Render Documentation](https://render.com/docs)
2. Review application logs in Render dashboard
3. Test Docker build locally
4. Check health endpoint status

## 🎉 Success!

Once deployed, your Weather Dashboard will be available at:
`https://your-service-name.onrender.com`

The application includes:
- ✅ Interactive weather map
- ✅ Polygon drawing and analysis
- ✅ Real-time data visualization
- ✅ Responsive design
- ✅ Production-ready performance
- ✅ Health monitoring
- ✅ Auto-scaling capabilities

Happy weather tracking! 🌤️
