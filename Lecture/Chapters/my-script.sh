#!/bin/bash

# Define an array with folder names
folders=(
    "chapter-10-Install-KubeADM"
    "chapter-11-K8s-Networking"
    "chapter-12-K8s-Advance-Networking"
    "chapter-13-Volume-and-Liveness-Probes"
    "chapter-14-Configs-and-Secrets"
    "chapter-15-K8s-Jobs"
    "chapter-16-K8s-INIT-Container"
    "chapter-17-K8s-Pod-Lifecycle"
    "chapter-18-K8s-Namespace"
    "chapter-19-K8s-Resource-Quota"
    "chapter-20-K8s-Autoscaling"
    "chapter-21-Multi-Clusters-K8s-with-HAPROXY"
    "chapter-22-K8s-Ingress"
    "chapter-23-K8s-Statefulset"
    "chapter-24-K8s-Daemonset"
    "chapter-25-K8s-Polices"
    "chapter-26-K8s-Operators"
    "chapter-27-Helm-and-Helm-Charts"
    "chapter-28-Helm-Project"
    "chapter-29-EKS"
    "chapter-30-AKS"
    "chapter-31-GKE"
    "chapter-32-End-To-End-Kubernetes-Project"
)

# Loop through the array and create folders
for folder in "${folders[@]}"; do
    # Replace "K8s" with "Kubernetes" in the folder name
    folder_name="${folder/K8s/Kubernetes}"
    mkdir -p "$folder_name"
done

echo "Folders created successfully."
