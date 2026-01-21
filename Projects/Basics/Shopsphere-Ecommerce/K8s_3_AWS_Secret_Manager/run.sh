#!/bin/bash

# This script deploys the Shopsphere Ecommerce application on a Kubernetes cluster
# using AWS Secret Manager for managing sensitive information.

## Apply the Kubernetes manifests
kubectl create namespace shopsphere

kubectl create secret generic aws-creds \
  -n shopsphere \
  --from-literal=my-access-key=AKIAQHYZWNHQH7ZCCSMH\
  --from-literal=my-secret-access-key=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

echo " "
current_dir=$(pwd)

kubectl apply -f ${current_dir}/_1_secret_configs/aws-cred-secretstore.yaml 
kubectl apply -f ${current_dir}/_1_secret_configs/backend-external-secret.yaml
kubectl apply -f ${current_dir}/_1_secret_configs/mongo-external-secret.yaml

echo " "
echo "Confirming that secretstore, externalsecret are ready and secrets in AWS Are available via  externalsecret"
kubectl get secretstore -n shopsphere
kubectl get externalsecret -n shopsphere
kubectl get secret -n shopsphere

echo " "
kubectl apply -f ${current_dir}/_2_configs/configmap.yaml


echo " "
kubectl apply -f_3_mongodb/statefulset.yaml
kubectl apply -f ${current_dir}/_3_mongodb/service.yaml

echo " "
echo "sleeping for 5 seconds to allow mongodb to come up"
sleep 5
echo " "
kubectl apply -f ${current_dir}/_5_mongo-express/deployment.yaml
kubectl apply -f ${current_dir}/_5_mongo-express/service.yaml


echo " "
kubectl apply -f ${current_dir}/_4_jobs/seed-job.yaml 

echo "sleeping for 5 seconds to allow job db-seed to come up"
sleep 5

kubectl apply -f ${current_dir}/_6_backend/deployment.yaml
kubectl apply -f ${current_dir}/_6_backend/service.yaml

echo " "

kubectl apply -f ${current_dir}/_7_frontend/deployment.yaml
kubectl apply -f ${current_dir}/_7_frontend/service.yaml

echo " "
sleep 30

kubectl get pods -n shopsphere
echo " "
echo "Shopsphere Ecommerce application deployed successfully!"
echo "You can access the frontend service using port forwarding:"
echo "Run the following command in a separate terminal:"
echo ""
echo "kubectl port-forward -n shopsphere svc/frontend 8080:80"
echo ""
echo "Then open your browser and navigate to: http://localhost:8080" 

