# Use the official Nginx image from the Docker Hub
FROM nginx:latest

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files to the default Nginx public directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80
