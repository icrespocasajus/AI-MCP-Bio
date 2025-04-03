FROM ubuntu:22.04

# Set environment variables to avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js and required dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    make \
    g++ \
    bash \
    tar \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build TypeScript code
RUN npm run build

# Create directory for boolSim
RUN mkdir -p /opt/boolSim

# Copy and extract boolSim
COPY boolSim/boolSim-1.1.0-Linux-libc2.12.tar /opt/boolSim/
RUN tar -xf /opt/boolSim/boolSim-1.1.0-Linux-libc2.12.tar -C /opt/boolSim/ && \
    rm /opt/boolSim/boolSim-1.1.0-Linux-libc2.12.tar \
    && chmod +x /opt/boolSim/boolSim-1.1.0-Linux/bin/boolSim \
    && chmod +x /opt/boolSim/boolSim-1.1.0-Linux/bin/boolSim_setutils

# Add boolSim to PATH
ENV PATH="/opt/boolSim/boolSim-1.1.0-Linux/bin:${PATH}"

# Verify boolSim installation
RUN boolSim --help || echo "Warning: boolSim installation may need to be configured manually"

# Set the port environment variable
ENV PORT=3050

# Expose the port for the MCP server
EXPOSE 3050

# Start the server
CMD ["npm", "start"] 