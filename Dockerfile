# Dockerfile for React Native/Expo development (mobile only)
FROM node:20-alpine

# Install system dependencies for React Native
RUN apk add --no-cache \
    git \
    bash \
    curl \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Install global dependencies
RUN npm install -g @expo/cli@latest

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactnative -u 1001

# Copy only mobile and shared package files
COPY frontend-mobile/package*.json ./frontend-mobile/
COPY frontend-shared/package*.json ./frontend-shared/

# Install mobile dependencies
RUN cd frontend-mobile && npm install
RUN cd frontend-shared && npm install

# Copy source code for mobile and shared
COPY frontend-mobile ./frontend-mobile/
COPY frontend-shared ./frontend-shared/

# Change ownership to non-root user
RUN chown -R reactnative:nodejs /app
USER reactnative

# Expose Expo dev server port
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Set working directory to mobile
WORKDIR /app/frontend-mobile

# Default command
CMD ["npm", "start"]