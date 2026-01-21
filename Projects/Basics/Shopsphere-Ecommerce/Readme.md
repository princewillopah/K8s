
docker build -t princewillopah2/mern-gateway:1.0.2 ./gateway && docker push princewillopah2/mern-gateway:1.0.2

docker build -t princewillopah2/mern-auth:1.0.2 ./services/auth && docker push princewillopah2/mern-auth:1.0.2

docker build -t princewillopah2/mern-product:1.0.2 ./services/product  && docker push princewillopah2/mern-product:1.0.2

docker build -t princewillopah2/mern-cart:1.0.2 ./services/cart && docker push princewillopah2/mern-cart:1.0.2

docker build -t princewillopah2/mern-order:1.0.2 ./services/order && docker push princewillopah2/mern-order:1.0.2

docker build -t princewillopah2/mern-frontend:1.0.3 ./frontend && docker push princewillopah2/mern-frontend:1.0.3




kubectl apply -f k8s/namespaces.yaml

kubectl apply -f k8s/mongo-auth.yaml && \
kubectl apply -f k8s/mongo-product.yaml && \
kubectl apply -f k8s/mongo-cart.yaml && \
kubectl apply -f k8s/mongo-order.yaml

kubectl get pods -n sc

kubectl apply -f k8s/secrets.yaml && \
kubectl apply -f k8s/gateway-deploy.yaml && \
kubectl apply -f k8s/auth-deploy.yaml && \
kubectl apply -f k8s/product-deploy.yaml && \
kubectl apply -f k8s/cart-deploy.yaml && \
kubectl apply -f k8s/order-deploy.yaml && \
kubectl apply -f k8s/frontend-deploy.yaml


kubectl get pods -n sc
kubectl get svc -n sc
kga -n sc
kubectl config set-context --current --namespace=default
kubectl get all -n sc
kubectl get all,cm,secret  -n sc
k get all,secret,cm,pvc,pv,secretstore,externalsecret -n shopsphere
kubectl port-forward -n shopsphere svc/frontend 8080:80

kubectl describe -n sc pod/auth-7cf79958bd-rjjs6  
kubectl describe -n sc pod/cart-dbff88f98-ftg4v
kubectl describe -n sc pod/frontend-f8f767b9c-8k2z2
kubectl describe -n sc pod/order-54bdb567d7-qvgn7
kubectl describe -n sc pod/product-85d79955fd-grwz9


kubectl delete pod -l app=auth -n sc && \
kubectl delete pod -l app=product -n sc && \
kubectl delete pod -l app=cart -n sc && \
kubectl delete pod -l app=order -n sc && \
kubectl delete pod -l app=frontend -n sc

-------------------------------------

kubectl delete all --all -n shopsphere
kubectl delete pvc --all -n shopsphere
kubectl delete secret --all -n shopsphere
kubectl delete cm --all -n shopsphere

-------------------------------------
helm list -A
helm list -n shopsphere
Re-render: helm template shopsphere . -n shopsphere --debug
helm upgrade --install shopsphere . -n shopsphere
helm upgrade shopsphere . -n shopsphere
helm uninstall shopsphere -n shopsphere


------------------------------------
docker builder prune -f

kubectl exec -it pod/mongo-0  -n shopsphere -- bash
mongosh -u admin -p admin12345 
use myappdb
db.users.insertOne({ name: "Princewill", role: "DevOps Engineer", date: new Date() })
db.users.find().pretty()

touch templates/{namespace.yaml,backend-deployment.yam,backend-service.yaml,frontend-deployment.yaml,frontend-service.yaml,mongo-statefulset.yaml,mongo-express-deployment.yaml,mongo-service.yaml,mongo-express-service.yaml,db-seed-job.yaml,configmaps.yaml,externalsecrets.yaml,helpers.tpl}