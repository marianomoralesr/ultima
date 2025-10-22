ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GIT_COMMIT
ARG VITE_BUILD_DATE
ARG VITE_INTELIMOTOR_BUSINESS_UNIT_ID
ARG VITE_INTELIMOTOR_API_KEY
ARG VITE_INTELIMOTOR_API_SECRET

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy source code
COPY . .

# Copy config file to pages directory
COPY src/config.ts src/pages/config.ts

# Install dependencies
RUN npm install

# Re-declare build args in this stage so they're available as ENV vars during build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GIT_COMMIT
ARG VITE_BUILD_DATE
ARG VITE_INTELIMOTOR_BUSINESS_UNIT_ID
ARG VITE_INTELIMOTOR_API_KEY
ARG VITE_INTELIMOTOR_API_SECRET

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GIT_COMMIT=$VITE_GIT_COMMIT
ENV VITE_BUILD_DATE=$VITE_BUILD_DATE
ENV VITE_INTELIMOTOR_BUSINESS_UNIT_ID=$VITE_INTELIMOTOR_BUSINESS_UNIT_ID
ENV VITE_INTELIMOTOR_API_KEY=$VITE_INTELIMOTOR_API_KEY
ENV VITE_INTELIMOTOR_API_SECRET=$VITE_INTELIMOTOR_API_SECRET

# Build the application with environment variables
RUN npm run build

# Stage 2: Serve the application from a lightweight server
FROM node:18-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server/server.js .
COPY server/package.json .
COPY server/package-lock.json .
COPY server/config.js .

# Install server dependencies
RUN npm install --production

# Expose the port the server will run on
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
