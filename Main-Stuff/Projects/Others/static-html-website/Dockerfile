# Use a lightweight web server as the base image
FROM nginx:alpine

# Copy the entire website content in this host directory to the container
COPY . /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

# Start the nginx server
CMD ["nginx", "-g", "daemon off;"]