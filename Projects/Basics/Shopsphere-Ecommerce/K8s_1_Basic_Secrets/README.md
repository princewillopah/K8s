### Run the k8s resources in this order:
- kubectl create namespace shopsohere
- kubectl apply -f configs/configmap.yaml
- kubectl apply -f configs/secrets.yaml

<br/>

- kubectl apply -f mongodb/statefulset.yaml
- kubectl apply -f mongodb/service.yaml

<br/>

- kubectl apply -f mongo-express/deployment.yaml
- kubectl apply -f mongo-express/service.yaml - `Confirm that mongo pod is running`

<br/>

- kubectl apply -f jobs/seed-job.yaml - `Wait for seed job to complete`
- kubectl apply -f backend/deployment.yaml
- kubectl apply -f backend/service.yaml

<br>

- kubectl apply -f frontend/deployment.yaml
- kubectl apply -f frontend/service.yaml

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