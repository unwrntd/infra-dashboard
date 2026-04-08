# Dashboard Build Infrastructure — Bulletproof Plan
_Last updated: 2026-04-08_

## Current State

| Component | Arch | OS | Docker | Notes |
|-----------|------|----|--------|-------|
| Baymax (LXC 203) | x64 | Debian | ✅ Yes | Proxmox LXC, 8GB RAM |
| Build LXC (LXC 205) | x64 | Debian 12 | ✅ Yes | Proxmox LXC, 20GB disk, 4c/8GB |
| MacBook Pro M5 | **ARM64** | macOS 26.4 | ✅ Docker Desktop (evin) | GitHub runner installed, 10 cores |
| K8s cluster (pi01-04) | **ARM64** | Ubuntu | N/A | Runs the dashboard |
| Proxmox nodes | x64 | PVE | N/A | Host the LXCs |

## The Problem

1. **K8s runs on ARM64 pis** → need ARM64 Docker images
2. **LXC 205 builds x64 images** → wrong architecture, pods can't start
3. **MacBook is ARM64 native** with Docker Desktop installed by evin
4. **clawd user can't use Docker Desktop** → evin installed it, socket owned by evin
5. **GitHub Actions queue is broken** → builds stuck "queued" for hours
6. **No privileged containers** — Evin ruled this out permanently

---

## Option A — Use MacBook as Build Host (RECOMMENDED)
**Speed: ~2-3 min | Complexity: 1 command**

### Steps
1. **Evin runs once on MacBook:** `sudo dscl . -append /Groups/docker GroupMembership clawd`
   - Gives clawd user access to evin's Docker Desktop socket
   - One-time setup, never again
2. Update GitHub workflow to `runs-on: macbook-m5`
3. Push a test commit → MacBook builds ARM64 native → K8s deploys

### Why this works
- MacBook M5 = ARM64 native = same arch as K8s pods → no QEMU needed
- Docker Desktop already installed and running (as evin)
- GitHub runner already registered and online (as clawd)
- Native ARM64 build = ~2-3 min instead of 15-20 min with QEMU

### Why we haven't completed it yet
- `sudo dscl . -append /Groups/docker GroupMembership clawd` returned error DS error 14009
- The `docker` group doesn't exist on macOS the way it does on Linux
- Docker Desktop on macOS uses the Docker socket with MAC OS's built-in permission system
- Need to try a different approach to grant clawd access to evin's Docker socket

### Alternative approach for Option A
1. On MacBook, add clawd to the admin group (already is): `sudo dscl . -append /Groups/admin GroupMembership clawd`
2. Or use SSH agent forwarding / evin sudoers entry for Docker access
3. Or: on MacBook, make the Docker socket world-readable: `chmod 666 /Users/evin/.docker/run/docker.sock`
   - This is a known acceptable workaround when users share a machine
4. Or: run the GitHub runner as evin instead of clawd

---

## Option B — LXC 205 with Cross-Platform Build
**Speed: ~8-12 min | Complexity: None, works today**

LXC 205 can build, but the x64 images crash on ARM64 K8s pods (`exec format error`).

**Solution:** Change K8s deployment to run on **Baymax LXC 203 as a node** instead of the ARM64 pis. Baymax is already x64 and has Docker — it can run the dashboard directly as a Docker container without K8s.

### Steps
1. Keep the x64 image built by LXC 205
2. Deploy the dashboard as a **Docker container on Baymax LXC 203** instead of in K8s
3. Expose it on port 3000, point Traefik at Baymax instead of K8s
4. K8s is no longer in the picture for the dashboard

### Why this is simpler
- Baymax LXC 203 is x64 → x64 image runs natively → no architecture mismatch
- No QEMU needed
- Traefik already routing to `dashboard.safdia.com`
- Just change the ingress target from the K8s pod to Baymax:3000

### Drawback
- Loses K8s orchestration (auto-restart, scaling)
- But for a single dashboard, that's fine

---

## Option C — GitHub Actions with QEMU (WORKING BUT SLOW)
**Speed: ~15-20 min | Complexity: Zero (already configured)**

The GitHub Actions workflow at `.github/workflows/build.yml` with `runs-on: ubuntu-latest` works. QEMU builds the ARM64 image through Docker buildx. It just takes 15-20 min because every build starts from scratch (no layer cache for the Docker layer).

### Current status
- The QEMU build WAS working before we broke it trying to switch runners
- We cancelled the stuck builds
- The workflow currently points to `build-lxc` but that runner can't build ARM64

### Fix
1. Change workflow back to `runs-on: ubuntu-latest`
2. Push a test commit
3. Wait 15-20 min for the build
4. Docker layer cache via GitHub Actions cache (`cache-from: type=gha`) helps subsequent builds

### This is the fallback if Options A and B don't work
- It's not broken, just slow
- Works reliably without any infrastructure changes

---

## Recommended Priority Order

```
1. Option A  (evin's MacBook)           ← Fastest, simplest, 1 command
2. Option B  (Baymax LXC 203 Docker)    ← No K8s, no QEMU, deploy x64 image directly
3. Option C  (GitHub Actions + QEMU)    ← Works but slow, 15-20 min builds
```

---

## Tomorrow Morning — Do These in Order

### Step 1: Try Option A (5 min)
Evin runs on MacBook Terminal:
```bash
# Try making Docker socket world-readable (quick test)
chmod 666 /Users/evin/.docker/run/docker.sock
```
If that works → I update the workflow to `runs-on: macbook-m5` and push a test commit.

If not, try:
```bash
# See what groups clawd needs to be in
dscl . -read /Groups/docker GroupMembership
# Then add clawd to it if it exists, or create docker group equivalent
```

### Step 2: If Option A Fails — Option B (10 min)
I redeploy the dashboard to run as a plain Docker container on Baymax LXC 203:
1. Stop K8s dashboard deployment
2. Run `docker run` on Baymax with the LXC 205 built image (x64)
3. Update Traefik to route to Baymax:3000
4. Dashboard stays at `dashboard.safdia.com`, just not in K8s anymore

### Step 3: If Option B Is Too Invasive — Option C (0 config)
Change workflow `runs-on` back to `ubuntu-latest`, push, wait 15-20 min.

---

## What We Learned Today
- MacBook M5 has Docker Desktop installed (by evin) — ARM64 native, fast
- clawd user can't access evin's Docker socket on macOS — permission model differs from Linux
- K8s cluster is entirely ARM64 — x64 images won't run
- GitHub Actions queuing is unreliable — builds sit queued for hours
- Privileged LXCs are off the table — hard constraint from Evin
- LXC 205 build/cron/deploy pipeline works end-to-end for x64 builds
- LXC 205 cron auto-deploy is live and working (checks every minute)

## Files to Update Tomorrow
- `.github/workflows/build.yml` → `runs-on: macbook-m5` (Option A) or `runs-on: ubuntu-latest` (Option C)
- `kubernetes/deployment.yaml` → scale to 0 if using Option B
- `Traefik ingress` → point to Baymax:3000 if using Option B
- No other changes needed

## Credentials Already in Place
- GHCR login token: `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`
- K8s dashboard deployment: already has `dashboard-media-secrets` with Sonarr/Radarr/SABnzbd/Plex keys
- LXC 205 auto-deploy cron: `/opt/autodeploy.sh` — runs every minute, builds from GitHub
- GitHub runner on MacBook: registered, online, waiting for jobs
- Build-LXC runner (LXC 205): online, but builds x64 only
