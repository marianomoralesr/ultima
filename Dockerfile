# ---------- Stage 1: Build the frontend ----------
FROM node:22 AS builder
WORKDIR /app

# Build args for Vite (used to replace VITE_* in frontend build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_VERSION=dev

COPY package*.json ./
RUN npm ci
COPY . .

# Build frontend using build args
RUN VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    npm run build

# ---------- Stage 2: Production server ----------
FROM node:22
WORKDIR /workspace

# Copy server dependencies and install production-only packages
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server files
COPY server/server.js ./server/
COPY server/config.js ./server/
# COPY server/syncAirtableData.cjs ./server/

# Copy frontend build outside server folder
COPY --from=builder /app/dist ./dist

# Expose port and set Node environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start Express server
CMD ["node", "server/server.js"]