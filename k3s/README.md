# k3s Deployment

Replaces the old Docker Compose + Caddy production stack. k3s's built-in Traefik ingress controller
does the reverse-proxy routing that Caddy used to do, and cert-manager handles automatic HTTPS.
`docker-compose.dev.yml` at the repo root is unaffected -- it's still the local dev Postgres.

This is a fresh start in a new cluster, not a migration of the old Docker Compose deployment's data --
no dump/restore step here. The api container is fully self-sufficient on boot: its Dockerfile `CMD`
runs `prisma migrate deploy` and then the app seeds itself (`src/prisma/seed.service.ts`) before it
starts listening, on every boot (first install, redeploy, or crash-restart). There's no separate
migrate/seed Job to run.

## Prerequisites

- A k3s cluster (Traefik ingress ships with k3s by default; don't disable it).
- [cert-manager](https://cert-manager.io/docs/installation/) installed in the cluster.
- DNS: an A record for your domain (`cleanbrain.me` in these manifests) pointing at the cluster's
  ingress IP.
- Firewall: 80/tcp (ACME HTTP-01 challenge) and 443/tcp (site traffic) open. Port 3000 is no longer
  used in production -- that was the old Caddy setup's custom port.
- A GitHub PAT (or `GITHUB_TOKEN` in CI) with `write:packages` scope to push images to
  `ghcr.io/cleanbrain-developer`.

## 1. Build and push images

From the repo root, on any machine with Docker:

```bash
docker login ghcr.io -u <your-github-username>   # paste the PAT when prompted

docker build -f apps/api/Dockerfile -t ghcr.io/cleanbrain-developer/english-core-speaking-api:latest .
docker push ghcr.io/cleanbrain-developer/english-core-speaking-api:latest

docker build -f apps/web/Dockerfile -t ghcr.io/cleanbrain-developer/english-core-speaking-web:latest .
docker push ghcr.io/cleanbrain-developer/english-core-speaking-web:latest
```

Tag with something more specific than `latest` for real releases (git SHA, semver, ...) and bump
`k3s/kustomization.yaml`'s `images[].newTag` accordingly -- `latest` is fine to get started with but
makes rollbacks harder to reason about. By default the GHCR package is private; either make it public
or grant the cluster's pull credentials access (see "Private package" below).

## 2. First-time cluster setup

```bash
kubectl apply -f k3s/00-namespace.yaml

# Secret: copy the template, fill in real values, apply (never commit the real file)
cp k3s/01-secret.example.yaml k3s/secret.yaml
# edit k3s/secret.yaml
kubectl apply -f k3s/secret.yaml

# ClusterIssuer: skip if the cluster already has one (kubectl get clusterissuer)
cp k3s/06-cluster-issuer.example.yaml k3s/cluster-issuer.yaml
# edit k3s/cluster-issuer.yaml (real email)
kubectl apply -f k3s/cluster-issuer.yaml
```

If the GHCR packages are private, also create an image pull secret and reference it from
`k3s/04-api.yaml` / `k3s/05-web.yaml` (`spec.template.spec.imagePullSecrets`):

```bash
kubectl -n speaking-core create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=<your-github-username> \
  --docker-password=<PAT with read:packages>
```

## 3. Deploy

```bash
kubectl apply -k k3s/
kubectl -n speaking-core wait --for=condition=ready pod -l app=postgres --timeout=120s
kubectl -n speaking-core rollout status deployment/api    # migrate + self-seed happens here
kubectl -n speaking-core rollout status deployment/web
```

`rollout status` on `api` won't report success until its readiness probe passes, which only happens
after migrations and seeding finish inside the container -- so a clean rollout already confirms both
worked. Check `kubectl -n speaking-core logs deployment/api` if it's taking a while.

## 4. Verify

```bash
kubectl -n speaking-core get pods,svc,ingress
curl https://cleanbrain.me/api/health
```

Then log in with Google in a browser and confirm the daily queue and the Chunk 스피킹 드릴 card both
load.

## Redeploying after a code change

```bash
docker build -f apps/api/Dockerfile -t ghcr.io/cleanbrain-developer/english-core-speaking-api:<tag> . && docker push ...
docker build -f apps/web/Dockerfile -t ghcr.io/cleanbrain-developer/english-core-speaking-web:<tag> . && docker push ...

# bump k3s/kustomization.yaml's images[].newTag to <tag>, then:
kubectl apply -k k3s/
kubectl -n speaking-core rollout status deployment/api
kubectl -n speaking-core rollout status deployment/web
```

Schema changes and `data/*.json` content changes both apply automatically on this rollout -- no
extra step, since every new `api` pod migrates and re-seeds itself before it takes traffic.
