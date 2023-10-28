FROM node:14-alpine AS development
ENV NODE_ENV development
# Set the working directory
WORKDIR /app

# Cache and Install dependencies
# Copy the package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .
# Expose port
EXPOSE 3000
# Start the app
CMD [ "npm", "start" ]