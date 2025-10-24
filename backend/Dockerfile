# DexProtector Cloud Run Container
# Uses libfaketime to set system time to Feb 1, 2025 for DexProtector license

FROM eclipse-temurin:17-jre-jammy

# Install required dependencies
RUN apt-get update && apt-get install -y \
    faketime \
    unzip \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy DexProtector jar (will be provided by user)
COPY dexprotector.jar /app/dexprotector.jar

# Copy Node.js processing server
COPY package*.json ./
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/

# Set environment variables for libfaketime
ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/faketime/libfaketime.so.1
ENV FAKETIME="2025-02-01 00:00:00"
ENV FAKETIME_NO_CACHE=1

# Create temp directories
RUN mkdir -p /tmp/uploads /tmp/outputs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port for Cloud Run
EXPOSE 8080

# Run the processing server
CMD ["node", "src/index.js"]
