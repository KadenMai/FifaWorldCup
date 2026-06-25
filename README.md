# FIFA World Cup 2026 Hub

Static React app for World Cup 2026 — **free GitHub Pages** hosting, **manual score updates** (no paid API).

---

## Quick start

```bash
npm install
npm run dev
```

Enable **GitHub Pages**: Settings → Pages → Source: **GitHub Actions** (uses `deploy-pages.yml`).

---

## Manual score updates (recommended — $0)

You update scores yourself. The script recalculates **standings** and bumps **cache version** automatically.

### Option A — On your PC (simplest)

```powershell
# Example: Mexico 2-0 South Africa, match finished
python scripts/manual_update_match.py match-001 2 0 Finished

git add public/data src/data/dataLoader.ts
git commit -m "Update match-001 score"
git push
```

GitHub Pages rebuilds in 1–3 minutes.

**Live match (in progress):**

```powershell
python scripts/manual_update_match.py match-010 1 1 Live
```

**Reset to not played:**

```powershell
python scripts/manual_update_match.py match-010 --status Scheduled
```

### Option B — Azure Function API (free tier)

Host a small API so you can update scores from your phone (Postman, shortcut, etc.) **without** opening the repo on your PC.

```
Your phone / PC
    → POST Azure Function (free)
        → reads matches.json from GitHub
        → updates score + recalculates standings
        → commits back to GitHub
    → GitHub Pages redeploys
```

**Cost:** Azure Consumption plan free grant = ~1M requests/month (plenty for manual updates).  
**No API-Football subscription needed.**

---

## Azure Function setup (step by step)

### 1. Create GitHub Personal Access Token

1. GitHub → **Settings → Developer settings → Fine-grained tokens**
2. Repository access: **only this repo**
3. Permissions: **Contents** → Read and write
4. Copy the token

### 2. Create Azure Function App

1. [Azure Portal](https://portal.azure.com) → **Create Function App**
2. Runtime: **Python 3.11**
3. Plan: **Consumption (Serverless)** — free tier eligible
4. After deploy, open **Configuration → Application settings** and add:

| Name | Value |
|------|--------|
| `GITHUB_TOKEN` | your GitHub PAT |
| `GITHUB_REPO` | `YourUsername/FifaWorldCup` |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_API_KEY` | long random secret (you choose) |

### 3. Deploy the function

Install [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local), then:

```powershell
cd azure-functions
pip install -r requirements.txt
copy local.settings.json.example local.settings.json
# Edit local.settings.json with your values for local test

func start
# Test: GET http://localhost:7071/api/health

func azure functionapp publish YOUR_FUNCTION_APP_NAME
```

### 4. Update a score via HTTP

```powershell
$headers = @{
  "Content-Type" = "application/json"
  "X-Admin-Key"  = "YOUR_ADMIN_API_KEY"
}
$body = @{
  matchId    = "match-001"
  homeScore  = 2
  awayScore  = 1
  status     = "Finished"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method POST `
  -Uri "https://YOUR_FUNCTION_APP.azurewebsites.net/api/update-match" `
  -Headers $headers `
  -Body $body
```

**JSON body:**

```json
{
  "matchId": "match-001",
  "homeScore": 2,
  "awayScore": 1,
  "status": "Finished"
}
```

**Status values:** `Scheduled`, `Live`, `Finished`, `Postponed`, `Cancelled`

### Option C — AWS Lambda API (free tier)

Same flow as Azure: HTTP POST → update GitHub JSON → Pages redeploy. Reuses `azure-functions/shared/` logic.

```
Your phone / PC
    → POST Lambda Function URL (free)
        → reads matches.json from GitHub
        → updates score + recalculates standings
        → commits back to GitHub
    → GitHub Pages redeploys
```

**Cost:** AWS Lambda free tier = ~1M requests/month (plenty for manual updates).

#### 1. GitHub token

Same as Azure Option B — fine-grained PAT with **Contents: write** on this repo.

#### 2. Create Lambda function

1. [AWS Console](https://console.aws.amazon.com/lambda) → **Create function**
2. Runtime: **Python 3.12** (or 3.11)
3. **Configuration → Environment variables:**

| Name | Value |
|------|--------|
| `GITHUB_TOKEN` | your GitHub PAT |
| `GITHUB_REPO` | `YourUsername/FifaWorldCup` |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_API_KEY` | long random secret |

4. **Configuration → General** → Timeout: **30 seconds**
5. **Configuration → Function URL** → Create (auth: **NONE** — API key is in `X-Admin-Key` header)

#### 3. Build and upload zip

```powershell
cd aws-lambda
.\package.ps1
```

Upload `aws-lambda/lambda.zip` in the Lambda console (**Upload from** → `.zip file`).

Set **Handler** to: `lambda_handler.handler`

#### 4. Update a score via HTTP

```powershell
$headers = @{
  "Content-Type" = "application/json"
  "X-Admin-Key"  = "YOUR_ADMIN_API_KEY"
}
$body = @{
  matchId    = "match-001"
  homeScore  = 2
  awayScore  = 1
  status     = "Finished"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method POST `
  -Uri "https://YOUR_FUNCTION_URL.lambda-url.REGION.on.aws/" `
  -Headers $headers `
  -Body $body
```

**Health check:** `GET` the same Function URL (no auth).

---

## What gets updated automatically

When you update one match, the tool updates:

| File | Change |
|------|--------|
| `public/data/matches.json` | Score + status for that match |
| `public/data/standings.json` | Recalculated from all **Finished** group matches |
| `src/data/dataLoader.ts` | `DATA_VERSION` timestamp (cache bust) |

Knockout bracket is derived from group results + fixture rules in code.

---

## Architecture (all free)

| Part | Service | Cost |
|------|---------|------|
| Website | GitHub Pages | Free |
| Data storage | JSON in GitHub repo | Free |
| Manual update (local) | Python script | Free |
| Manual update (remote) | Azure Functions or AWS Lambda | Free tier |
| Auto API sync | API-Football Pro | **Not required** — see below |

---

## Optional: API-Football auto-sync ($19/mo)

Only if you want automatic live scores from a third-party API.  
**Free API-Football plan does NOT include World Cup 2026.**

See `scripts/sync_api_football.py` and workflow `sync-api-football.yml` (disabled unless you add `APIFOOTBALL_KEY` secret).

---

## Other scripts

| Script | Purpose |
|--------|---------|
| `scripts/manual_update_match.py` | Update one match locally |
| `scripts/generate-fifa2026-data.mjs` | Regenerate all seed data |
| `azure-functions/` | HTTP API for remote score updates (Azure) |
| `aws-lambda/` | HTTP API for remote score updates (AWS Lambda) |

---

## Regenerate seed data

```bash
node scripts/generate-fifa2026-data.mjs
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site shows old scores | Hard refresh `Ctrl+Shift+R`; check `DATA_VERSION` changed |
| `Match not found` | Use id from `matches.json` (e.g. `match-001`) |
| Azure / Lambda `Unauthorized` | Send header `X-Admin-Key` matching `ADMIN_API_KEY` |
| GitHub push from API fails | PAT needs **Contents: write** on the repo |
| Lambda timeout | Set timeout to 30s; check `GITHUB_TOKEN` and repo name |
| Pages not updating | Settings → Pages → source must be **GitHub Actions** |

---

## Build

```bash
npm run build
npm run preview
```

---

## License

Personal / educational use. FIFA and team marks belong to their owners.
