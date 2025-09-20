# Day 48: Kubernetes DNS Explained | CKA Course 2025

## Video reference for Day 48 is the following:

[![Watch the video](https://img.youtube.com/vi/9TosJ-z9x6Y/maxresdefault.jpg)](https://www.youtube.com/watch?v=9TosJ-z9x6Y&ab_channel=CloudWithVarJosh)

---
## ⭐ Support the Project  
If this **repository** helps you, give it a ⭐ to show your support and help others discover it! 

---

## Table of Contents  

- [Prerequisites for This Lecture](#prerequisites-for-this-lecture)  
- [Introduction](#introduction)  
- [CoreDNS in Kubernetes](#coredns-in-kubernetes)  
- [Understanding DNS Mapping in Kubernetes with CoreDNS](#understanding-dns-mapping-in-kubernetes-with-coredns)  
  - [FQDNs in Kubernetes: Services, Pods, and StatefulSets](#fqdns-in-kubernetes-services-pods-and-statefulsets)  
  - [How CoreDNS Manages and Resolves Names](#how-coredns-manages-and-resolves-names)   
  - [Kubernetes DNS: What Gets Created and How It Resolves](#kubernetes-dns-what-gets-created-and-how-it-resolves)  
- [DNS Configuration Inside a Pod](#dns-configuration-inside-a-pod)  
  - [/etc/hosts vs /etc/resolv.conf](#etchosts-vs-etcresolvconf)  
- [Verifying DNS Records in Kubernetes](#verifying-dns-records-in-kubernetes)  
- [Inspecting the CoreDNS Configuration: The Corefile](#inspecting-the-coredns-configuration-the-corefile)  
  - [CoreDNS Plugin Reference](#coredns-plugin-reference)  
- [DNS Troubleshooting in Kubernetes](#dns-troubleshooting-in-kubernetes)  
- [Conclusion](#conclusion)  
- [References](#references)  

---

### Prerequisites for This Lecture

Before proceeding, make sure you're comfortable with the following foundational topics:

1. **DNS Fundamentals**
   A clear understanding of how DNS works will help you follow how Kubernetes DNS resolution is implemented.

   * YouTube: [DNS Explained](https://www.youtube.com/watch?v=hXFciOpUuOY&ab_channel=CloudWithVarJosh)
   * GitHub Notes: [DNS Lecture](https://github.com/CloudWithVarJosh/YouTube-Standalone-Lectures/tree/main/Lectures/01-DNS)

2. **StatefulSets in Kubernetes**
   This is important to understand how DNS entries are created for pods behind a headless service.

   * YouTube: [StatefulSets Deep Dive](https://www.youtube.com/watch?v=ES48aMk4Gys&ab_channel=CloudWithVarJosh)
   * GitHub Notes: [Day 44 - StatefulSets](https://github.com/CloudWithVarJosh/CKA-Certification-Course-2025/tree/main/Day%2044)

---

## Introduction

In Kubernetes, DNS plays a fundamental role in enabling service discovery and seamless communication between components. Rather than relying on fixed IP addresses, workloads communicate using service names, which are dynamically resolved by the cluster’s DNS system. This abstraction improves portability, scalability, and automation.

Kubernetes clusters use **CoreDNS** as the default DNS provider. CoreDNS runs as a Deployment in the `kube-system` namespace and provides a highly configurable, plugin-based system for handling internal name resolution for services and (optionally) pods. This lecture explores how DNS works inside Kubernetes, how CoreDNS is configured and behaves, and how names are constructed and resolved—especially for Services, Pods, and StatefulSets.

We also dive into DNS resolution mechanics using tools like `nslookup`, show how the DNS search path is derived from `/etc/resolv.conf`, and compare the roles of `/etc/hosts` and the DNS server. Practical examples demonstrate DNS record creation and testing, both within and across namespaces.


---

## CoreDNS in Kubernetes

**CoreDNS** is the default DNS server for Kubernetes clusters and is responsible for internal name resolution, enabling pods and services to communicate using DNS names instead of IP addresses.

#### Key Characteristics

* **Runs as a Deployment** in the `kube-system` namespace, typically with 2 or more replicas for high availability.
* Exposed via a **ClusterIP Service** named `kube-dns`, which acts as the in-cluster DNS endpoint.
* Replaces the legacy `kube-dns` implementation and is now the de facto standard since Kubernetes v1.13.
* Modular and extensible — CoreDNS uses a plugin-based architecture, with the `kubernetes` plugin being responsible for dynamically resolving service and pod names.
* Supports both **forwarding to external DNS** (via the `forward` plugin) and **metrics exposure**.

#### Inspecting CoreDNS Deployment and Service

```bash
kubectl get deploy -n kube-system
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
coredns   2/2     2            2           82s
```

```bash
kubectl get svc -n kube-system
NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   3m57s
```

From this output:

* The `coredns` Deployment is running 2 replicas in the `kube-system` namespace.
* The `kube-dns` service exposes port **53** for DNS traffic (both UDP and TCP), and **9153** for Prometheus metrics.

#### Port Details

| Port   | Protocol | Purpose                                                                  |
| ------ | -------- | ------------------------------------------------------------------------ |
| `53`   | UDP/TCP  | Standard DNS traffic for name resolution requests inside the cluster     |
| `9153` | TCP      | Exposes Prometheus-compatible metrics for CoreDNS performance and health |

The metrics on port **9153** include request counts, response codes, cache hits, latency statistics, and more. These are useful for monitoring the DNS subsystem of the cluster and can be scraped by Prometheus or similar tools.

---


## Understanding DNS Mapping in Kubernetes with CoreDNS

In a Kubernetes cluster, **CoreDNS** serves as the internal DNS server, responsible for resolving service and (optionally) pod names into IP addresses. This enables seamless service discovery and communication between workloads.

Kubernetes automatically registers **DNS A-records for Services**, allowing other resources to resolve them by name. **Pod-level DNS records** can also be generated if the CoreDNS `pods` plugin is enabled.

DNS naming in Kubernetes follows a consistent hierarchical structure, supporting both intra- and cross-namespace communication.

---

## FQDNs in Kubernetes: Services, Pods, and StatefulSets

Kubernetes uses fully qualified domain names (FQDNs) to resolve services and, optionally, individual pods. The format and resolution behavior vary slightly based on the resource type and DNS configuration.

---

### FQDN Syntax Patterns

| Resource Type                  | FQDN Format                                               | Example (default)                              | Notes                                                                                     |
| ------------------------------ | --------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Service                        | `<service-name>.<namespace>.svc.cluster.local`            | `nginx-svc.default.svc.cluster.local`          | Resolves to the Service’s ClusterIP. Automatically created for every Service.             |
| Pod (via CoreDNS `pods`)       | `<hyphenated-ip>.<namespace>.pod.cluster.local`           | `10-244-2-10.default.pod.cluster.local`        | Requires CoreDNS `pods` plugin. Resolves to Pod IP. Not created by default.               |
| StatefulSet Pod (Headless SVC) | `<pod-name>.<headless-svc>.<namespace>.svc.cluster.local` | `pod-0.headless-svc.default.svc.cluster.local` | Automatically created when using StatefulSets with headless Services (`clusterIP: None`). |

> Note: A trailing dot (`.`) in DNS (`...local.`) marks the name as an absolute FQDN. It is typically omitted in command-line usage but present in DNS queries.

---

### **Kubernetes DNS Breakdown: A Visual Guide**

This table breaks down two common forms of internal Kubernetes DNS names — one for a Service (`nginx-svc.default.svc.cluster.local`) and one for a Pod with the `pod` plugin enabled (`10-244-44-55.default.pod.cluster.local`) — explaining the role of each part in the cluster’s internal DNS hierarchy.


| Level | Component | Example 1 (Service) | Example 2 (Pod by IP) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Cluster Domain Root** | `cluster.local` | `cluster.local` | `cluster.local` | This is the **private, top-level domain for the Kubernetes cluster** and the root of its internal DNS hierarchy. |
| **Resource Type Subdomain** | `svc` or `pod` | `svc` | `pod` | Specifies **what type of object** the DNS entry points to: a Service or a Pod. |
| **Namespace Subdomain** | `<namespace>` | `default` | `default` | The **Kubernetes namespace** of the resource, used for resource isolation and logical grouping. |
| **Hostname** | `<resource>` | `nginx-svc` | `10-244-44-55` | For Services, this is the Service name. For Pods, it's the **Pod IP rewritten with hyphens** (e.g., `10.244.44.55` becomes `10-244-44-55`). |


---

### **How CoreDNS Manages and Resolves Names**

The Kubernetes DNS system is managed by **CoreDNS**, which organizes all services and pods into a predictable, hierarchical structure. This layout allows for reliable name resolution and simplifies communication within the cluster.

To understand how it works, it's helpful to visualize the hierarchy and then see it in action:

* All **Services and Pods** in the cluster are grouped under the **cluster root domain**: `cluster.local`.
* Within this root, resources are grouped by their **type** into the `svc` and `pod` subdomains.
* The **namespaces** act as further subdomains to logically organize resources. For example, all Services in the `default` namespace are part of the `default.svc.cluster.local` subdomain.

CoreDNS uses this exact structure to resolve names. When an application makes a request, it breaks down the name and follows this hierarchy:

**Example Resolution:**
When a Pod queries for `nginx-svc` from within the same namespace, CoreDNS performs an automatic lookup by appending the search domains. It resolves the full name `nginx-svc.default.svc.cluster.local.` by following these steps:

1.  It identifies the **cluster domain root**: `cluster.local`.
2.  It uses the **resource type subdomain**: `svc`.
3.  It finds the **namespace subdomain**: `default`.
4.  Finally, it resolves the **hostname**: `nginx-svc` to its specific ClusterIP address, providing a stable endpoint for communication.

This predictable structure is what allows a Pod to query for a short name like `nginx-svc` and have CoreDNS automatically resolve it to the full FQDN.

---

**📌 Note: Kubernetes DNS ≠ Public DNS Structure**
While Kubernetes DNS is inspired by traditional DNS principles, **it does not follow the exact structure of public DNS systems**. In a public DNS hierarchy, the root zone is denoted by `.` (dot), with top-level domains like `.com`, `.org`, etc.
However, in Kubernetes, the DNS hierarchy starts with `cluster.local`, which acts as the **effective root for the cluster’s internal DNS**. Subdomains like `.svc` and `.pod` are specific to Kubernetes and used for service and pod discovery within namespaces.
So although **the concepts of name resolution and hierarchy remain**, Kubernetes DNS operates in its own isolated, internal naming system.


---

### Explanation by Type

#### 1. **Service FQDNs**

When you create a Kubernetes Service, an A-record is created following this pattern:

```
<service-name>.<namespace>.svc.cluster.local
```

Examples:

* `nginx-svc.default.svc.cluster.local`
* `app1-svc.app1-ns.svc.cluster.local`

These resolve to the Service’s ClusterIP and allow pods to communicate internally by service name, avoiding hardcoded IPs.

---

#### 2. **Pod FQDNs (CoreDNS `pods` plugin)**

By default, Kubernetes does not create DNS records for individual pods. However, if the `pods` plugin is enabled in CoreDNS, pod IPs can be resolved using this format:

```
<hyphenated-ip>.<namespace>.pod.cluster.local
```

Example:

* Pod with IP `10.244.2.10` in `app1-ns` becomes `10-244-2-10.app1-ns.pod.cluster.local`

This allows name-based resolution for individual pods, useful for advanced scenarios or legacy applications.

---

#### 3. **StatefulSet Pods via Headless Services**

Pods created by StatefulSets and exposed through headless services (`clusterIP: None`) automatically get DNS entries. These use named pod records and follow this format:

```
<pod-name>.<service-name>.<namespace>.svc.cluster.local
```

Example:

* Pod `pod-0` in StatefulSet exposed via `headless-svc` in `app1-ns` will be:
  `pod-0.headless-svc.app1-ns.svc.cluster.local`

This allows stable, unique pod-level DNS names—ideal for stateful workloads like databases or message brokers.

---


### Kubernetes DNS: What Gets Created and How It Resolves

Kubernetes uses an internal DNS system (typically CoreDNS) to resolve names for Services and Pods within the cluster. While it follows traditional DNS conventions like fully qualified domain names (FQDNs), it does **not mirror the public DNS hierarchy**. For example, `cluster.local.` is treated as the root of the internal DNS zone—not `.` as in public DNS.

The table below illustrates how various resource types get internal DNS entries and how they resolve within the cluster.

| Resource Type    | Hostname / Record Name | Namespace | DNS Type | FQDN                                            | Resolves To                |
| ---------------- | ---------------------- | --------- | -------- | ----------------------------------------------- | -------------------------- |
| Service          | `nginx-svc`            | default   | A        | `nginx-svc.default.svc.cluster.local.`          | 10.96.48.49                |
| Service          | `app1-svc`             | app1-ns   | A        | `app1-svc.app1-ns.svc.cluster.local.`           | 10.96.161.240              |
| Pod              | `10-244-2-10`          | app1-ns   | A        | `10-244-2-10.app1-ns.pod.cluster.local.`        | 10.244.2.10                |
| StatefulSet Pod  | `pod-0.headless-svc`   | app1-ns   | A        | `pod-0.headless-svc.app1-ns.svc.cluster.local.` | Pod IP (stable)            |
| Headless Service | `headless-svc`         | app1-ns   | NONE     | `headless-svc.app1-ns.svc.cluster.local.`       | *No cluster IP* (uses SRV) |

---

### Notes:

* The trailing dot (`.`) in FQDNs is conventional in DNS terminology — marking root.
* Headless Services (`clusterIP: None`) do **not** have an `A` record for the service name, but **each pod behind it gets its own `A` record**.
* For headless StatefulSets, the pattern is `pod-name.service-name.namespace.svc.cluster.local` mapping to a stable pod IP.

---

## DNS Configuration Inside a Pod

Start an interactive pod for testing:

```bash
kubectl run debug-pod -it --image=nicolaka/netshoot --rm -- bash
```

> **Note**: The `nicolaka/netshoot` image is specifically designed for network troubleshooting within Kubernetes. It includes a rich set of pre-installed tools such as `dig`, `nslookup`, `curl`, `ping`, `telnet`, `tcpdump`, and more, making it ideal for diagnosing DNS issues, inspecting service connectivity, and analyzing network behavior inside a cluster.

The pod we create here is named `debug-pod`, as explicitly specified. Since the CoreDNS configuration in most default clusters **does not enable the `pod` plugin**, there will be **no A record created for this pod** in the DNS system. That means we **cannot resolve this pod by name** (e.g., `debug-pod.default.pod.cluster.local`) using DNS.



Try resolving the pod name using `nslookup`:

```bash
nslookup debug-pod
```

Output:

```
Server:		10.96.0.10
Address:	10.96.0.10#53

** server can't find debug-pod: NXDOMAIN
```

This confirms that **no DNS entry exists** for the pod name.

However, resolving an external domain still works (as long as your CoreDNS forwards are configured):

```bash
nslookup kubernetes.io
```

Output (truncated):

```
Server:		10.96.0.10
Address:	10.96.0.10#53

Non-authoritative answer:
Name:	kubernetes.io
Address: 15.197.167.90
Name:	kubernetes.io
Address: 3.33.186.135
```

This shows that external DNS lookups are functional via CoreDNS, even though pod-level names are not resolved internally.

Inspect the DNS configuration:

```bash
cat /etc/resolv.conf
```

Output:

```
search default.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
```

---

### Understanding `/etc/resolv.conf` and DNS Search Order in Kubernetes

Every pod in a Kubernetes cluster gets an auto-generated `/etc/resolv.conf` file that governs how DNS queries are handled. This file contains two key elements:

* **Nameserver points to CoreDNS**
  The `nameserver` entry in the file (typically `10.96.0.10`) is the ClusterIP of the `kube-dns` service, which fronts the CoreDNS deployment running in the `kube-system` namespace. This means all DNS lookups from the pod are routed to CoreDNS.

* **Search domains appended to short names**
  The `search` line defines domain suffixes that Kubernetes will try when resolving short or unqualified names. For example:

  ```bash
  search default.svc.cluster.local svc.cluster.local cluster.local
  ```

  These suffixes are tried **in sequence** when a pod tries to resolve a service like `backend-svc`. Here’s how the resolution proceeds:

  1. `nginx-svc.default.svc.cluster.local`
  2. `nginx-svc.svc.cluster.local`
  3. `nginx-svc.cluster.local`

  The first match that returns a valid DNS record is used.

* **Why this matters**
  This ordering allows pods to resolve services within their own namespace with just the short name (like `backend-svc`) while still supporting cross-namespace resolution using FQDNs. However, it also means that if multiple services with the same name exist across namespaces, resolution behavior may vary depending on the pod's namespace and the order of search domains.

* **Static overrides checked first**
  Before querying the nameserver, the system checks `/etc/hosts` for a local override. This is part of standard Linux name resolution behavior governed by `/etc/nsswitch.conf`.

* **Practical implication**
  For reliable and predictable resolution in multi-namespace deployments, use FQDNs like `backend-svc.app1-ns.svc.cluster.local` instead of relying solely on short names.

This layered and deterministic resolution process helps Kubernetes clusters handle service discovery efficiently and transparently, but being aware of the lookup flow is essential to avoid subtle bugs and name collisions in larger systems.


---

## `/etc/hosts` vs `/etc/resolv.conf`

```bash
cat /etc/hosts
```

This file contains static name-to-IP mappings. Name resolution first checks this file **before** consulting the DNS server.

Example:

```bash
10.244.2.3 www.kubernetes.io
```

With this entry, DNS will be bypassed, and the pod will resolve `www.kubernetes.io` to `10.244.2.3` directly.

This behavior can be confirmed in `/etc/nsswitch.conf`, where the lookup order is defined (hosts, then DNS, etc.).

---

#### 📌 Note: `nslookup` and `dig` Bypass `/etc/hosts`

Do understand that tools like `nslookup` and `dig` do **not** consult the `/etc/hosts` file or follow the order in `/etc/nsswitch.conf`.

Instead, they directly talk to the DNS **nameserver** specified in `/etc/resolv.conf`, making raw DNS queries.

This is why:

* `ping myhost` might resolve successfully (via `/etc/hosts`)
* `nslookup myhost` may fail (if no DNS record exists)

---



## Verifying DNS Records in Kubernetes

### Step 1: Create a Test Service in the Default Namespace

```bash
kubectl create deployment nginx-deploy --image=nginx
kubectl expose deployment nginx-deploy --name=nginx-svc --port=80
```

```bash
kubectl get pods,svc
```

This creates a DNS record:

```
nginx-svc.default.svc.cluster.local
```

Test from a debug pod:

```bash
kubectl run debug-pod -it --image=nicolaka/netshoot --rm -- bash
nslookup nginx-svc
```

Expected output:

```
Server: 10.96.0.10
Name:   nginx-svc.default.svc.cluster.local
Address: 10.96.48.49
```

This works because both the debug pod and service are in the **default namespace**.

---

### Step 2: Cross-Namespace DNS Resolution

Let's create a service in a new namespace and try to resolve it:

```bash
kubectl create ns app1-ns
kubectl create deployment app1-deploy --image=nginx -n app1-ns
kubectl expose deployment app1-deploy --name=app1-svc --port=80 -n app1-ns
```

When this service is created, Kubernetes (via CoreDNS) automatically registers a DNS A-record for it:

```
app1-svc.app1-ns.svc.cluster.local
```

From a debug pod in the **default namespace**, you can resolve this service using:

```bash
nslookup app1-svc.app1-ns
```

You should see:

```
Server: 10.96.0.10
Name:   app1-svc.app1-ns.svc.cluster.local
Address: 10.96.x.x
```

---

### ⚠️ Why `nslookup app1-svc` Would Fail in This Case

By default, pods rely on DNS search domains defined in `/etc/resolv.conf`, such as:

```
search default.svc.cluster.local svc.cluster.local cluster.local
```

This means when you run:

```bash
nslookup app1-svc
```

It tries resolving the following **in order**:

1. `app1-svc.default.svc.cluster.local`
2. `app1-svc.svc.cluster.local`
3. `app1-svc.cluster.local`

But **none of these match the actual service**, which is in the `app1-ns` namespace.

---

### Key Takeaway

To resolve services across namespaces, **you must specify the full service name**, including its namespace — at minimum:

```
nslookup app1-svc.app1-ns
```

This ensures DNS suffixing completes the FQDN correctly:

```
app1-svc.app1-ns.svc.cluster.local
```

Otherwise, DNS will only search within the configured domains (like `default.svc.cluster.local`) and fail to resolve the service in `app1-ns`.


> A pod running inside the `app1-ns` namespace can resolve the service `app1-svc` **without specifying the namespace**, because `/etc/resolv.conf` includes `app1-ns.svc.cluster.local` in its search domains. As a result, a simple `nslookup app1-svc` within the pod works without requiring the fully qualified domain name.

You can verify this by running:

```bash
kubectl run debug-pod-app1 -n app1-ns -it --image=nicolaka/netshoot --rm -- bash
```

Then inside the pod:

```bash
nslookup app1-svc
```

It should return the correct cluster IP for `app1-svc`.

---


### **Inspecting the CoreDNS Configuration: The `Corefile`**

The behavior of CoreDNS is defined by a configuration file called the `Corefile`. In Kubernetes, this file is managed as a **ConfigMap** and is mounted into the CoreDNS pods at runtime. This allows administrators to easily inspect and modify the DNS settings without rebuilding the CoreDNS container image.

To view the `Corefile` in your cluster, you can inspect the `coredns` ConfigMap in the `kube-system` namespace:

```bash
kubectl get cm -n kube-system coredns -o yaml
```

You will find a `data` section containing the `Corefile` key, which holds the entire configuration:

```yaml
# A typical Corefile configuration
.:53 {
    errors
    health {
       lameduck 5s
    }
    ready
    kubernetes cluster.local in-addr.arpa ip6.arpa {
       pods insecure
       fallthrough in-addr.arpa ip6.arpa
       ttl 30
    }
    prometheus :9153
    forward . /etc/resolv.conf {
       max_concurrent 1000
    }
    cache 30 {
       disable success cluster.local
       disable denial cluster.local
    }
    loop
    reload
    loadbalance
}
```

The table below breaks down the purpose of each directive and plugin in the `Corefile`.

---

### CoreDNS Plugin Reference

| Directive / Plugin                                                        | Purpose                                                                                                                                                                                     |
| :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.:53`                                                                    | Declares the main server block. CoreDNS listens on all interfaces (`.`) on port 53, the standard DNS port.                                                                                  |
| `errors`                                                                  | Enables logging of DNS errors to stderr. Useful for debugging query failures or plugin issues.                                                                                              |
| `health { lameduck 5s }`                                                  | Exposes a `/health` endpoint for liveness probes. The `lameduck` option allows existing connections to drain for 5 seconds before shutdown.                                                 |
| `ready`                                                                   | Provides a `/ready` endpoint for readiness probes. Signals when CoreDNS is fully initialized and ready to serve DNS traffic.                                                                |
| `kubernetes cluster.local in-addr.arpa ip6.arpa`                          | Handles internal DNS for Services and Pods under the `cluster.local` domain. Also supports reverse lookups for IPv4 (`in-addr.arpa`) and IPv6 (`ip6.arpa`).                                 |
| `pods insecure`                                                           | Enables Pod IP-based lookups (e.g., `10-244-44-55.default.pod.cluster.local`) without requiring hostname annotations. May lead to stale or spoofed entries — not recommended in production. |
| `fallthrough in-addr.arpa ip6.arpa`                                       | Allows unresolved queries in the specified zones to pass to the next plugin (commonly `forward`). Used to avoid resolution dead-ends.                                                       |
| `ttl 30`                                                                  | Sets the DNS TTL to 30 seconds for records served by the `kubernetes` plugin.                                                                                                               |
| `prometheus :9153`                                                        | Exposes CoreDNS metrics on port 9153 in Prometheus format. Useful for observability and monitoring.                                                                                         |
| `forward . /etc/resolv.conf { max_concurrent 1000 }`                      | Forwards unresolved queries (typically external domains) to upstream resolvers defined in `/etc/resolv.conf`. Supports up to 1000 concurrent queries.                                       |
| `cache 30 { disable success cluster.local disable denial cluster.local }` | Caches external DNS responses for 30 seconds. Disables caching for both successful and failed queries under `cluster.local` to reflect dynamic cluster state.                               |
| `loop`                                                                    | Detects and prevents DNS resolution loops caused by misconfigured forwarders.                                                                                                               |
| `reload`                                                                  | Automatically reloads CoreDNS when the `Corefile` changes — no restart required.                                                                                                            |
| `loadbalance`                                                             | Randomizes the order of upstream nameservers to distribute DNS query load evenly.                                                                                                           |

---

### **Pod DNS Resolution Modes in CoreDNS**

Kubernetes CoreDNS offers multiple modes for resolving pod-level DNS names through the `pods` directive within the `kubernetes` plugin. Each mode offers different trade-offs between convenience and security:

**`pods insecure`**
Enables DNS entries for pod IPs (e.g., `10-244-1-23.default.pod.cluster.local`) without verifying ownership through the Kubernetes API.
This mode is fast and convenient for development and testing, but it is **insecure**—allowing spoofed or stale records.
Retained mainly for backward compatibility with `kube-dns` and **not recommended** for production use.

**`pods verified`**
Resolves pod DNS names only if the IP matches an active pod in the same namespace, as confirmed via the API server.
Provides security and accuracy, ensuring only valid, live pods are resolvable.
This mode is **recommended for production environments** requiring secure pod-level resolution.

**`pods hostname`**
Resolves DNS entries based solely on the pod’s `hostname` field.
Ideal for environments with predictable hostnames and explicit hostname control—such as StatefulSets or manually configured hostnames.
Useful when strict DNS behavior and naming consistency are desired.

**Recommended Usage in Production:**

* Use **`pods verified`** for secure, API-backed pod resolution.
* Use **`pods hostname`** when you manage pod hostnames explicitly (e.g., with StatefulSets).
* Avoid **`pods insecure`** due to its lack of validation and vulnerability to spoofing.



---


## DNS Troubleshooting in Kubernetes

If DNS resolution is not working for services or pods within your Kubernetes cluster, use the following checklist to troubleshoot the issue:

### 1. **Verify CoreDNS is Running**

Ensure the CoreDNS pods are up and healthy.

```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

Look for pods in the `Running` state and with `READY` status like `2/2`.

---

### 2. **Check CoreDNS Logs**

Inspect CoreDNS logs for errors or dropped queries.

```bash
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=100
```

Look for signs of loop errors, failures in the `forward` plugin, or failed resolutions.

---

### 3. **Test DNS from Within a Pod**

Use a test pod to perform DNS lookups using tools like `dig` or `nslookup`.

```bash
kubectl run dns-test --rm -it --image=nicolaka/netshoot -- bash
nslookup kubernetes.default
dig nginx-svc.default.svc.cluster.local
```

If these fail, it indicates DNS resolution is not working within the cluster.

---

### 4. **Verify `resolv.conf` Configuration**

Check the `/etc/resolv.conf` inside the Pod to see if it points to the correct cluster DNS (usually `10.96.0.10` in default kubeadm setups).

```bash
cat /etc/resolv.conf
```

Expected content (or similar):

```
nameserver 10.96.0.10
search default.svc.cluster.local svc.cluster.local cluster.local
```

---

### 5. **Check `nsswitch.conf`**

Ensure the lookup order includes `dns`. The file `/etc/nsswitch.conf` inside the container should have:

```
hosts: files dns
```

This ensures that the pod uses `/etc/hosts` first, then DNS.

---

### 6. **Inspect CoreDNS ConfigMap (`Corefile`)**

Ensure the CoreDNS configuration has the `kubernetes` plugin correctly set up, including the domain (e.g., `cluster.local`) and any necessary options like:

```txt
kubernetes cluster.local in-addr.arpa ip6.arpa {
  pods insecure
  fallthrough in-addr.arpa ip6.arpa
  ttl 30
}
```

Check with:

```bash
kubectl get configmap coredns -n kube-system -o yaml
```

---

### 7. **Check for Network Policy or Firewall Rules**

Ensure there are no NetworkPolicies or firewalls preventing UDP/TCP port 53 (DNS) access between pods and CoreDNS.

---

### 8. **Validate kubelet DNS Options**

Check the kubelet startup options (especially if running custom clusters) to verify correct DNS configuration flags are set, such as `--cluster-dns`.

---

### 9. **Look for Loop or Forwarding Errors**

If external DNS resolution is also failing (e.g., `nslookup google.com`), confirm that the `forward` plugin is correctly configured in the `Corefile`:

```txt
forward . /etc/resolv.conf
```

Ensure `/etc/resolv.conf` on the CoreDNS pods has valid upstream resolvers.

---

## Conclusion

Understanding DNS in Kubernetes is essential for building reliable, discoverable applications. CoreDNS abstracts away the complexity of dynamic IPs and simplifies internal networking using a predictable FQDN structure. Whether you're deploying simple microservices or complex stateful applications, a clear grasp of how names are registered and resolved inside the cluster helps avoid communication issues, improves debugging, and supports advanced use cases like cross-namespace service access or pod-level resolution.

In this lecture, we covered the architecture of CoreDNS, its role in DNS resolution, how records are created for Services, Pods, and StatefulSets, and how lookup behavior is governed by CoreDNS plugins and the pod’s `resolv.conf` settings. We also explored practical tools like `netshoot`, `dig`, and `nslookup` for troubleshooting name resolution. By the end of this module, you should be comfortable inspecting CoreDNS behavior, reading FQDN patterns, and resolving both service and pod names confidently.

---

## References

* [DNS for Services and Pods – Kubernetes Documentation](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
* [Debugging DNS Resolution – Kubernetes Documentation](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/)
* [Custom DNS Configuration – Kubernetes Documentation](https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/)
* [CoreDNS Plugin: Kubernetes](https://coredns.io/plugins/kubernetes/)

---