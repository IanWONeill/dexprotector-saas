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

# Copy DexProtector jar and license file (will be provided by user)
COPY dexprotector.jar /app/dexprotector.jar
COPY dexprotector.licel /app/dexprotector.licel

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Node.js processing server
COPY package*.json ./
RUN npm install --only=production

# Copy application code
COPY src/ ./src/

# DO NOT set LD_PRELOAD globally - it breaks Node.js networking!
# Instead, we'll use faketime only when calling Java commands

# Create temp directories
RUN mkdir -p /tmp/uploads /tmp/outputs

# Verify Java and dependencies are installed
RUN java -version && node --version && npm --version

# Expose port for Cloud Run
EXPOSE 8080

# Run the processing server WITHOUT faketime
# (faketime will be applied only to Java subprocess in processor.js)
CMD ["node", "src/index.js"]
