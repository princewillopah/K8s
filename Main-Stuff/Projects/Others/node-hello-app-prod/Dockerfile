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
CMD npm run build



# Stage 2: Serve the app with Nginx
FROM nginx:alpine as production
COPY --from=builder /app /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]