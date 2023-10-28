FROM node:14-alpine AS builder
ENV NODE_ENV production
# Set the working directory
WORKDIR /app

# Cache and Install dependencies
# Copy the package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install  --production

# Copy the rest of the application code
COPY . .

# Build the React.js application
RUN npm run build


# Use Nginx to serve the built React.js application
# Bundle static assets with nginx
FROM nginx:1.21.0-alpine as production
ENV NODE_ENV production
# Copy built assets from builder to the /usr/share/nginx/html of the nginx image/container
COPY --from=builder /app/build /usr/share/nginx/html
# Add your nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]