# ShopShere v4

  * [Key Features](#key-features)
      - [Secrets Manager for secrets](#frontend)
      - [Zero-trust Kubernetes NetworkPolicy](#backend)
      <!-- - [Database](#database) -->
  * [Technologies used](#technologies-used)
      - [AWS Secrets Manager to handle the secrets](#frontend)
 


 ### Setups STEPS


Create namespace
    ```
        kubectl create namespace shopsphere
    ```


<h5 style="color: pink;">Store AWS Access key and secret key as kubernetes secret in the cluster namespace <span style="color:teal;font-weight: 800">shopsphere<span/> </h5>


```
kubectl create secret generic aws-creds \
  -n shopsphere \
  --from-literal=my-access-key=AKIAQHYZWNHQH7ZCCSMH\
  --from-literal=my-secret-access-key=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
```

Verify:
```
kubectl describe secret aws-creds -n shopsphere 
```

Output: 

![img-1](./Readme-Files/aws-secrets.png)



### Run the k8s resources in this order:

- kubectl apply -f secretstore.yaml

- kubectl apply -f _1_secret_configs/mongo-external-secret.yaml
- kubectl apply -f _1_secret_configs/backend-external-secret.yaml

<br/>

`Confirm that secretstore, externalsecret are ready and secrets in AWS Are available via  externalsecret`
- kubectl get secretstore -n shopsphere
- kubectl get externalsecret -n shopsphere
- kubectl get secret -n shopsphere

![img-1](./Readme-Files/secret.png)


<br/>

`Continue with the rest of the commands to deploy the app in the order below`
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
- kubectl apply -f _5_mongo-express/service.yaml

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
- kubectl port-forward -n shopsphere svc/frontend 8080:80
- http://localhost:8080



<!-- ## Or this way below

- kubectl apply -f k8s/namespace.yaml
- kubectl apply -f k8s/configs/
- kubectl apply -f k8s/mongodb/
- kubectl apply -f k8s/jobs/seed-job.yaml - `Wait for seed job to complete`
- kubectl wait --for=condition=complete job/seed-database -n shopsohere --timeout=300s
- kubectl apply -f k8s/backend/
- kubectl apply -f k8s/frontend/
- kubectl apply -f k8s/mongo-express/
- kubectl apply -f k8s/frontend/ingress.yaml -->



## Implementing Network Policies 

Confirm you have the following Labels 
```
app=frontend
app=backend
app=mongo
app=mongo-express
```
- kubectl get pods -n shopsphere --show-labels


- kubectl apply -f _8_Network_Polocies/_1_deny-all.yaml
- kubectl apply -f _8_Network_Polocies/_2_allow-dns-egress.yaml
- kubectl apply -f _8_Network_Polocies/_3_allow-frontend-policy.yaml
- kubectl apply -f _8_Network_Polocies/_3_allow-frontend-backend.yaml