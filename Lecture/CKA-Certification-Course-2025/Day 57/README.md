# Day 57: Kubernetes Control Plane Troubleshooting Guide | CKA Course 2025

## Video reference for Day 57 is the following:

[![Watch the video](https://img.youtube.com/vi/-jpnd2uiJlU/maxresdefault.jpg)](https://www.youtube.com/watch?v=-jpnd2uiJlU&ab_channel=CloudWithVarJosh)

---
## ⭐ Support the Project  
If this **repository** helps you, give it a ⭐ to show your support and help others discover it! 

---

## Table of Contents

* [Introduction](#introduction)
* [Control-Plane Basics (kubeadm clusters)](#control-plane-basics-kubeadm-clusters)
* [Pre-Requisites](#prerequisites-for-this-lecture)
* [kubeconfig & contexts (quick refresher)](#kubeconfig--contexts-quick-refresher)
* [Control-Plane Troubleshooting Scenarios (exam-style)](#control-plane-troubleshooting-scenarios-exam-style)
* [1) API server unreachable / `kubectl` times out](#1-api-server-unreachable--kubectl-times-out)
  * [Tooling primer: `ss` and the flags you’re using](#tooling-primer-ss-and-the-flags-youre-using)
  * [Established connections (remove `-l`)](#established-connections-remove--l)
* [2) etcd unhealthy → API server crashloop](#2-etcd-unhealthy--api-server-crashloop)
* [3) Pods stay **Pending** — scheduler unavailable *or* no feasible node](#3-pods-stay-pending--scheduler-unavailable-or-no-feasible-node)
* [4) Controller-Manager down → controllers inactive (no replicas, no GC)](#4-controller-manager-down--controllers-inactive-no-replicas-no-gc)
* [5) Certificates expired (very common exam task)](#5-certificates-expired-very-common-exam-task)
  * [After cert renewal: controller-manager & scheduler NotReady](#after-cert-renewal-controller-manager--scheduler-notready)  
* [Conclusion](#conclusion)
* [References](#references) &#x20;

---

## Introduction

This guide is a fast, exam-friendly playbook for **troubleshooting Kubernetes control-plane issues on kubeadm clusters**. It explains why control-plane components run as **static pods** (and how their **mirror pods** appear in `kubectl`), then walks you through high-signal triage for the most common failure modes: **API server unreachable (6443)**, **etcd unhealthy (2379/2380)**, **scheduler not placing pods**, **controller-manager not reconciling**, and **expired certificates**. Each scenario pairs crisp symptom checks (`ss`, `crictl`, logs) with minimal, reversible fixes (correcting flags in `/etc/kubernetes/manifests/`, rotating certs with `kubeadm`, restoring time sync). It’s written for **CKA candidates, SREs, and cluster admins** who need to diagnose quickly and change only what’s necessary.

---

### Prerequisites for this lecture

* **Day 7 — Kubernetes Architecture**

  * [Watch on YouTube](https://www.youtube.com/watch?v=-9Cslu8PTjU&ab_channel=CloudWithVarJosh)
  * [View GitHub repo](https://github.com/CloudWithVarJosh/CKA-Certification-Course-2025/tree/main/Day%2007)

* **Day 15 — Manual Scheduling & Static Pods**

  * [Watch on YouTube](https://www.youtube.com/watch?v=moZNbHD5Lxg&ab_channel=CloudWithVarJosh)
  * [View GitHub repo](https://github.com/CloudWithVarJosh/CKA-Certification-Course-2025/tree/main/Day%2015)

* **TLS in Kubernetes — Masterclass**

  * [Watch on YouTube](https://www.youtube.com/watch?v=J2Rx2fEJftQ&list=PLmPit9IIdzwQzlveiZU1bhR6PaDGKwshI&index=1&t=3371s&pp=gAQBiAQB)
  * [View GitHub repo](https://github.com/CloudWithVarJosh/TLS-In-Kubernetes-Masterclass)

---

## Control-Plane Basics (kubeadm clusters)

* **Who “schedules” control-plane pods?**
  They’re **static pods** started directly by the **kubelet**, not the scheduler. Manifests live in **`/etc/kubernetes/manifests/`** (`kube-apiserver.yaml`, `kube-controller-manager.yaml`, `kube-scheduler.yaml`, `etcd.yaml`). The kubelet **watches this folder** (`staticPodPath`) and (re)creates the pods from those files. If you delete a static pod from the API, it **comes back**—the file is the source of truth.

* **Why do static pods show up in `kubectl get pods`? → Mirror pods.**
  For every static pod it runs, the kubelet **publishes a read-only “mirror pod”** object to the API server so you can see status in `kubectl`.

  * **Name pattern:** `<podName>-<nodeName>` (e.g., `kube-apiserver-control-plane`).
  * **Behavior:** You can **see** status/logs via the mirror pod, but edits/deletes don’t change the real static pod. To modify/remove it, **edit/delete the file** in `/etc/kubernetes/manifests/`.
  * **Tip:** Mirror pods typically carry a mirror annotation and always show which **node** hosts the underlying static pod, making node mapping obvious.


---

## kubeconfig & contexts (quick refresher)

* Your `kubectl` uses a **kubeconfig** (default `~/.kube/config`) that defines **clusters**, **users** (credentials), and **contexts** (cluster+user+namespace).
* Common files on a kubeadm control plane:

  * `/etc/kubernetes/admin.conf` (admin kubeconfig)
  * Copy it to your workstation as `~/.kube/config` to manage the cluster.
* Handy commands:

  ```bash
  kubectl config get-contexts
  kubectl config use-context <name>
  kubectl config view --minify
  # set a default namespace in the current context
  kubectl config set-context --current --namespace dev
  ```

---

# Control-Plane Troubleshooting Scenarios (exam-style)

---

## 1) API server unreachable / `kubectl` times out

**Problem**
`kubectl get nodes` hangs or shows `connection refused` / `i/o timeout` to port **6443**.

**Likely causes**

* Bad flags / paths in `/etc/kubernetes/manifests/kube-apiserver.yaml` (certs, keys, `--advertise-address`, `--client-ca-file`, admission plugins).
* Port **6443** not listening or occupied by another process.
* Host firewall / cloud security group blocking **6443**.
* etcd unreachable (see your etcd scenario).

**Checks**

```bash
# Is the API server actually listening on 6443? (socket statistics)
sudo ss -lntp | grep 6443

# Is the apiserver container running or crash-looping? (CRI runtime view)
sudo crictl ps -a | grep kube-apiserver

# What is the apiserver complaining about? (log tail from CRI files)
sudo tail -n 50 /var/log/containers/kube-apiserver-*.log

# Any typos/wrong paths/addresses in the static pod manifest?
sudo sed -n '1,120p' /etc/kubernetes/manifests/kube-apiserver.yaml
```

**Fix**

* Correct wrong cert/key paths (under `/etc/kubernetes/pki/`), fix `--advertise-address` to the node’s reachable IP, clean up `--enable-admission-plugins`.
* Save the manifest; **kubelet auto-restarts** the static pod.
* Open/unblock **6443** in host firewall / security groups.

**Example**
`--advertise-address=127.0.0.1` in a multi-node cluster → remote `kubectl` can’t reach. Change to the control-plane node IP (e.g., `172.31.x.x`) and the API becomes reachable.

---

## Tooling primer: `ss` and the flags you’re using

**`ss` = socket statistics** (shows listening sockets and live connections).

Common flags you’ll use:

* `-t` → TCP only
* `-l` → **listening** sockets (servers waiting for connections)
* `-p` → show owning **process**
* `-n` → numeric output (skip DNS lookups)
* `-s` → summary totals

### Reading `ss -tlpns` (listening TCP sockets)

```
State   Recv-Q  Send-Q   Local Address:Port    Peer Address:Port  Process
LISTEN  0       4096         127.0.0.1:9099         0.0.0.0:*      users:(("calico-node",pid=2752,fd=6))
LISTEN  0       4096         127.0.0.1:9098         0.0.0.0:*      users:(("calico-typha",pid=1578,fd=7))
LISTEN  0       4096         127.0.0.1:2381         0.0.0.0:*      users:(("etcd",pid=1183,fd=14))
LISTEN  0       4096         127.0.0.1:2379         0.0.0.0:*      users:(("etcd",pid=1183,fd=7))
LISTEN  0       4096         127.0.0.1:10249        0.0.0.0:*      users:(("kube-proxy",pid=1538,fd=18))
LISTEN  0       4096         127.0.0.1:10248        0.0.0.0:*      users:(("kubelet",pid=927,fd=14))
LISTEN  0       4096         127.0.0.1:10257        0.0.0.0:*      users:(("kube-controller",pid=4600,fd=3))
LISTEN  0       4096         127.0.0.1:10259        0.0.0.0:*      users:(("kube-scheduler",pid=4561,fd=3))
LISTEN  0       4096         127.0.0.1:34961        0.0.0.0:*      users:(("containerd",pid=576,fd=10))
LISTEN  0       4096        127.0.0.54:53           0.0.0.0:*      users:(("systemd-resolve",pid=350,fd=17))
LISTEN  0       4096           0.0.0.0:22           0.0.0.0:*      users:(("sshd",pid=3924,fd=3),("systemd",pid=1,fd=87))
LISTEN  0       4096     172.31.35.156:2380         0.0.0.0:*      users:(("etcd",pid=1183,fd=6))
LISTEN  0       4096     172.31.35.156:2379         0.0.0.0:*      users:(("etcd",pid=1183,fd=8))
LISTEN  0       4096     127.0.0.53%lo:53           0.0.0.0:*      users:(("systemd-resolve",pid=350,fd=15))
LISTEN  0       4096                 *:5473               *:*      users:(("calico-typha",pid=1578,fd=6))
LISTEN  0       4096              [::]:22              [::]:*      users:(("sshd",pid=3924,fd=4),("systemd",pid=1,fd=88))
LISTEN  0       4096                 *:10256              *:*      users:(("kube-proxy",pid=1538,fd=17))
LISTEN  0       4096                 *:10250              *:*      users:(("kubelet",pid=927,fd=16))
LISTEN  0       4096                 *:6443               *:*      users:(("kube-apiserver",pid=7103,fd=3))
```

**Column meanings**

* **Local Address\:Port** → where **this VM** is listening (server side).
* **Peer Address\:Port** on a LISTEN row is **always** `0.0.0.0:*` (no specific peer yet).
* **Recv-Q / Send-Q** → current queued vs backlog capacity.

### Local vs Peer (quick mental model)

* **Local** = “where *I* am listening/connected.”
* **Peer** on a LISTEN row is wildcard (`0.0.0.0:*`) because there’s **no remote yet**. Firewalls/SGs still enforce who can actually connect.

---

## Established connections (remove `-l`)

To see who’s **actually talking** to whom, drop `-l`:

```bash
# Established TCP sessions only
ss -tnp state established | grep -i 172.31.44.224
# Local is your VM’s endpoint; Peer is the remote node/port.
```

**Example (control-plane view)**

```
[::ffff:172.31.35.156]:6443  [::ffff:172.31.44.224]:32192  # worker → apiserver
[::ffff:172.31.35.156]:10250 [::ffff:172.31.44.224]:40342  # worker/pod → control-plane kubelet
[::ffff:172.31.35.156]:5473  [::ffff:172.31.44.224]:47678  # calico felix ↔ typha
```

**Example (worker-1 view)**

```
172.31.44.224:34778   172.31.35.156:6443   # worker client → apiserver
172.31.44.224:10250   192.168.226.86:45078 # kubelet server → scraper/client
172.31.44.224:47662   172.31.35.156:5473   # calico felix → typha
172.31.44.224:22      223.228.207.145:35358# your SSH session
```

**Reading these lines**

* If the **Local** port is a well-known server port (e.g., **6443**, **10250**), that row is the **server side** on your VM.
* If the **Peer** port is the well-known one, your VM is the **client** to a remote server.

---

## 2) etcd unhealthy → API server crashloop

**Problem**
`kube-apiserver` logs show timeouts to **127.0.0.1:2379**, or the **etcd** pod is `CrashLoopBackOff`.

### Likely causes → How to fix

* **Wrong `--data-dir` / missing hostPath mount**
  *Fix:* Point `--data-dir` back to the host-mounted path (kubeadm default **/var/lib/etcd**) and ensure the volumeMount covers it; perms **root\:root 0700**.

* **Removed localhost from client URLs** (`--listen-client-urls` / `--advertise-client-urls`)
  *Fix:* For kubeadm “stacked” etcd, keep **[https://127.0.0.1:2379](https://127.0.0.1:2379)** or update `kube-apiserver` `--etcd-servers` to the node IP and ensure cert SANs match.

* **TLS cert/key path or SAN mismatch**
  *Fix:* Correct paths in `etcd.yaml`; if SANs are wrong, **renew etcd certs** with kubeadm (or reissue with proper SANs).

* **Disk full / slow I/O on etcd data dir**
  *Fix:* Free space on the filesystem hosting `/var/lib/etcd`; investigate I/O stalls; once healthy, consider `etcdctl defrag` if DB is large/fragmented.

* **Firewall/Security group blocks** (multi-node/HA etcd)
  *Fix:* Allow **2379/tcp** (client) and **2380/tcp** (peer) between members/control plane.

* **Clock skew** (TLS and raft can misbehave)
  *Fix:* Sync time (chrony/systemd-timesyncd) so nodes are within a few seconds.

### Quick checks (with what they tell you)

```bash
sudo crictl ps -a | grep etcd                    # etcd container state (running/crashing)
sudo tail -n 100 /var/log/containers/etcd-*.log  # recent etcd logs for path/TLS/disk errors
sudo ss -lntp | grep -E ':2379|:2380'            # who’s listening on etcd ports (server sockets)
df -h                                            # disk full?
sudo sed -n '1,160p' /etc/kubernetes/manifests/etcd.yaml | \
  grep -E '--data-dir|listen-client-urls|advertise-client-urls'
# ^ effective flags (data dir & URLs)

# etcd health (kubeadm defaults)
export ETCDCTL_API=3
export ETCDCTL_CACERT=/etc/kubernetes/pki/etcd/ca.crt
export ETCDCTL_CERT=/etc/kubernetes/pki/etcd/server.crt
export ETCDCTL_KEY=/etc/kubernetes/pki/etcd/server.key
etcdctl endpoint health                          # basic liveness
etcdctl endpoint status --write-out=table        # DB size, leader, alarms
```

### Symptom clues in logs (to pinpoint root cause)

* **Bad data dir / not mounted:** lines showing `"data-dir":"…"` and `"opened backend db","path":"…"` under an unexpected path; tiny DB + messages like “started as single-node” imply a **fresh/empty store**.
* **TLS issues:** `x509` errors, “no such file or directory” for cert/key paths.
* **Connectivity mismatch:** apiserver logs show timeouts to `127.0.0.1:2379` while etcd listens only on node IP (or vice versa).
* **Disk/I/O:** “no space left on device”, long WAL sync, fs errors.

That’s enough to **identify** the likely issue from the logs and **apply the minimal fix** quickly during the recording.

---

## 3) Pods stay **Pending** — scheduler unavailable *or* no feasible node

**Problem**
New Pods remain **Pending** and you don’t see a `Scheduled` event.

### Fast triage (20 seconds)

```bash
kubectl get pod <p> -o wide                     # NODE empty => unscheduled
kubectl describe pod <p> | sed -n '/Events:/,$p' # shows "0/N nodes are available: …" reasons
kubectl -n kube-system get pods | grep scheduler # scheduler pod health (static pod on kubeadm)
```

---

### A) Scheduler **unavailable**

**Likely causes**

* Bad `--kubeconfig` in `/etc/kubernetes/manifests/kube-scheduler.yaml`.
* Health/secure port mis-set (e.g., `--secure-port=0`); liveness probe fails.
* Clock skew breaks leader election.

**Checks**

```bash
# Show scheduler logs (works even if pod name changes)
kubectl -n kube-system logs -l component=kube-scheduler --tail=80

# Inspect effective flags
sudo sed -n '1,160p' /etc/kubernetes/manifests/kube-scheduler.yaml | \
  grep -E 'kubeconfig|secure-port|port'

timedatectl status   # NTP/time sync
```

**Fix**

* Point `--kubeconfig` to `/etc/kubernetes/scheduler.conf` and ensure certs exist.
* Restore `--secure-port=10259` (so liveness/healthz works).
* Sync time (chrony/systemd-timesyncd); wait for leader election to settle.

*Example:* `--kubeconfig` pointed to a wrong path → scheduler can’t auth to API → pods never schedule. Revert the path.

---

### B) Scheduler **running** but can’t place the Pod

**Common blockers**

* **Insufficient resources** (CPU/mem/ephemeral-storage vs *requests*).
* **Taints without tolerations** (e.g., control-plane taint).
* **Label/affinity/topology** mismatch (nodeSelector/affinity/anti-affinity/spread).
* **PVC Pending** / storage topology (SC, access mode, zone).
* **Extended resources** requested (GPU, hugepages) but not present.

**Checks**

```bash
kubectl describe pod <p> | sed -n '/Events:/,$p'  # exact text like:
# "0/N nodes are available: Insufficient cpu; node(s) had taint {...}; node affinity/selector mismatch …"

kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints
kubectl get pvc                                   # any volumes Pending?
```

**Fix**

* Lower requests or free capacity / add nodes.
* Add tolerations or remove/adjust taints.
* Correct labels/affinity/spread constraints.
* Fix StorageClass/zone/access mode so PVC binds.

---

## 4) Controller-Manager down → controllers inactive (no replicas, no GC)

**Problem**
You scale or create a Deployment, but **no new Pods appear**. Other controller actions stall: **Endpoints/EndpointSlices empty**, **CSR approvals** hang, **node lifecycle taints** don’t update, **garbage collection** (ownerReferences) doesn’t run.

### Likely causes

* `kube-controller-manager` **not running** / stuck **CrashLoopBackOff** / **not leader**.
* Bad **`--kubeconfig`** in `/etc/kubernetes/manifests/kube-controller-manager.yaml`.
* Health port broken (e.g., `--secure-port=0`) so **liveness probe fails**.
* Missing/mispointed **cluster-signing cert/key** (`--cluster-signing-cert-file`, `--cluster-signing-key-file`).
* Significant **clock skew** breaking leader election.

### Checks (what each tells you)

```bash
kubectl -n kube-system get pods -l component=kube-controller-manager
# Is the controller-manager pod healthy or crashlooping?

kubectl -n kube-system logs -l component=kube-controller-manager --tail=80
# Auth/flag errors (bad kubeconfig), probe failures, TLS/path issues.

sudo sed -n '1,160p' /etc/kubernetes/manifests/kube-controller-manager.yaml | \
  grep -E 'kubeconfig|secure-port|cluster-signing|feature-gates'
# Verify critical flags/paths and secure port.

kubectl get leases -n kube-system | grep controller-manager
# Is there an active leader election lease?

sudo ss -lntp | grep 10257
# Controller-manager health/secure port listening?
```

**Prove reconciliation is stalled**

```bash
kubectl create deploy cm-test --image=nginx --replicas=1
kubectl scale deploy cm-test --replicas=3
kubectl get deploy cm-test ; kubectl get rs,pods -l app=cm-test
# Desired=3 but ReplicaSet/Pods don’t increase while CM is down.

kubectl describe deploy cm-test | sed -n '/Events:/,$p'
# No "Scaled up replica set ..." events.
```

### Fix

* Restore **`--kubeconfig=/etc/kubernetes/controller-manager.conf`** and ensure the referenced certs exist.
* Restore **`--secure-port=10257`** so the liveness probe succeeds.
* Point **cluster-signing** flags to valid files under `/etc/kubernetes/pki/`.
* **Sync time** (chrony/systemd-timesyncd) if leader election is flapping.
* Save manifest—**kubelet auto-restarts** the static pod; watch leadership resume.

**Example**
`--cluster-signing-key-file` missing → CSRs remain **Pending**, new nodes can’t join. **Fix:** restore the key or correct the path; controller-manager restarts, CSR approvals proceed, and Deployments start scaling again.


Here’s a **single, stitched, exam-style** section you can drop into your repo. I’ve added **inline comments** to every command so viewers can follow along.

---

## 5) Certificates expired (very common exam task)

**Problem**
`x509: certificate has expired` in API server / kubelet logs; nodes flip **NotReady** and `kubectl` fails TLS.

**Likely causes**

* kubeadm-managed certs passed their **NotAfter** date.
* **Clock skew** makes otherwise-valid certs appear expired or not-yet-valid.

---

### Quick Checks (what’s wrong?)

```bash
sudo kubeadm certs check-expiration                 # kubeadm summary of all control-plane cert expiries
openssl x509 -in /etc/kubernetes/pki/apiserver.crt \
  -noout -enddate                                   # print API server cert NotAfter (expiry)
journalctl -u kubelet -p err --since "2h" | grep -i x509   # search recent kubelet errors for x509 messages
```

---
### Break (demo) — simulate expiry by jumping time

```bash
# Stop time sync so the clock won’t snap back automatically (pick whatever exists)
sudo systemctl stop systemd-timesyncd 2>/dev/null || true   # stop systemd-timesyncd if present
sudo systemctl stop chronyd 2>/dev/null || true             # stop chrony if present

# Jump node clock past current cert validity to force x509 failures
sudo date -s '2027-12-01 12:00:00'                          # set future date/time for the demo

# (Optional) Re-check to see the effect in tooling/logs
sudo kubeadm certs check-expiration                         # shows “expired” due to future clock
journalctl -u kubelet -p err --since "15m" | grep -i x509   # kubelet now logs cert errors
```

**Symptom you’ll show:** `kubectl` and kubelet report **expired / not yet valid** certs; nodes turn **NotReady**.

---

### Fix (exam way) — rotate with kubeadm, refresh kubeconfigs

```bash
# Renew all control-plane certs (server + client certs used by components)
sudo kubeadm certs renew all

# Re-generate kubeconfigs that embed client certs (admin, scheduler, controller-manager)
sudo kubeadm init phase kubeconfig all

# Restart kubelet so static pods (apiserver, etcd, CM, scheduler) reload new certs
sudo systemctl restart kubelet

# Use the fresh admin.conf for your kubectl (helpful on the control-plane node)
mkdir -p ~/.kube                                          # ensure kube config dir
sudo cp -f /etc/kubernetes/admin.conf ~/.kube/config      # copy new admin kubeconfig
sudo chown $(id -u):$(id -g) ~/.kube/config               # fix ownership for current user

# Verify cluster health after rotation
kubectl get nodes                                         # should return Ready once components settle
sudo kubeadm certs check-expiration                       # confirm fresh NotAfter dates
```

---

### Optional cleanup — restore real time **then re-renew** (important!)

> If you renewed while the clock was in the future, the new certs have **NotBefore in 2027**.
> After resetting time, **renew again** so certs are valid *now*.

```bash
# Restore correct time (enable exactly one time service)
sudo date -s 'NOW'                                        # snap back to current time
sudo systemctl start systemd-timesyncd 2>/dev/null || true # start systemd-timesyncd if used
sudo systemctl start chronyd 2>/dev/null || true          # or start chrony if that’s your NTP agent

# Re-issue certs with correct time (only needed if you renewed while clock was future)
sudo kubeadm certs renew all                              # mint certs with proper NotBefore/NotAfter
sudo kubeadm init phase kubeconfig all                    # refresh kubeconfigs again
sudo systemctl restart kubelet                            # reload components

# Use the fresh admin.conf for your kubectl (helpful on the control-plane node)
mkdir -p ~/.kube                                          # ensure kube config dir
sudo cp -f /etc/kubernetes/admin.conf ~/.kube/config      # copy new admin kubeconfig
sudo chown $(id -u):$(id -g) ~/.kube/config               # fix ownership for current user

# Final verification
kubectl get nodes                                         # Ready again
sudo kubeadm certs check-expiration                       # dates look sane (no future NotBefore)
```
---

## After cert renewal: controller-manager & scheduler NotReady

### Why this happens

1. **Time jump + reissued certs**
   When you renew certs while the clock is wrong (or flip time back), the controllers may fail to authenticate (NotBefore/NotAfter mismatch) until you **re-renew** with correct time and regenerate kubeconfigs. That part you already fixed.

2. **Stale containers in containerd after rapid restarts**
   The controller static pods get restarted many times during cert rotation. Occasionally **containerd leaves a dead container record** that still “owns” the name. Kubelet then can’t create the new container and you see:

   ```
   Error: failed to reserve container name "...": name "..._kube-system_..." is reserved for "<old-container-id>"
   ```

   This is a runtime bookkeeping issue, not an image or manifest bug.

---

### Fixing controller-manager

```bash
# List all controller-manager containers (running/exited)
sudo crictl ps -a | grep -i kube-controller-manager

# Force-remove any stuck/old container IDs you see
sudo crictl rm -f <CONTAINER_ID_1> <CONTAINER_ID_2>

# (Optional) if a pod sandbox is also stuck, remove it too:
sudo crictl pods | grep -i kube-controller-manager
sudo crictl stopp <POD_SANDBOX_ID>; sudo crictl rmp <POD_SANDBOX_ID>

# Nudge kubelet to resync static pods
sudo systemctl restart kubelet
```

**Verify:**

```bash
kubectl -n kube-system get pods -l component=kube-controller-manager
kubectl -n kube-system logs pod/<controller-manager-pod> --tail=50
kubectl -n kube-system get lease | grep controller-manager   # leader election healthy
```

---

### Fixing scheduler

Same pattern:

```bash
sudo crictl ps -a | grep -i kube-scheduler
sudo crictl rm -f <CONTAINER_IDs>
sudo crictl pods | grep -i kube-scheduler && \
  sudo crictl stopp <POD_SANDBOX_ID>; sudo crictl rmp <POD_SANDBOX_ID>
sudo systemctl restart kubelet
```

**Verify:**

```bash
kubectl -n kube-system get pods -l component=kube-scheduler
kubectl -n kube-system logs pod/<kube-scheduler-pod> --tail=50
kubectl -n kube-system get lease | grep scheduler
```

---

### Also double-check (common after cert work)

```bash
# Ensure kubeconfigs point to fresh certs
sudo kubeadm init phase kubeconfig all

# Confirm cert dates & that API auth works now
sudo kubeadm certs check-expiration
kubectl get nodes
```

---

### TL;DR

* The “**name is reserved for <ID>**” error = **stale containerd state** after many rapid restarts.
* **crictl rm -f** the old containers (and sandbox if needed), then **restart kubelet**.
* Ensure you **re-renewed certs with the correct system time** and regenerated the controller/scheduler kubeconfigs.

---

## Conclusion

When the control plane misbehaves, follow this rhythm:

1. **Probe the socket** first (`ss -lntp` for 6443/10257/10259; drop `-l` to see live peers).
2. **Read the logs** where the process actually runs (`/var/log/containers/*.log` via CRI).
3. **Trust the manifest**—fix flags and paths under `/etc/kubernetes/manifests/`; kubelet will reconcile the static pod.
4. **Validate etcd** health before blaming the apiserver.
5. **Confirm leader-election participants** (scheduler/controller-manager) and time sync.
6. **Rotate kubeadm-managed certs** when in doubt, then re-verify cluster state.
   Keep changes small, verify after each step, and let kubelet do the heavy lifting by re-creating static pods from their manifests.

---

## References

* [Create static Pods (mirror pod behavior)](https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/)
* [Certificate management with kubeadm](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
* [kubeadm certs (renew subcommands)](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm-certs/)
* [kubeadm certs renew all](https://kubernetes.io/docs/reference/setup-tools/kubeadm/generated/kubeadm_certs/kubeadm_certs_renew_all/)
* [kubeadm certs renew apiserver](https://kubernetes.io/docs/reference/setup-tools/kubeadm/generated/kubeadm_certs/kubeadm_certs_renew_apiserver/)
* [kube-scheduler reference](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-scheduler/)
* [kube-controller-manager reference](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-controller-manager/)
* [kube-apiserver reference](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/)
* [Operating etcd clusters for Kubernetes](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)
* [etcdctl: check cluster status & health](https://etcd.io/docs/v3.5/tutorials/how-to-check-cluster-status/)

---
