# Day 38: Admission Controllers in Kubernetes | Mutating & Validating | CKA Course 2025

## Video reference for Day 38 is the following:

[![Watch the video](https://img.youtube.com/vi/iZTQv4F7Djk/maxresdefault.jpg)](https://www.youtube.com/watch?v=iZTQv4F7Djk&ab_channel=CloudWithVarJosh)

---
## ⭐ Support the Project  
If this **repository** helps you, give it a ⭐ to show your support and help others discover it! 

---

### Prerequisites:

Before starting this lecture, please ensure you’ve completed the following sessions:

**Day 35** – We covered **Kubernetes Authorization Modes**, including a detailed walkthrough of **Webhook Authorization**, which is essential to understand how policy engines like OPA integrate with the authorization layer.

* [Day 35 GitHub Notes](https://github.com/CloudWithVarJosh/CKA-Certification-Course-2025/tree/main/Day%2035)
* [Day 35 YouTube Video](https://www.youtube.com/watch?v=DkKc3RCW2BE&ab_channel=CloudWithVarJosh)

**Day 37** – We explored **Kubernetes Service Accounts** and other **authentication methods**. This is essential background for understanding how **user and workload identities** interact with **authorization** and **admission control** mechanisms in Kubernetes.

* [Day 37 GitHub Notes](https://github.com/CloudWithVarJosh/CKA-Certification-Course-2025/tree/main/Day%2037)
* [Day 37 YouTube Video](https://www.youtube.com/watch?v=WsQT7y5C-qU&ab_channel=CloudWithVarJosh)

This foundational knowledge will help you better understand how tools like **OPA**, **Gatekeeper**, and **Kyverno** plug into the Kubernetes security and policy enforcement model.

---

# Table of Contents

- [Introduction](#introduction)
- [Request Lifecycle Recap](#request-lifecycle-recap)
- [Admission Controllers in Kubernetes](#admission-controllers-in-kubernetes)
  - [Built-in Admission Controllers](#built-in-admission-controllers)
    - [Mutating Admission Controllers](#mutating-admission-controllers)
    - [Validating Admission Controllers](#validating-admission-controllers)
    - [Dual-Function Admission Controllers](#dual-function-admission-controllers)
  - [Custom Admission Controllers](#custom-admission-controllers)

- [Real-World Use Cases & Tools](#real-world-use-cases--tools)
- [Understanding OPA in Authorization vs Admission Control](#understanding-opa-in-authorization-vs-admission-control)
  - [Why OPA for Authorization and Admission Control](#why-opa-for-authorization-and-admission-control)
  - [OPA as a Webhook Authorizer](#opa-as-a-webhook-authorizer)
  - [Common Webhook Authorization Policies with OPA](#common-webhook-authorization-policies-with-opa)
  - [OPA as an Admission Controller](#opa-as-an-admission-controller)
- [Decision-Making Framework: When to Use What?](#decision-making-framework-when-to-use-what)
- [Admission Controller Execution Sequence](#admission-controller-execution-sequence)
- [Conclusion](#conclusion)
- [References](#references)

---

## Introduction

After a request is authenticated and authorized in Kubernetes, it isn’t immediately written to etcd. Instead, it passes through **Admission Controllers** — powerful gatekeepers that can **modify**, **validate**, or **reject** requests based on custom logic or cluster policies.

Admission controllers are central to enforcing **security**, **governance**, and **operational standards**. Whether it’s auto-injecting sidecars, rejecting privileged pods, or enforcing image registry restrictions — this is where policy meets practice.

---

## Request Lifecycle Recap

![Alt text](../images/38a.png)

A typical API request to Kubernetes (e.g., via `kubectl`) goes through the following phases:

```
kubectl → Authentication → Authorization → Admission Control → etcd
```

Admission Controllers **only apply to modifying requests**, not read-only operations.

---

> ### Clarifying Admission Control
>
> When you think about **admission controllers**, think of them as **gatekeepers for persisting objects in etcd**, not as gatekeepers for accessing the cluster.
>
> Access to the Kubernetes cluster is already handled by **authentication** (e.g., TLS certificates, OIDC tokens) and **authorization** (e.g., RBAC, ABAC).
>
> **Admission controllers come into play *after* authentication and authorization succeed**. They evaluate whether the object you're trying to create or modify meets cluster policies — and only if all relevant admission controllers approve the request will the object be persisted in etcd.
>
> In short:
> ✅ AuthN → ✅ AuthZ → ✅ Admission → 📦 Write to etcd
> ❌ If admission fails → request is **rejected** and nothing is stored.

---

## Admission Controllers in Kubernetes

In Kubernetes, **admission control** is the mechanism that regulates API requests **before they are persisted to etcd**.

This is achieved using **Admission Controllers**, which intercept **write operations** (`CREATE`, `UPDATE`, `DELETE`) sent to the Kubernetes API server. They do **not** apply to read-only requests like `GET`, `LIST`, or `WATCH`.

Admission Controllers play a key role in:

* Enforcing security and governance policies
* Validating configuration correctness
* Applying default values or transformations
* Ensuring compliance with cluster standards

![Alt text](../images/38c.png)

Admission Controllers are broadly classified into:

* **Built-in Admission Controllers** – Provided by Kubernetes itself and enabled via API server flags. They include mutating, validating, and dual-function plugins such as `LimitRanger`, `PodSecurity`, and `MutatingAdmissionWebhook`.
* **Custom Admission Controllers** – Implemented as **external webhook servers**, allowing dynamic, organization-specific logic using tools like **OPA (With Gatekeeper)**, **Kyverno**, or custom APIs. These are invoked through the `MutatingAdmissionWebhook` and `ValidatingAdmissionWebhook` plugins.


---

### Built-in Admission Controllers (ACs)

These are pre-packaged with Kubernetes and implemented as **admission plugins** that apply logic to API requests during their lifecycle. Built-in ACs fall into three main categories:

![Alt text](../images/38b.png)

* **Mutating ACs**
  *(Examples: `MutatingAdmissionWebhook`, `DefaultStorageClass`)*
  These controllers modify incoming requests before they are stored, allowing automatic injection of defaults or changes.

* **Validating ACs**
  *(Examples: `ValidatingAdmissionWebhook`, `PodSecurity`, `ResourceQuota`)*
  These controllers validate requests against cluster policies and either accept or reject them without modifying the object.

* **Dual-function ACs**
  *(Examples: `LimitRanger`, `ServiceAccount`)*
  These perform both mutation and validation on the same API request.

---

### Core Concepts: Mutating vs Validating Admission Controllers

* **Mutating Admission Controllers** modify API objects as they pass through the admission chain.
  Typical use cases:

  * Adding default tolerations
  * Setting image pull policies
  * Applying resource limits
  * Auto-assigning service accounts

* **Validating Admission Controllers** evaluate API objects and accept or reject them based on compliance rules, but do **not** alter the object.
  Execution order:

  1. Mutating controllers run first, applying required changes.
  2. Validating controllers run afterward, checking compliance on the final object.
  3. If any validating controller rejects the request, the entire request is denied immediately.

---

## Built-in Admission Controller Plugins

Kubernetes ships with numerous built-in admission controller plugins, configurable via the API server’s `--enable-admission-plugins` flag.

They can be grouped into:

* **Mutating Admission Controllers**
* **Validating Admission Controllers**
* **Dual-function Admission Controllers**

---

### 1. Mutating Admission Controllers

Below is a subset of **Mutating Admission Controller plugins**. For a full list, refer to the official documentation: [Kubernetes Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/).
These plugins modify API objects before persistence. Some important examples include:

| Plugin                     | Description                                                                                                                                                                                                                   | Enabled by Default |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `MutatingAdmissionWebhook` | Sends incoming objects to an **external webhook** before persistence. Used for tasks like **auto-injecting sidecars** (e.g., Istio proxies). Commonly applies **default labels, runtime constraints, and security settings**. | Yes                |
| `DefaultStorageClass`      | Assigns a **default StorageClass** to `PersistentVolumeClaims` lacking one, ensuring PVCs use appropriate backends like **EBS, GCP PD, or Azure Disk**. Simplifies volume provisioning.                                       | Yes                |
| `DefaultTolerationSeconds` | Sets **default tolerations** for Pods exposed to `NoExecute` taints, preventing unwanted evictions when tolerations are missing. Ensures predictable pod lifecycles.                                                          | Yes                |
| `DefaultIngressClass`      | Assigns a default `IngressClass` when none is specified to avoid confusion in multi-ingress setups (e.g. NGINX, HAProxy, or AWS ALB). Fails creation if multiple defaults exist to maintain clarity. Skips if no default is configured. | Yes                |

---

### 2. Validating Admission Controllers

Below is a subset of **Validating Admission Controller plugins**. For a full list, refer to the official documentation: [Kubernetes Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/).
These plugins inspect and validate API objects **without changing them**. Key examples:

| Plugin                       | Description                                                                                                                                                                                          | Enabled by Default |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `NodeRestriction`            | Prevents kubelets from modifying resources **outside their own node**, strengthening **node-level security boundaries**.                                                                             | Yes                |
| `ValidatingAdmissionWebhook` | Sends API objects to **external validation webhooks**, often used for compliance checks, such as disallowing privileged containers or forbidden annotations.                                         | Yes                |
| `PodSecurity`                | Enforces **Pod Security Standards** (Privileged, Baseline, Restricted), blocking Pods violating rules like running as root or using host paths. This replaces deprecated PodSecurityPolicies (PSPs). | No *(opt-in)*      |
| `ResourceQuota`              | Enforces **namespace-level quotas** for CPU, memory, and storage, preventing resource overconsumption in multi-tenant clusters.                                                                      | Yes                |
| `NamespaceLifecycle`         | Disallows operations in **nonexistent or terminating namespaces**, preventing object creation during namespace teardown.                                                                             | Yes                |


---

### 3. Dual-function Admission Controllers

Below is a subset of **Dual-function Admission Controller plugins**. For a full list, refer to the official documentation: [Kubernetes Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/).
These plugins both **mutate** and **validate** requests, combining the two functionalities:

| Plugin                     | Mutating | Validating | Description                                                                                                                                                                      | Enabled by Default |
| -------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `LimitRanger`              | Yes      | Yes        | Sets **default CPU/memory requests and limits** and validates they fall within allowed ranges, helping ensure **fair scheduling** in shared clusters.                            | Yes                |
| `AlwaysPullImages`         | Yes      | Yes        | Forces Pods to **always pull images** from the registry, preventing use of cached or potentially tampered images, enhancing container image security in multi-user environments. | No                 |
| `ServiceAccount`           | Yes      | Yes        | Assigns default `ServiceAccounts` and validates Pods use authorized service accounts, ensuring **proper identity and access control** for workloads.                             | Yes                |

---

## Custom Admission Controllers

Beyond the built-in controllers, Kubernetes supports **custom admission controllers** implemented as **external webhook servers**. These controllers extend the cluster’s governance by performing **both mutation and validation** based on organization-specific policies or compliance needs.

### What is a Webhook?

A **webhook** is an HTTP callback mechanism that allows one system to notify or request another system **in real-time when a specific event occurs**.

In Kubernetes, webhooks enable the API server to invoke external services during admission requests:

* **Mutating Admission Webhooks:** Modify objects (e.g., auto-inject sidecars, enforce default labels).
* **Validating Admission Webhooks:** Approve or reject requests based on custom compliance checks (e.g., deny privileged containers).

**In simple terms:**

> “Hey external service, before I accept this request — do you want to approve, reject, or modify it?”

---

### Classification of Admission Controllers (Summary)

| Type                         | Examples                                                     | Characteristics                                                        |
| ---------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Built-in Mutating            | `MutatingAdmissionWebhook`, `DefaultStorageClass`            | Modify requests, auto-inject defaults, apply runtime settings.         |
| Built-in Validating          | `ValidatingAdmissionWebhook`, `PodSecurity`, `ResourceQuota` | Validate without modifying, enforce policies and quotas.               |
| Built-in Dual-Function       | `LimitRanger`, `ServiceAccount`                              | Both mutate and validate in the same plugin.                           |
| Custom Admission Controllers | Kyverno, OPA/Gatekeeper, org-specific webhooks               | External, flexible, perform mutation and validation tailored to needs. |

Among the built-in plugins, **`MutatingAdmissionWebhook`** and **`ValidatingAdmissionWebhook`** act as **bridges to invoke these custom admission controllers** through webhooks.

> Policy engines and custom admission controllers typically run as **Kubernetes Deployments within your cluster**, exposing a webhook service that the API server can call during the admission phase. While it is **technically possible to run these webhook servers outside the cluster**, this approach is rare due to added complexity in networking, TLS configuration, and availability concerns. In most setups, running them inside the cluster ensures lower latency, tighter security, and easier integration.


---

## Real-World Use Cases & Tools

| Use Case                                 | Controllers or Tools Used                     |
| ---------------------------------------- | --------------------------------------------- |
| Enforce labels on all deployments        | `MutatingAdmissionWebhook` + Kyverno          |
| Deny containers running as root          | `ValidatingAdmissionWebhook` + PodSecurity    |
| Auto-inject sidecars for logging or mesh | `MutatingAdmissionWebhook` + Istio            |
| Block public image usage                 | `ValidatingAdmissionWebhook` + OPA/Gatekeeper |
| Assign default tolerations               | `DefaultTolerationSeconds`                    |

---



### 📘 Note: Default Admission Controllers in Kubernetes (Including kubeadm and KIND Clusters)

In Kubernetes, **not all admission controllers need to be explicitly listed** under `--enable-admission-plugins` for them to be active. Many essential controllers are **enabled by default** unless you explicitly disable them using the `--disable-admission-plugins` flag.

This default behavior is present in:

* Clusters bootstrapped using **kubeadm**
* Tools that use kubeadm under the hood, such as **KIND (Kubernetes IN Docker)**

#### Example from KIND

If you inspect the API server manifest on a KIND control-plane node:

```bash
cat /etc/kubernetes/manifests/kube-apiserver.yaml
```

You might see only this:

```yaml
--enable-admission-plugins=NodeRestriction
```

Despite that, you will still observe behaviors that come from **other admission controllers** like:

| Controller            | Behavior Observed                                                            |
| --------------------- | ---------------------------------------------------------------------------- |
| `ServiceAccount`      | Pods automatically get the `default` ServiceAccount and its token is mounted |
| `NamespaceLifecycle`  | You can't create resources in non-existent or terminating namespaces         |
| `LimitRanger`         | Default CPU and memory limits are applied in some namespaces                 |
| `ResourceQuota`       | Resource creation may be denied if it exceeds namespace-level quotas         |
| `DefaultStorageClass` | Pods with PVCs may get a default StorageClass automatically assigned         |

These admission controllers are part of Kubernetes' **default admission chain** and will run **unless explicitly disabled**.

---

### 🔍 How Admission Controller Flags Work

* `--enable-admission-plugins`: Adds plugins **in addition to** the default set.
* `--disable-admission-plugins`: Explicitly **removes** plugins from the default set.

> So, in KIND and kubeadm-based clusters, if you only enable `NodeRestriction` and don't disable anything, Kubernetes still runs its default controllers in the background.

---

**When the **Kube API Server** is running as a **systemd service****
Check the enabled admission plugins using:

```bash
ps -aux | grep kube-apiserver
```

Look for the flag:

```bash
--enable-admission-plugins=...
```

You might also see:

```bash
--disable-admission-plugins=...
```

These flags determine which admission controllers are active.

---

## How to Enable Admission Controllers

The API server allows you to enable or disable admission controllers via the `--enable-admission-plugins` flag.

**Example:**

```bash
kube-apiserver \
  --enable-admission-plugins=NamespaceLifecycle,LimitRanger,PodSecurity
```

> On **kubeadm-based setups**, this flag should be configured in the static pod manifest at:
> `/etc/kubernetes/manifests/kube-apiserver.yaml`

> On **systemd-based services**, update the unit file or API server startup script.

---


## Custom Admission Controllers: Webhooks

When built-in controllers are not sufficient for your use case, Kubernetes lets you define **custom admission logic** using **Admission Webhooks**:

1. **MutatingAdmissionWebhook**: Modifies requests
2. **ValidatingAdmissionWebhook**: Validates requests

### Architecture

* You deploy an **Admission Webhook server**, typically as a **Deployment inside your cluster** (though outside-the-cluster setups are possible but rare).
* You configure a `MutatingWebhookConfiguration` or `ValidatingWebhookConfiguration` resource.
* The API server sends **matching requests** to the webhook endpoint.
* The webhook server returns an `allowed: true` or `false` decision.

> Webhooks are powerful for enforcing org-specific policies like restricting image registries, enforcing required labels, or denying privileged pods.

---

> **Mutating Admission Controllers do not deny requests. Only Validating Admission Controllers can deny requests.**

* **Mutating Admission Controllers** (e.g., for injecting sidecars, setting default labels, modifying pod specs) are designed to **modify** the incoming object **before validation**. Their job is transformation, not enforcement.

* **Validating Admission Controllers** evaluate the **final version** of the object (after mutation) and have the authority to **allow or deny** the request based on custom policies or validations.

### Sequence:

1. MutatingAdmissionWebhook → modifies the object (but never denies).
2. ValidatingAdmissionWebhook → checks the modified object and can deny.

---


## Understanding OPA in Authorization vs Admission Control

![Alt text](../images/38d.png)

In **Day 35**, we introduced **Webhook Authorization** and discussed how Kubernetes can outsource access decisions to tools like **OPA (Open Policy Agent)** or **Gatekeeper**, enabling both **authorization** and **policy enforcement**.

Now, in **Day 38**, we go deeper—clarifying the distinction between **Webhook Authorization** and **Admission Controllers**, and why many production environments use both.

---

### Why OPA for Authorization and Admission Control?

**Open Policy Agent (OPA)** is a flexible policy engine that can be used in Kubernetes for both *Webhook Authorization* and *Admission Control*. As a **Webhook Authorizer**, OPA evaluates the *request metadata* — such as `user`, `verb`, `namespace`, and `resource` — to decide whether a request should be allowed. While this mode offers advanced capabilities like *network-aware* or *time-aware* authorization (e.g., only allow resource deletions after business hours or from a corporate IP range), it does **not** see the object being requested, like Pod specs or container images. This mode is typically used in **high-security environments** that need granular, context-aware access control beyond what Kubernetes RBAC can express.

To inspect and validate the contents of Kubernetes resources (like ensuring a Pod uses a trusted image or enforcing labels), OPA can be used as a **Validating Admission Controller**. In this role, it participates in the Kubernetes *admission phase*, allowing evaluation of the full resource spec before it is persisted. This enables policies based on labels, security contexts, volume types, annotations, and more. However, OPA by itself does not offer native Kubernetes integration, resource syncing, or CRD-based policy definitions — which limits its out-of-the-box usability in Kubernetes environments.

This is where **Gatekeeper** comes in — a Kubernetes-native project built on top of OPA and maintained under the **CNCF (as an incubating project)**. Gatekeeper simplifies deployment by registering the necessary admission webhooks automatically, defining policies through familiar Kubernetes CRDs (`ConstraintTemplate` and `Constraint`), and synchronizing cluster state so that policies can reference existing resources. While OPA remains the core policy engine (OPA itself is not a CNCF project), Gatekeeper extends its capabilities to offer audit features, dry-run mode, and robust ecosystem support — making the combination of OPA + Gatekeeper the most powerful and production-ready choice for policy enforcement in Kubernetes.

---

### Two Ways to Use OPA in Kubernetes

| Role                 | Mode                           | Use Case                                        | Visibility Scope                                            | Typical Actions         |
| -------------------- | ------------------------------ | ----------------------------------------------- | ----------------------------------------------------------- | ----------------------- |
| Webhook Authorizer   | `--authorization-mode=Webhook` | Authorization (**Who can do what?**)            | User, group, verb, resource, namespace                      | Allow, Deny, No opinion |
| Admission Controller | Validating/Mutating Webhook    | Policy Enforcement (**Under what conditions?**) | Full request body (e.g., Pod spec, metadata, image, labels) | Validate or Mutate      |


---

### 🔐 OPA as a Webhook Authorizer: When RBAC Isn’t Enough

While Kubernetes RBAC handles most standard access control needs, some organizations require **richer, context-aware authorization** that RBAC simply cannot express. In such cases, OPA (Open Policy Agent) can be used as a **Webhook Authorizer**, configured via the API server flag:

```bash
--authorization-mode=Webhook
```

This allows Kubernetes to **outsource authorization decisions** to an external service like OPA, which can apply sophisticated policies involving HR systems, VPN checks, time windows, and more.

---

### ✅ When to Use OPA for Webhook Authorization

Use this approach when RBAC cannot answer policy questions like:

* **"Is the user active in our HR system?"**
* **"Is it after business hours?"**
* **"Did the request come from our corporate VPN?"**

OPA's decision is based on the **attributes of the request**, such as:

* `user` (username)
* `groups` (user’s group membership)
* `serviceAccount` (if the request is from a workload)
* `verb` (e.g., `create`, `update`, `delete`)
* `resource` (e.g., `pods`, `deployments`)
* `namespace` (target namespace of the request)
* `apiGroup`, `subresource`, etc.

> 📌 OPA **does not receive the full object** (like the Pod spec). It only receives metadata about the **request**, not its contents.

---

### Common Webhook Authorization Policies with OPA

| Policy Type               | Example Policy                                                               |
| ------------------------- | ---------------------------------------------------------------------------- |
| **Time-based access**     | Allow `delete` on resources **only after 6 PM** or during non-business hours |
| **HR system integration** | Only users marked **“active”** in an HR database may create resources        |
| **Network-aware checks**  | Deny requests that **do not originate from corporate VPN CIDRs**             |
| **Org-specific rules**    | Restrict access to production only to members of a **specific team**         |

---


### Why Use This in Production If Admission Controllers Can Validate?

Even though admission controllers can enforce security and compliance policies based on full object content, **Webhook Authorization still plays a critical role**:

1. **Early Rejection (Before Admission Stage)**

   * Prevents unauthorized actions before hitting downstream components like admission controllers or etcd.
   * Saves CPU/memory cycles by blocking earlier in the request lifecycle.

2. **Centralized Access Decisions (Multi-Cluster Use)**

   * Useful for large orgs managing many clusters.
   * Authorization decisions can be offloaded to a centralized OPA server (e.g., via Envoy + OPA bundle).

3. **RBAC Augmentation (Without Replacing It)**

   * OPA policies can run alongside RBAC to enforce “soft” or context-dependent rules.
   * You can still keep core permissions in RBAC, using OPA only for edge cases.

> **📌 Note:** Webhook Authorization using **OPA** is **rarely implemented in production**. Most organizations rely on **RBAC for standard authorization**, while **OPA/Gatekeeper or Kyverno** serve as **admission controllers** to enforce policy compliance at the request level. Webhook Authorization via OPA is typically found in **high-security environments** or **multi-cluster deployments**, where centralized and dynamic access control is essential to manage complex authorization scenarios.

---



### 🔐 **OPA as an Admission Controller (Validation + Mutation Layer)**

Use OPA (or Gatekeeper) as an admission controller when you need to enforce **granular compliance, security, and governance policies** inside the cluster. This role is **ideal for regulating *how* resources are deployed**, rather than *who* is deploying them.

---

###  **What OPA Sees (High Visibility)**

As an admission controller, OPA has access to the **entire request body**, allowing it to inspect and evaluate:

* Pod specs and Deployment configurations
* Container image names and registries
* Security contexts (e.g., runAsUser, privileged)
* Labels, annotations, and resource limits
* Custom fields defined in CRDs

📌 **This high visibility allows deep inspection and enforcement**, which is not possible in the authorization phase.

---

### **What OPA Does (Validation & Mutation)**

OPA or Gatekeeper can:

* **Validate requests**: Ensure they meet compliance and organizational policies.
* **Mutate requests**: Modify incoming resource specs before they are persisted in etcd.

💡 *Mutation support is available via Gatekeeper’s mutation CRDs or through direct Rego policies with OPA Gatekeeper’s mutation capabilities.*

---

### **Examples of Admission Control Policies**

* **Only allow images from `registry.pinkcompany.com`**
  Prevent developers from pulling untrusted or public images.

* **Containers must not run as root**
  Enforce security hardening by blocking privileged workloads.

* **All Pods must have `team` and `env` labels**
  Enforce tagging for traceability, billing, or team-level ownership.

* **Inject default labels if missing**
  Automatically mutate requests to include compliance-required fields.

---

### **Limitations**

* **OPA admission controller cannot decide *who* can take an action** (that’s the job of authorization).
* **It operates after initial authentication and authorization are completed**—meaning it cannot block requests early, only validate or modify them before the resource is stored.

---

### **Best Suited For:**

* **Security enforcement** (e.g., pod security, image verification)
* **Compliance** (e.g., mandatory labels, runtime configurations)
* **Governance** (e.g., namespace isolation rules, team conventions)
* **Automated mutation** (e.g., injecting annotations, sidecars, or defaults)

---

### Clarifying the Confusion: Authorization vs Admission Validation

In **Day 35**, we said:
> "You can deny a request if the image is not from `registry.pinkcompany.com`."

Important clarification:
- If OPA is used as a **Webhook Authorizer**, it **cannot** make this decision — it does not see the image field.
- If OPA is used as an **Admission Controller**, it **can** inspect the image and deny based on policy.

Rule of Thumb:
- User-based rules → Webhook Authorization.
- Resource-based rules → Admission Controller.

---

### What Do Enterprises Use in Production?

![Alt text](../images/38e.png)

Most production clusters use a **layered authorization and admission model** to balance security, flexibility, and operational simplicity:

* **Node Authorizer** handles requests from kubelets (e.g., secrets, Pod status).
* **RBAC** is the most widely used for managing **user and service account permissions**.
* **Webhook Authorizer** (e.g., OPA) is **less commonly used** due to operational complexity and latency risks — typically found in **high-security or multi-cluster environments** where dynamic, external policy evaluation is critical.
* **Admission Controllers** (e.g., OPA/Gatekeeper, Kyverno) are heavily adopted for enforcing **deep object-level policies**, such as disallowing privileged containers or enforcing image provenance.

Typical API server configuration:

```bash
--authorization-mode=Node,RBAC
--enable-admission-plugins=MutatingAdmissionWebhook,ValidatingAdmissionWebhook,PodSecurity,ResourceQuota
```

Which mechanisms are used depends on:

* **Security/compliance requirements** (e.g., CIS Benchmarks, PCI, HIPAA).
* **Performance and latency sensitivity** (Webhook adds external call overhead).
* **Cluster architecture** (single-tenant vs multi-tenant, centralized vs federated control).

**Key Clarification**

While Webhook **Admission Controllers** (for OPA, Kyverno, etc.) are widely used, **Webhook Authorization** is **not commonly enabled** in typical enterprise setups unless there's a need for **fine-grained, externalized authorization** logic. RBAC is almost always the backbone for access control.

---

### Custom Admission Controllers Beyond OPA

In production, several tools are used for admission control:
- Kyverno: Kubernetes-native, policy-as-YAML, easier than Rego.
- OPA + Gatekeeper: Powerful Rego-based policies with CRDs.
- Custom Webhooks: Custom Go/Java/Python services running in-cluster.

Yes, you can write your **own admission controller** as a webhook that listens for create/update events and responds with allow, deny, or patch instructions.

---

### Decision-Making Framework: When to Use What?

| Scenario                           | Webhook Authorization | Admission Controllers |
| ---------------------------------- | --------------------- | --------------------- |
| User-identity-based access control | ✅ Yes                 | ❌ No                  |
| Policy enforcement on object specs | ❌ No                  | ✅ Yes                 |
| Need to mutate or inject values    | ❌ No                  | ✅ Yes                 |
| Multi-cluster access governance    | ✅ Yes                 | ✅ Yes                 |

---

### Admission Controller Execution Sequence

The **execution sequence** of admission controllers is divided into two phases: first, all **Mutating** admission controllers run (in the order they're listed); then, all **Validating** controllers run (also in listed order). This ensures that objects are fully mutated before validation.

---

### Admission Controller Sequence

![Alt text](../images/38f.png)

1. **All Mutating Admission Controllers** are executed **first**, in the order they are configured in `--enable-admission-plugins`.

   * This includes both **purely mutating** plugins (e.g., `MutatingAdmissionWebhook`, `DefaultStorageClass`) and the **mutating phase of dual-function controllers** (e.g., `LimitRanger`, `ServiceAccount`).

2. The object is modified in-memory (not yet persisted).

3. **All Validating Admission Controllers** are executed **next**, in the configured order.

   * This includes both **purely validating** plugins (e.g., `PodSecurity`, `ResourceQuota`) and the **validating phase of dual-function controllers**.

4. If **any validating controller rejects** the request, it is **denied immediately**, and the user gets an error.

5. If all controllers pass, the request is accepted and the object is persisted to `etcd`.

---

### Example:

Let’s say the following controllers are enabled in this order:

```bash
--enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota
```

Execution would be:

* **Mutating Phase** (in order):

  1. `NamespaceLifecycle` (has no mutating logic — skipped)
  2. `LimitRanger` (mutates default limits)
  3. `ServiceAccount` (auto-assigns default SA)
  4. `MutatingAdmissionWebhook` (e.g., sidecar injection)

* **Validating Phase** (in order):

  1. `NamespaceLifecycle` (validates namespace state)
  2. `LimitRanger` (validates limits fall within bounds)
  3. `ServiceAccount` (validates SA exists)
  4. `ValidatingAdmissionWebhook` (e.g., OPA policy check)
  5. `ResourceQuota` (enforces resource limits)

---

### Key Takeaways

* The **category (mutating, validating, dual)** is for understanding; **Kubernetes runs controllers based on function**, not label.
* **Dual-function plugins are split internally** — their mutating logic runs in the mutating phase, and validating logic runs later.
* The **execution order is exactly as listed in `--enable-admission-plugins`**, **not grouped by type**.

---

### Conclusion

Admission controllers give Kubernetes administrators a final opportunity to evaluate and enforce policies before a resource is accepted into the cluster. By chaining together **built-in admission plugins** with **custom webhook controllers**, you gain fine-grained control over **what gets deployed**, **how it gets deployed**, and **under what conditions**.

As clusters scale and teams grow, enforcing standards through admission control becomes essential — not optional. Tools like OPA and Kyverno make it easier to define and apply organization-wide policies without writing custom code, ensuring both **security and consistency**.

---

### References

* Kubernetes Docs – Admission Controllers:
  [https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)

* Dynamic Admission Control (Webhook Configuration):
  [https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/)

* OPA Gatekeeper Project (CNCF Sandbox):
  [https://open-policy-agent.github.io/gatekeeper/](https://open-policy-agent.github.io/gatekeeper/)

* Kyverno Admission Controller:
  [https://kyverno.io/](https://kyverno.io/)

