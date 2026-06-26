# FIFA World Cup 2026 Hub

Static React app for World Cup 2026 — host on **Cloudflare Pages** or GitHub Pages, **manual score updates** via AWS Lambda (no paid API).

---

## Quick start

```bash
npm install
npm run dev
```

### Default edition (`/` redirect)

Control whether visiting `/` redirects to a tournament year (e.g. `/2026`) or shows the edition picker.

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_DEFAULT_EDITION=2026` | `.env.local` (local dev) | Redirect `/` → `/2026` when `/api/config` isn’t available |
| `DEFAULT_EDITION=2026` | Cloudflare Pages → **Settings → Environment variables** | Same behavior in production |

**Local setup:** create `.env.local` in the project root (same folder as `package.json`):

```
VITE_DEFAULT_EDITION=2026
```

Restart `npm run dev` after changing env vars. Leave the value empty or omit the file to show the edition picker at `/`.

**Production:** set `DEFAULT_EDITION` in Cloudflare Pages (Production environment), then redeploy. The `/api/config` Pages Function reads this value.

**Hosting (pick one):**

| Platform | Auto-deploy workflow |
|----------|----------------------|
| **Cloudflare Pages** (recommended) | `deploy-cloudflare-pages.yml` |
| GitHub Pages | `deploy-pages.yml` — Settings → Pages → Source: **GitHub Actions** |

---

## Auto-deploy: Cloudflare Pages + AWS Lambda

Push to `main` → GitHub Actions deploys the **website** to Cloudflare and the **score API** to AWS Lambda.

### 1. GitHub repository secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Used for |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | Deploy site to Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (dashboard URL) |
| `AWS_ACCESS_KEY_ID` | Deploy Lambda |
| `AWS_SECRET_ACCESS_KEY` | Deploy Lambda |
| `AWS_REGION` | e.g. `us-east-1` |
| `SCORE_API_GITHUB_TOKEN` | Lambda PAT — **Contents: write** on this repo |
| `SCORE_API_ADMIN_KEY` | Random secret — send as `X-Admin-Key` when updating scores |

Optional **variable** (not secret): `CLOUDFLARE_PAGES_PROJECT` — default `fifaworldcup`.

### 2. Cloudflare (one-time)

1. [Create API token](https://dash.cloudflare.com/profile/api-tokens) → template **Edit Cloudflare Workers** or custom with **Account → Cloudflare Pages → Edit**.
2. Copy **Account ID** from Cloudflare dashboard (right sidebar).
3. Create Pages project (first deploy can do this):

```powershell
npx wrangler pages project create fifaworldcup --production-branch=main
```

Or create an empty project named `fifaworldcup` in the Cloudflare dashboard.

4. Push to `main` — workflow `Deploy Cloudflare Pages` builds `dist/` and deploys.

Site URL: `https://fifaworldcup.pages.dev` (or your custom domain in Cloudflare).

#### In-page score updates (Cloudflare Pages Function)

The site includes a **Pages Function** at `/api/update-match` (folder `functions/`). On each match row, tap the **score / vs** between the flags to open a popup and save.

**Cloudflare dashboard → Pages → your project → Settings → Environment variables** (Production):

| Name | Value |
|------|--------|
| `GITHUB_TOKEN` | GitHub PAT with **Contents: write** on this repo |
| `GITHUB_REPO` | `KadenMai/FifaWorldCup` |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_API_KEY` | long random secret — enter the same value in the popup |

After saving env vars, **redeploy** the Pages project (new deployment required for functions to pick up secrets).

Test health: `GET https://your-site.pages.dev/api/health`

**Note:** Score editing works on the deployed Cloudflare site, not `npm run dev` (unless you run `npx wrangler pages dev`).

### 3. AWS Lambda (optional — skip if using Cloudflare Function above)

IAM user for GitHub Actions needs: `AWSCloudFormationFullAccess`, `AWSLambda_FullAccess`, `AmazonS3FullAccess` (SAM uses a staging bucket), `IAMFullAccess` (SAM creates execution role). For production, tighten to a dedicated deploy role.

1. Add AWS secrets (step 1).
2. Push any change under `aws-lambda/` — workflow `Deploy AWS Lambda` runs SAM:

```
sam build → sam deploy → stack fifaworldcup-score-api
```

3. After first successful run, open the workflow **Summary** for the **Function URL**, or:

```powershell
aws cloudformation describe-stacks --stack-name fifaworldcup-score-api `
  --query "Stacks[0].Outputs[?OutputKey=='FunctionUrl'].OutputValue" --output text
