# Stage 1: Build both frontend and backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install deps separately to leverage Docker cache
COPY backend/package*.json ./backend/
COPY ui/package*.json ./ui/

# Install backend and frontend deps
RUN npm --prefix backend install
RUN npm --prefix ui install

# Copy source files
COPY backend ./backend
COPY ui ./ui

# Build frontend
RUN npm --prefix ui run build

# Stage 2: Create a minimal image with build artifacts
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy built backend and frontend into /app
COPY --from=builder /app/backend ./backend

# Set NODE_ENV
ENV NODE_ENV=production

# Expose port
EXPOSE 5000


