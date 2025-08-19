# Dockerfile for Next.js Application

# 1. Builder Stage: Build the Next.js app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
# Use --frozen-lockfile if you have a package-lock.json for reproducible builds
RUN npm install

# Copy the rest of the application source code
COPY . .

# Set build-time arguments for MongoDB
ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI

ARG MONGODB_DB
ENV MONGODB_DB=$MONGODB_DB

# Build the Next.js application for production
RUN npm run build

# 2. Runner Stage: Create the final production image
FROM node:18-alpine AS runner

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts


# Set environment variables for production
ENV NODE_ENV=production

# The default Next.js port is 3000, but our start script uses 9002.
# We will expose port 3000 as is standard.
EXPOSE 3000

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# The command to start the app. 
# `next start` will use the port from the .env file or default to 3000.
CMD ["npm", "start"]
