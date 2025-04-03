FROM ubuntu:22.04

# Install required dependencies for building
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    make \
    g++ \
    nodejs \
    npm

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
    rm /opt/boolSim/boolSim-1.1.0-Linux-libc2.12.tar

# Add boolSim to PATH
ENV PATH="/opt/boolSim/boolSim-1.1.0-Linux/bin:${PATH}"

# Verify boolSim installation
RUN boolSim --help || echo "Warning: boolSim installation may need to be configured manually"

# Set the port environment variable
ENV PORT=3001

# Expose the port for the MCP server
EXPOSE 3001

# Start the server
CMD ["npm", "start"] 