```

**Local first deploy (optional):**

```powershell
cd aws-lambda
sam build
sam deploy --guided
# Use same parameter names as template.yaml
```

### 4. Update score via Lambda (after deploy)

```powershell
$headers = @{
  "Content-Type" = "application/json"
  "X-Admin-Key"  = "YOUR_SCORE_API_ADMIN_KEY"
}
$body = @{ matchId = "match-001"; homeScore = 2; awayScore = 1; status = "Finished" } | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "YOUR_FUNCTION_URL" -Headers $headers -Body $body
```

Lambda commits to GitHub → Cloudflare Pages workflow redeploys the site with new scores.

---

## Manual score updates (recommended — $0)

You update scores yourself. The script recalculates **standings** and bumps **cache version** automatically.

### Option A — On your PC (simplest)

```powershell
# Example: Mexico 2-0 South Africa, match finished
python scripts/manual_update_match.py match-001 2 0 Finished

git add public/data/2026
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

**Do not paste only `lambda_handler.py` in the Lambda code editor** — it imports other modules and `requests`, which are not in the Lambda runtime. You must upload a **.zip**.

Files in `aws-lambda/`:

| File | Required |
|------|----------|
| `lambda_handler.py` | Yes |
| `github_store.py` | Yes |
| `score_update_lib.py` | Yes |
| `requests` (from pip) | Yes — included in zip by script below |

**Recommended — build zip:**

```powershell
cd aws-lambda
.\package.ps1
```

Upload `aws-lambda/lambda.zip` in the Lambda console (**Upload from** → `.zip file`).

Set **Handler** to: `lambda_handler.handler`  
Set **Runtime** to match your zip (e.g. Python 3.12).

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
| `public/data/2026/matches.json` | Score + status for that match |
| `public/data/2026/standings.json` | Recalculated from all **Finished** group matches |
| `public/data/2026/meta.json` | `dataVersion` timestamp (cache bust) |

Knockout bracket is derived from group results + fixture rules in code.

---

## Architecture (all free)

| Part | Service | Cost |
|------|---------|------|
| Website | Cloudflare Pages or GitHub Pages | Free |
| Score API | AWS Lambda (auto-deploy) | Free tier |
| Data storage | JSON in GitHub repo | Free |
| Manual update (local) | Python script | Free |
| Manual update (remote) | Azure Functions or AWS Lambda | Free tier |
| Auto API sync | API-Football Pro | **Not required** — see below |

---

## Optional: API-Football auto-sync ($19/mo)

Only if you want automatic live scores from a third-party API.  
**Free API-Football plan does NOT include World Cup 2026.**

See `scripts/2026/sync_api_football.py` and workflow `sync-api-football.yml` (disabled unless you add `APIFOOTBALL_KEY` secret).

---

## Other scripts

| Script | Purpose |
|--------|---------|
| `scripts/manual_update_match.py` | Update one match locally (any edition via `--edition`) |
| `scripts/2026/generate-data.mjs` | Regenerate 2026 seed data |
| `scripts/2026/generate-knockout-matches.mjs` | Append 2026 knockout fixtures |
| `scripts/2026/sync-espn-kickoffs.mjs` | Sync 2026 group-stage kickoffs from ESPN |
| `scripts/2026/sync_api_football.py` | Optional API-Football sync for 2026 |
| `scripts/2026/build_team_map.py` | Build API-Football team ID map for 2026 |
| `azure-functions/` | HTTP API for remote score updates (Azure) |
| `aws-lambda/` | Score API + SAM template (`template.yaml`) |
| `.github/workflows/deploy-cloudflare-pages.yml` | Auto-deploy site to Cloudflare |
| `.github/workflows/deploy-aws-lambda.yml` | Auto-deploy Lambda on `aws-lambda/` changes |

---

## Regenerate 2026 seed data

```bash
node scripts/2026/generate-data.mjs
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site shows old scores | Hard refresh `Ctrl+Shift+R`; check `dataVersion` in `public/data/2026/meta.json` changed |
| `Match not found` | Use id from `matches.json` (e.g. `match-001`) |
| Azure / Lambda `Unauthorized` | Send header `X-Admin-Key` matching `ADMIN_API_KEY` |
| GitHub push from API fails | PAT needs **Contents: write** on the repo |
| Cloudflare deploy skipped | Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets |
| Lambda deploy skipped | Add `SCORE_API_GITHUB_TOKEN` and `SCORE_API_ADMIN_KEY` secrets |
| Lambda `Unable to import module` | Use GitHub Actions deploy (SAM build), not a single pasted file |
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
