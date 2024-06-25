# static site structure 
my-website/
├── Dockerfile
├── index.html
├── about.html
├── contact.html
├── styles.css
├── nginx.conf
├── deployment.yaml
└── service.yaml

#  Build the Docker Image & 
docker build -t princewillopah/nginx-test-ecommerce:v1 .


# Run the Docker Container
docker run -d -p 80:80 princewillopah/nginx-test-ecommerce:v1
# Verify
Open your web browser and navigate to http://localhost to see your website running.

# push to dockerhub
docker push princewillopah/nginx-test-ecommerce:v1 


# create ns my-ingress-examples
  k create ns my-ingress-examples

# Apply the Deployment
kubectl apply -f deployment.yaml -n my-ingress-examples

# Apply the Service:
 kubectl apply -f service.yaml -n my-ingress-examples

# confirm pods/services are running 
 kubectl get all  -n my-ingress-examples
# forward traffic to 3000 to forward it to service at 80
kubectl port-forward --address 0.0.0.0 service/nginx-website-service 3000:80 -n my-ingress-examples



Summary
- HTML and CSS files: Define your webpage content and styles.
- Nginx configuration file: Customizes the Nginx server settings.
- Dockerfile: Sets up the Docker image using Nginx and your website files.
- Docker commands: Build and run the Docker container to serve your website.
This setup will serve your static website using Nginx inside a Docker container.