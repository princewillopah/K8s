# Day 17: Mastering Node Selector & Node Affinity Rules in Kubernetes | CKA Course 2025

## Video reference for Day 17 is the following:

[![Watch the video](https://img.youtube.com/vi/vaW2pwSXdb4/maxresdefault.jpg)](https://www.youtube.com/watch?v=vaW2pwSXdb4&ab_channel=CloudWithVarJosh)

---
## ⭐ Support the Project  
If this **repository** helps you, give it a ⭐ to show your support and help others discover it! 

---

## Table of Contents  

- [Introduction](#introduction)  
- [Node Placement Strategies](#node-placement-strategies)  
- [Understanding Node Selector](#understanding-node-selector) 
- [Limitations of Node Selector](#limitations-of-node-selector)  
- [Cluster Setup for Demonstration](#cluster-setup-for-demonstration)  
- [Demonstration: Node Selector](#demonstration-node-selector)  
- [Key Takeaways for `nodeSelector`](#key-takeaways-for-nodeselector)  
- [Node Affinity in Kubernetes](#node-affinity-in-kubernetes)  
- [Types of Node Affinity](#types-of-node-affinity)  
- [Demo: Node Affinity](#demo-node-affinity)  
- [OR Condition (Multiple Label Matches)](#or-condition-multiple-label-matches)  
- [AND Condition (Multiple Label Requirements)](#and-condition-multiple-label-requirements)   
- [Node Affinity Operators](#node-affinity-operators)  
- [Node Anti-Affinity](#node-anti-affinity)  
- [Summary](#summary)  
- [Understanding `preferredDuringSchedulingIgnoredDuringExecution`](#understanding-preferredduringschedulingignoredduringexecution)  
- [Demonstration: Using Preferred Node Affinity](#demonstration-using-preferred-node-affinity)   
- [Key Considerations](#key-considerations)  
- [Node Affinity, `nodeSelector`, and Taints & Tolerations](#node-affinity-nodeselector-and-taints--tolerations)  
- [References](#references)  


---

## Introduction  

In Kubernetes, scheduling decisions determine where a pod runs within the cluster. While Kubernetes has a built-in **scheduler** that automatically assigns pods to nodes, administrators often need to influence **scheduling decisions** to ensure specific workloads run on designated nodes.

To achieve this, Kubernetes provides **label-based scheduling techniques** such as:  
- **Node Selector** (Basic)  
- **Node Affinity and Anti-Affinity** (Advanced)  

This session focuses on **Node Selector**, its **advantages, limitations**, and how it compares to **Node Affinity**.

---

## Node Placement Strategies  

Pods can be scheduled onto specific nodes using **labels** and **selectors**. This ensures:  
- Workloads are placed on **nodes with required hardware** (e.g., GPUs, SSDs).  
- Applications are **isolated by environment** (e.g., prod, staging, production).  
- Compliance with **resource constraints** (e.g., memory, CPU).  

To implement this, Kubernetes offers **two main approaches**:  
1. **Node Selector** - Assigns pods to nodes based on simple **key-value labels**.  
2. **Node Affinity** - Provides more flexibility, including **soft preferences** and **multiple conditions**.  

---

# Understanding Node Selector  

`nodeSelector` is the **simplest way** to assign a pod to a node based on **labels**.  

- **Nodes must have specific labels** for the pod to be scheduled.  
- **If no node matches the label**, the pod remains in a **Pending** state.  
- **Only supports exact key-value matching** (no advanced logic).  

### How It Works  

1. **Assign labels to nodes**  
   ```sh
   kubectl label nodes <node-name> <label-key>=<label-value>
   ```
2. **Define a `nodeSelector` in the pod spec**  
   ```yaml
   nodeSelector:
     key: value
   ```
3. **Pods are scheduled only on nodes matching the label**  

---

## Limitations of Node Selector  

| Limitation | Explanation |
|------------|------------|
| **Strict Placement** | If no node matches the label, the pod remains in the **Pending** state. |
| **No Preferences** | It does not allow "soft" preferences—either a node matches or it does not. |
| **No OR Condition** | You cannot specify "schedule on nodes with `storage=ssd` OR `storage=hdd`". |

For more **advanced** scheduling needs, **Node Affinity** provides a more flexible alternative.

---

### **Cluster Setup for Demonstration**  

Before we begin our demonstration of **Node Selectors, Node Affinity and Node Anti-Affinity**, let's first review our Kubernetes cluster setup. We have a total of **three nodes** in our KIND cluster:  

1. **my-second-cluster-control-plane** → This is the **control-plane node** responsible for managing the cluster.  
2. **my-second-cluster-worker** → This is a **worker node** where application workloads can be scheduled.  
3. **my-second-cluster-worker2** → This is another **worker node** available for scheduling workloads. 

---

## Demonstration: Node Selector  

### Step 1: Check Existing Labels on Nodes  

```sh
kubectl get nodes --show-labels
kubectl describe node my-second-cluster-worker
```

This will display all the labels assigned to the nodes.

---

### Step 2: Label a Node  

```sh
kubectl label nodes my-second-cluster-worker storage=ssd
```

This assigns the label **storage=ssd** to `my-second-cluster-worker`.

---

### Step 3: Deploy a Pod with `nodeSelector`  

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ns-deploy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app1
  template:
    metadata:
      labels:
        app: app1
    spec:
      nodeSelector:
        storage: ssd
      containers:
        - name: nginx
          image: nginx
```

- **Pods will only be scheduled on `my-second-cluster-worker`** because it has the label `storage=ssd`.  
- **If no node has `storage=ssd`, the pods remain in the `Pending` state**.  

---

### Step 4: Add Multiple Labels to a Node  

A node can have **multiple labels**. A pod will only be scheduled if **all labels in `nodeSelector` match**.  

#### Label the node with an additional label:  
```sh
kubectl label nodes my-second-cluster-worker env=prod
```

#### Modify the pod spec to require multiple labels:  

```yaml
nodeSelector:
  storage: ssd
  env: prod
```

✔️ The pod will **only be scheduled** if a node has **both** `storage=ssd` and `env=prod`.  
❌ If no such node exists, the pod will **remain in Pending state**.  

---

### Step 5: Removing Labels  

To remove a label from a node:  

```sh
kubectl label nodes my-second-cluster-worker storage-
```

This removes the **storage=ssd** label.  

After this, **any pods with `nodeSelector: { storage: ssd }` will not be scheduled**.

---

## Key Takeaways for `nodeSelector` 

✔️ **Node Selector** is a simple, strict way to assign pods to nodes.  
✔️ **Pods are only scheduled if a node has all required labels**.  
✔️ **Lack of flexibility** makes it unsuitable for complex scheduling needs.  
✔️ **Node Affinity** is the advanced alternative with more features.

---

## Node Affinity in Kubernetes  

`nodeAffinity` is an advanced version of `nodeSelector` that provides more flexibility in **scheduling** pods onto specific nodes.  

- It allows **hard constraints** (must match) and **soft preferences** (prefer but not mandatory).  
- It enables complex **AND/OR conditions** for node selection.  
- It supports **set-based expressions** (`In`, `NotIn`, `Exists`, etc.), unlike `nodeSelector`.  

---

## Types of Node Affinity  

| **Type** | **Behavior** |
|----------|-------------|
| `requiredDuringSchedulingIgnoredDuringExecution` | **Hard rule** – The pod will only be scheduled on matching nodes. If no matching node exists, the pod stays in **Pending state**. |
| `preferredDuringSchedulingIgnoredDuringExecution` | **Soft rule** – The pod will **prefer** matching nodes but can be scheduled elsewhere if needed. |

**IgnoredDuringExecution** means that **if the node’s labels change after scheduling, the pod will continue running** on that node.

---

## Demo: Node Affinity  

### Step 1: Label a Node  

```sh
kubectl label nodes my-second-cluster-worker storage=ssd
```

This assigns the label **storage=ssd** to `my-second-cluster-worker`.

---

### Step 2: Deploy a Pod with Required Node Affinity  

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: na-deploy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app1
  template:
    metadata:
      labels:
        app: app1
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: storage
                operator: In
                values:
                  - ssd
      containers:
        - name: nginx
          image: nginx
```

### Expected Behavior  

- Pods will **only be scheduled on nodes with `storage=ssd`**.  
- If no node has `storage=ssd`, the pod **remains in Pending state**.  

This behaves **similarly to `nodeSelector`**, but **nodeAffinity supports complex conditions**.

📌 **More on Set-Based Selectors:** [Day 10 - ReplicaSet](https://github.com/CloudWithVarJosh/CKA-Certification-Course-2025/tree/main/Day%2010#3-replicaset-rs)

---

## OR Condition (Multiple Label Matches)  

If we want to **allow scheduling on nodes with either `storage=ssd` or `storage=hdd`**, we use **OR logic** with `In`.  

### Step 1: Label a Second Node  

```sh
kubectl label nodes my-second-cluster-worker2 storage=hdd
```

### Step 2: Update Node Affinity to Allow Either SSD or HDD  

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: storage
          operator: In
          values:
            - ssd
            - hdd
```

### Expected Behavior  

- Pods **can be scheduled on**:  
  ✅ `my-second-cluster-worker` (**storage=ssd**)  
  ✅ `my-second-cluster-worker2` (**storage=hdd**)  

---

## AND Condition (Multiple Label Requirements)  

To schedule **only on nodes that have BOTH `storage=ssd` AND `env=prod`**, we use multiple `matchExpressions`.  

### Step 1: Label a Node  

```sh
kubectl label nodes my-second-cluster-worker env=prod
```

### Step 2: Apply AND Condition  

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: storage
          operator: In
          values:
            - ssd
        - key: env
          operator: In
          values:
            - prod
```

### Expected Behavior  

- Pods will **only be scheduled on nodes that have both `storage=ssd` and `env=prod`**.  
- If no node has both labels, **the pod stays in Pending state**.  

---

## Node Affinity Operators  

| **Operator** | **Behavior** |
|-------------|-------------|
| `In` | Matches if the node’s label **exists in the provided values**. |
| `NotIn` | Matches if the node’s label **does not exist in the provided values**. |
| `Exists` | Matches if the node **has the specified key**, regardless of its value. |
| `DoesNotExist` | Matches if the node **does not have the specified key**. |
| `Gt` | Matches if the label’s **value is greater than the specified number**. |
| `Lt` | Matches if the label’s **value is less than the specified number**. |

### Example: Using All Operators  

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: storage
          operator: In
          values:
            - ssd
            - hdd
        - key: env
          operator: NotIn
          values:
            - dev
        - key: high-memory
          operator: Exists
        - key: dedicated
          operator: DoesNotExist
        - key: cpu
          operator: Gt
          values:
            - "4"
        - key: disk
          operator: Lt
          values:
            - "500"
```

### Explanation  

| **Condition** | **Effect** |
|--------------|-----------|
| `storage In (ssd, hdd)` | ✅ Pod can be scheduled if the node has **storage=ssd OR storage=hdd**. |
| `env NotIn (dev)` | ✅ Pod is **not scheduled on nodes labeled `env=dev`**. |
| `high-memory Exists` | ✅ Pod can be scheduled **only on nodes that have a `high-memory` label**. |
| `dedicated DoesNotExist` | ✅ Pod **avoids nodes with `dedicated` label**. |
| `cpu Gt 4` | ✅ Pod can be scheduled **only on nodes with CPU > 4**. |
| `disk Lt 500` | ✅ Pod can be scheduled **only on nodes with disk < 500**. |

---

## Node Anti-Affinity  

- `NotIn` and `DoesNotExist` can **prevent pods from running on specific nodes**.  
- **Alternative:** Use **taints and tolerations** to **repel pods** from certain nodes.  

---

## Summary  
✔️ **Node Affinity is more flexible than `nodeSelector`**.  
✔️ **Supports AND/OR conditions using `matchExpressions`**.  
✔️ **Allows both strict (`requiredDuringSchedulingIgnoredDuringExecution`) and soft (`preferredDuringSchedulingIgnoredDuringExecution`) rules**.  
✔️ **Use `NotIn` and `DoesNotExist` for anti-affinity behavior**.  

---

## Understanding `preferredDuringSchedulingIgnoredDuringExecution`  

`preferredDuringSchedulingIgnoredDuringExecution` allows you to **influence** pod placement without enforcing strict scheduling rules.  

- The **scheduler prefers nodes** that match the preference but **can place pods elsewhere if needed**.  
- Nodes are assigned **weights** that determine their preference level.  
- The **higher the weight, the stronger the preference** for scheduling on that node.  

### **How Node Affinity Weight Works**  

1. The **scheduler finds all nodes** that satisfy the `requiredDuringSchedulingIgnoredDuringExecution` rule.  
2. It then **evaluates each preferred rule** (`preferredDuringSchedulingIgnoredDuringExecution`) and **adds the node's weight to a sum**.  
3. The **node with the highest final score is preferred**, but **other scheduling factors still apply**.  

---

## Demonstration: Using Preferred Node Affinity  

### Step 1: Apply Labels to Nodes  

We need to ensure our worker nodes have labels for **storage type**.  

```sh
kubectl label nodes my-second-cluster-worker storage=ssd
kubectl label nodes my-second-cluster-worker2 storage=hdd
```

---

### Step 2: Define Node Affinity with Preferences  

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: preferred-na-deploy
spec:
  replicas: 5
  selector:
    matchLabels:
      app: app1
  template:
    metadata:
      labels:
        app: app1
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: storage
                operator: In
                values:
                  - ssd
                  - hdd
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 10
              preference:
                matchExpressions:
                  - key: storage
                    operator: In
                    values:
                      - ssd
            - weight: 5
              preference:
                matchExpressions:
                  - key: storage
                    operator: In
                    values:
                      - hdd
      containers:
        - name: nginx
          image: nginx
```

### Explanation  

- The **pod is required** to run on nodes labeled **storage=ssd OR storage=hdd** (hard rule).  
- The **scheduler prefers `storage=ssd` nodes** (higher weight: `10`).  
- The **scheduler prefers `storage=hdd` nodes** slightly less (lower weight: `5`).  

---

### Step 3: Deploy and Observe Pod Placement  

```sh
kubectl apply -f preferred-na-deploy.yaml
kubectl get pods -o wide
```

### Expected Behavior  

- Pods **prefer `my-second-cluster-worker` (storage=ssd) over `my-second-cluster-worker2` (storage=hdd)**.  
- If there are **not enough resources on `my-second-cluster-worker`**, some pods may be placed on `my-second-cluster-worker2`.  
- Increasing **replica count** makes the preference **more noticeable**.  

---

## Key Considerations  

- **Weight only influences placement; it does not guarantee it.**  
- **Pods may still be placed on lower-weight nodes** if the preferred nodes **lack resources**.  
- Other scheduling factors **still apply**, such as:  
  - Available CPU & memory on each node.  
  - Other affinity/anti-affinity rules.  
  - Taints & tolerations.  

📌 Use **`requiredDuringSchedulingIgnoredDuringExecution`** for strict placement rules, and **`preferredDuringSchedulingIgnoredDuringExecution`** for weighted preferences.

---

 



## Node Affinity, `nodeSelector`, and Taints & Tolerations

### Node Affinity (`nodeSelector`, `preferredDuringSchedulingIgnoredDuringExecution`)

- `nodeSelector` is **not retroactive**—it only applies during scheduling.  
- `preferredDuringSchedulingIgnoredDuringExecution` means that once a pod is scheduled, it **won't be re-evaluated** if the node's labels change.  
- **Node affinity behaves the same way**—if a node’s labels change after scheduling, pods will **not be evicted or rescheduled** automatically.

### Behavior of `nodeSelector`

`nodeSelector` is **not retroactive**. If you modify a node's labels **after** a pod has already been scheduled, the pod **will not be evicted or rescheduled** to a different node.

1. **At Scheduling Time**: The scheduler assigns the pod to a node based on the labels present at that time.  
2. **After Scheduling**: If the node’s labels change later, the pod **remains on the same node** unless manually deleted and recreated.

### Taints & Tolerations (`NoExecute` Effect)

- The **`NoExecute` taint effect supports re-evaluation**—if a node’s taints change and a pod doesn’t tolerate them, it will be evicted.  
  

---

## References  

- [Kubernetes Official Documentation: Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)  
- [Understanding Node Affinity in Kubernetes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#node-affinity)  
- [Kubernetes Scheduling Preferences](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#types-of-node-affinity)  
- [Taints and Tolerations in Kubernetes](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)