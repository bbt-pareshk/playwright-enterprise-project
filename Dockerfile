# Playwright Test Automation Dockerfile
FROM mcr.microsoft.com/playwright:v1.57.0-noble

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

RUN npx playwright install --with-deps

# Copy test files and configuration
COPY . .

# Set environment variables for CI
ENV CI=true
ENV PWDEBUG=0

# Default command - can be overridden in docker-compose
CMD ["npx", "playwright", "test"]