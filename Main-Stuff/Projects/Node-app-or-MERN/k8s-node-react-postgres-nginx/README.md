# Multicontainer application

Codeching - video 9 - Multi container deployment kubernetes | React| Node.js | Postgres | Ingress Nginx | step by step


It contains React client, Node.js backend, PostgreSQL and Nginx

You should install Ingress Nginx with command:
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.46.0/deploy/static/provider/cloud/deploy.yaml

After that you can use the following command to start in main folder:

kubectl apply -f k8s
