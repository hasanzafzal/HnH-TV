# ============================================
# HnH-TV Backend + Frontend (Multi-stage build)
# Stage 1: Build React frontend
# Stage 2: Run Express backend + serve static build
# ============================================

# --- Stage 1: Build the React frontend ---
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files and install deps
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy frontend source and build
COPY frontend/ ./
ENV REACT_APP_NODE_ENV=production
RUN npm run build


# --- Stage 2: Production backend ---
FROM node:20-slim

# Install ffmpeg + ffprobe for video transcoding
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files and install production deps
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && (npm ci --omit=dev --legacy-peer-deps 2>/dev/null || npm install --omit=dev --legacy-peer-deps)

# Copy backend source code
COPY backend/config ./backend/config
COPY backend/models ./backend/models
COPY backend/seeds ./backend/seeds
COPY backend/src ./backend/src
COPY backend/createAdmin.js ./backend/

# Copy the built React frontend from stage 1
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:5000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "backend/src/server.js"]
