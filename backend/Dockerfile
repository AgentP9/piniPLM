FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create uploads and data directories
RUN mkdir -p uploads data

# Expose port
EXPOSE 2024

# Start the server
CMD ["npm", "start"]
