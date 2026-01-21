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
kubectl apply -f ${current_dir}/_4_jobs/seed-job.yaml 

echo "sleeping for 5 seconds to allow job db-seed to come up"
sleep 5

kubectl apply -f ${current_dir}/_6_backend/deployment.yaml
kubectl apply -f ${current_dir}/_6_backend/service.yaml

echo " "

kubectl apply -f ${current_dir}/_7_frontend/deployment.yaml
kubectl apply -f ${current_dir}/_7_frontend/service.yaml

echo " "
echo "Waiting for about 10 seconds for all pods to be in running state..."
echo " "
sleep 10

echo "------------------------------------------------------------------------" 
echo "All deployed resources status: "
echo "------------------------------------------------------------------------"
 
kubectl get pods -n shopsphere
echo "------------------------------------------------------------------------"
echo " "
echo " ================================================================= "
echo "       Apply Network Policies to restrict traffic flow                "
echo " ================================================================= "
kubectl apply -f ${current_dir}/_8_Network_Polocies/_1_deny-all.yaml
kubectl apply -f ${current_dir}/_8_Network_Polocies/_2_allow-dns-egress.yaml
kubectl apply -f ${current_dir}/_8_Network_Polocies/_3_allow-frontend-policy.yaml 
kubectl apply -f ${current_dir}/_8_Network_Polocies/_4a_allow-backend-policy.yaml
kubectl apply -f ${current_dir}/_8_Network_Polocies/_5a_mongodb-policy.yaml
kubectl apply -f ${current_dir}/_8_Network_Polocies/_7a_db-seed-job.yaml
echo " ================================================================= "
echo " "
echo "------------------------------------------------------------------------" 
echo "All Network Policies applied successfully. Current Network Policies: "
echo "------------------------------------------------------------------------"
kubectl get networkpolicy -n shopsphere
echo "------------------------------------------------------------------------"
echo " "
echo "------------------------------------------------------------------------" 
echo "All deployed resources status: "
echo "------------------------------------------------------------------------"
 
kubectl get pods -n shopsphere
echo "------------------------------------------------------------------------"
echo " "




echo "Shopsphere Ecommerce application deployed successfully!"
echo "You can access the frontend service using port forwarding:"
echo "Run the following command in a separate terminal:"
echo ""
echo "kubectl port-forward -n shopsphere svc/frontend 8080:80"
echo ""
echo "Then open your browser and navigate to: http://localhost:8080" 
echo ""
echo "Test if Network Policies are working as expected by trying to access backend service directly:"
echo "Run the following command in a separate terminal:"
echo ""
echo "kubectl run -n shopsphere test-backend --rm -it --image=busybox -- /bin/sh"
echo ""
echo "Inside the test-backend pod, run:"
echo "wget -qO- http://backend:5000/api/products"
echo ""
echo "You should see a timeout or connection refused message, indicating that the Network Policies are effectively restricting access."
echo ""

# -----------------------------------------------------------------------------
# Note: 
# -----------------------------------------------------------------------------
# 1. Ensure that port 8080 on your local machine is free before running the port-forward command.
# 2. If port 8080 is already in use, you can choose another available port, e.g., 8081, by modifying the command to:  
#    kubectl port-forward -n shopsphere svc/frontend 8081:80
# 3. After changing the port, access the application at http://localhost:8081
# -----------------------------------------------------------------------------
# 	Test Network Policies:
# -----------------------------------------------------------------------------
# 1. From within the frontend pod, try to access the backend service (should succeed
#    Frontend → Backend
# 	kubectl exec  <frontend-pod> -n shopsphere -- curl backend:5000/health
	
# 	Backend → Mongo
# 		kubectl exec <backend-pod> -n shopsphere  -- nc -zv mongo 27017
	
# 	Frontend → Mongo (MUST FAIL)
# kubectl exec -n shopsphere <frontend-pod> -- nc -zv mongo 27017
# -----------------------------------------------------------------------------

# how to confirm with various ways if a particular port is being used
# netstat -tuln | grep 8080
# lsof -i :8080
# ss -tuln | grep 8080


