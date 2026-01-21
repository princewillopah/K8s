# The version of the app made use of the AWS Secrets Manager to handle the secrets



### Run the k8s resources in this order:
- kubectl create namespace shopsohere
- kubectl apply -f _1_secret_configs/aws-cred-secretstore.yaml

- kubectl apply -f _1_secret_configs/mongo-external-secret.yaml
- kubectl apply -f _1_secret_configs/backend-external-secret.yaml

<br/>

- kubectl apply -f _2_configs/configmap.yaml

<br/>

- kubectl apply -f_3_mongodb/statefulset.yaml
- kubectl apply -f _3_mongodb/service.yaml

<br/>

`Confirm that mongo pod is running`
- kubectl get pods -n shopsphere

<br/>

- kubectl apply -f _5_mongo-express/deployment.yaml
- kubectl apply -f _5_mongo-express/service.yaml - `Confirm that mongo pod is running`

<br/>

- kubectl apply -f _4_jobs/seed-job.yaml - `Wait for seed job to complete`


<br/>

`Confirm that mongo pod is running`
- kubectl get pods -n shopsphere

<br/>

- kubectl apply -f _6_backend/deployment.yaml
- kubectl apply -f _6_backend/service.yaml

<br>

- kubectl apply -f _7_frontend/deployment.yaml
- kubectl apply -f _7_frontend/service.yaml

<br/>

- kubectl get pods -n shopsphere
- kubectl port-forward -n shopsohere svc/frontend 8080:80
- http://localhost:8080



## Or this way below

- kubectl apply -f k8s/namespace.yaml
- kubectl apply -f k8s/configs/
- kubectl apply -f k8s/mongodb/
- kubectl apply -f k8s/jobs/seed-job.yaml - `Wait for seed job to complete`
- kubectl wait --for=condition=complete job/seed-database -n shopsohere --timeout=300s
- kubectl apply -f k8s/backend/
- kubectl apply -f k8s/frontend/
- kubectl apply -f k8s/mongo-express/
- kubectl apply -f k8s/frontend/ingress.yaml



## Other Useful Bootstraping Command
