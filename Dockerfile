ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GIT_COMMIT
ARG VITE_BUILD_DATE

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy source code
COPY . .

# Install dependencies
RUN npm install

# Build the application, passing in the build arguments
RUN npm run build

# Stage 2: Serve the application from a lightweight server
FROM node:18-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server.js .
COPY package.json .
COPY package-lock.json .

# Install server dependencies
RUN npm install --production

# Expose the port the server will run on
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]