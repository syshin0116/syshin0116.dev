---
title: "Home-server agent delivery runbook"
description: >
  How the production Aegra agent runs on the Mac mini home server: Docker Compose,
  Tailscale Funnel, the launchd auto-deploy job, secrets, rollback, and verification.
when_to_read: >
  When the chat backend is down, before changing the home-server compose stack, rotating
  AGENT_AUTH_SECRET or the OpenAI key, moving the public origin, or rolling back a deploy.
tags: [operations, home-server, aegra, docker-compose, tailscale, launchd]
status: stable
updated: "2026-11-23"
owners: ["@syshin0116"]
refs:
  - ../../infra/home-server/compose.yaml
  - ../../infra/home-server/deploy.sh
  - public-anonymous-chat.md
  - cloud-run-delivery.md
template: runbook
---

# Home-server agent delivery runbook

Since 2026-11-15 the production agent runs on the Mac mini (`ssh sy-mac-mini`) instead of
Cloud Run, which is dormant while GCP billing is off ([cloud-run-delivery.md](cloud-run-delivery.md)).

```mermaid
flowchart LR
  browser[Browser] -->|HTTPS :10000| funnel[Tailscale Funnel]
  funnel --> agent["agent (127.0.0.1:18080)"]
  agent --> pg[(postgres volume)]
  maint[maintenance loop] --> pg
  vercel[Vercel web] -.->|mints JWT with AGENT_AUTH_SECRET| browser
  launchd[launchd every 5 min] -->|deploy.sh| agent
```

## Layout on the server

| Path | Contents |
| --- | --- |
| `~/srv/syshin0116.dev` | Detached checkout of the deployed `origin/main` revision |
| `~/srv/agent/.env` | `POSTGRES_PASSWORD`, `AGENT_PORT`, optional `TS_AUTHKEY` and `TS_HOSTNAME` (from `infra/home-server/dot-env.example`), mode 600 |
| `~/srv/agent/agent.env` | Runtime env (from `infra/home-server/agent.env.example`), mode 600 |
| `~/srv/agent/deploy.sh` | Copy run by launchd; each deploy refreshes it from the repo |
| `~/srv/agent/deployed-sha`, `deploy.log` | Last deployed revision and the deploy log |

The stack mirrors the former Cloud Run production map: one uvicorn worker, Redis off,
the guest launch tuple (`openai:gpt-6-luna`, 500000, 53837), and the guest maintenance
job as a 15-minute loop in the `maintenance` service. One Postgres role owns the database;
the Neon runtime/migration role split does not apply here.

## Deploy

`deploy.sh` runs every 5 minutes. It does nothing unless `origin/main` moved and that
commit's `ci/check` concluded `success`. Then it builds the image tagged with the short SHA,
runs `migrate`, replaces `agent` and `maintenance` with `--wait`, and smoke-tests `/live`,
`/ready`, and an unauthenticated `POST /threads` that must return `401`.

Run it by hand with `~/srv/agent/deploy.sh`. `--force` skips the `ci/check` gate and
redeploys the current revision; use it only for recovery.

A failed migration leaves the previous agent serving. A new image that fails its health
check is already in place, so roll back:

```bash
cd ~/srv/agent
docker image ls syshin0116-agent        # the three newest tags are kept
AGENT_IMAGE_TAG=<previous> docker compose -f ~/srv/syshin0116.dev/infra/home-server/compose.yaml \
  --project-directory ~/srv/agent up -d --wait agent maintenance
```

Rolling back across a schema migration is not supported; fix forward instead.

## Public origin

`tailscale funnel --bg --https=10000 http://127.0.0.1:18080` publishes
`https://sy-mac-mini.tail8d4638.ts.net:10000`. Ports 443 and 8443 on the same name serve
tailnet-only apps and must stay off Funnel. Vercel Production and Preview set
`NEXT_PUBLIC_AGENT_API_URL` to this origin; changing it needs a web redeploy because the
value is inlined at build time. Move to a custom domain (Cloudflare Tunnel) once one is
registered.

## Sidecar origin

The `tailscale` compose profile runs a sidecar that joins the tailnet as its own node
(`syshin0116-agent`, tag `tag:agent`) and Funnels `https://syshin0116-agent.tail8d4638.ts.net`
on 443 to `http://agent:8080` over the compose network, so the Mac mini needs no host port.
It is off until `TS_AUTHKEY` is set in `~/srv/agent/.env`; `deploy.sh` then starts it after
each deploy. A sidecar failure logs `warn ... tailscale sidecar is not healthy` and leaves
the host Funnel serving. Tailscale's free Personal plan covers this.

Cutover (owner steps, in order):

1. In the admin console, Access controls, add to the tailnet policy:

   ```json
   "tagOwners": { "tag:agent": ["autogroup:admin"] },
   "nodeAttrs": [ { "target": ["tag:agent"], "attr": ["funnel"] } ]
   ```

   Merge into existing `tagOwners` and `nodeAttrs` keys if they already exist.
2. Settings, Keys: generate an auth key with tag `tag:agent`, not ephemeral. Reusable is
   optional; the key is only read on first login, after which the `tailscale-state` volume
   holds the node identity.
3. On the Mac mini, set `TS_AUTHKEY=<key>` in `~/srv/agent/.env` (mode 600) and run
   `~/srv/agent/deploy.sh --force`.
4. Check `curl -fsS https://syshin0116-agent.tail8d4638.ts.net/ready` from outside the
   tailnet (Funnel DNS can take a few minutes after the first login).
5. Set Vercel Production and Preview `NEXT_PUBLIC_AGENT_API_URL` to
   `https://syshin0116-agent.tail8d4638.ts.net` and redeploy the web. Confirm a real chat.
6. After a few days on the new origin, remove the old path: `tailscale funnel --https=10000 off`
   on the host, then in a PR drop the agent `ports:` mapping and move the `deploy.sh` smoke
   checks to the sidecar origin.

Roll back by pointing `NEXT_PUBLIC_AGENT_API_URL` at the `:10000` origin again and
redeploying the web. To stop the sidecar, clear `TS_AUTHKEY` and run
`docker compose ... --profile tailscale stop tailscale`; delete the node in the admin
console only if it should not come back.

## Secrets

`AGENT_AUTH_SECRET` in `agent.env` must equal Vercel Production `AGENT_AUTH_SECRET`
(a sensitive variable, so it cannot be read back). To rotate, generate one value, write it
to both, then `deploy.sh --force` and redeploy the web. Old Cloud Run secrets in GCP Secret
Manager are unreachable while billing is off and are no longer used.

## Verify

```bash
curl -fsS https://sy-mac-mini.tail8d4638.ts.net:10000/ready
ssh sy-mac-mini 'cd ~/srv/agent && docker compose -f ~/srv/syshin0116.dev/infra/home-server/compose.yaml --project-directory . ps'
```

A real chat on https://syshin0116.vercel.app is the end-to-end check. Headless browsers get
`403` from the BotID-gated token route, which is expected.

## Known gaps

- No off-host Postgres backup yet; guest threads expire anyway, signed-in threads do not.
- Until the sidecar cutover, the agent holds host port `127.0.0.1:18080`.
- A reboot restarts the stack (`restart: unless-stopped`, OrbStack at login), but Funnel
  and launchd need the user session; enable auto-login on the Mac mini.
