# Main Application Dockerfile (Development)
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma and healthcheck
RUN apk add --no-cache wget openssl libc6-compat

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run migrations and start in development mode
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev -- --host 0.0.0.0"]
