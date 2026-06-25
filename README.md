# FIFA World Cup 2026 Hub

Static React app for World Cup 2026 scores, standings, and knockout bracket.  
Data lives in `public/data/*.json` and can be updated automatically from [API-Football](https://www.api-football.com/).

---

## Quick start (local dev)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

---

## What you must do yourself (one-time setup)

### 1. Get an API-Football key

1. Sign up at [api-football.com](https://www.api-football.com/)
2. Subscribe to the **Free** plan (100 requests/day)
3. Copy your API key from the dashboard

### 2. Build the team ID map (required once)

API-Football uses numeric team IDs. This project uses slugs like `mexico`, `south-korea`.  
Run this **once** on your machine and commit the result:

**Windows (PowerShell):**

```powershell
$env:APIFOOTBALL_KEY = "YOUR_KEY_HERE"
pip install -r scripts/requirements-sync.txt
python scripts/build_team_map.py
```

**macOS / Linux:**

```bash
export APIFOOTBALL_KEY="YOUR_KEY_HERE"
pip install -r scripts/requirements-sync.txt
python scripts/build_team_map.py
```

This writes `scripts/team-map.json`. **Commit that file to GitHub.**

If some teams fail to match, edit `NAME_OVERRIDES` in `scripts/build_team_map.py` and run again.

### 3. Test sync locally (optional but recommended)

```bash
# same APIFOOTBALL_KEY as above
python scripts/sync_api_football.py
```

Dry run (no file writes):

```bash
# PowerShell
$env:DRY_RUN = "1"
python scripts/sync_api_football.py
```

### 4. Enable GitHub Actions auto-sync

1. Push this repo to GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Add repository secret:
   - Name: `APIFOOTBALL_KEY`
   - Value: your API key
4. Commit `scripts/team-map.json` (from step 2)
5. Go to **Actions → Sync API-Football data → Run workflow** to test manually

The workflow runs **every 30 minutes** (UTC) and:

- Calls API-Football (fixtures + standings = **2 requests per run**)
- Updates `public/data/matches.json` and `standings.json`
- Bumps `DATA_VERSION` in `src/data/dataLoader.ts` (cache bust)
- Commits and pushes if anything changed

### 5. Enable GitHub Pages (automatic deploy)

1. **Settings → Pages**
2. Source: **GitHub Actions**
3. Push to `main` (or `master`) — workflow `.github/workflows/deploy-pages.yml` builds and deploys `dist/`

After a data sync commit, the site rebuilds automatically.

---

## Automatic deployment flow

```
Every 30 min (GitHub Actions)
    → sync_api_football.py
    → commit JSON + push
    → deploy-pages.yml builds Vite app
    → GitHub Pages serves updated site
```

You do **not** need Azure Functions if you use GitHub Actions (free for public repos).

---

## Scripts reference

| Script | Purpose |
|--------|---------|
| `scripts/build_team_map.py` | Map API team IDs → local team slugs |
| `scripts/sync_api_football.py` | Pull fixtures + standings, write JSON |
| `scripts/generate-fifa2026-data.mjs` | Regenerate static seed data (no API) |
| `scripts/venue-map.json` | Stadium name aliases + timezones |
| `scripts/team-map.json` | API team ID → local `teamId` (you generate this) |

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APIFOOTBALL_KEY` | Yes | API-Sports key |
| `DRY_RUN=1` | No | Preview sync without writing files |
| `SKIP_VERSION_BUMP=1` | No | Skip `DATA_VERSION` update |

---

## API quota (free tier)

| Limit | Value |
|-------|--------|
| Requests / day | 100 |
| Requests / minute | 10 |
| This workflow | 2 calls × 48 runs/day ≈ **96 calls/day** |

To sync every **15 minutes**, upgrade to a paid API-Football plan or reduce to fixtures-only (1 call/run).

To change schedule, edit `.github/workflows/sync-api-football.yml`:

```yaml
- cron: "0 */30 * * *"   # every 30 min
# - cron: "0 */15 * * *" # every 15 min (needs paid plan)
```

---

## Azure Functions (optional)

The same Python script works on Azure:

1. Create a **Timer Trigger** function (Python 3.11+)
2. Set app setting `APIFOOTBALL_KEY`
3. Clone repo in `/tmp`, run `sync_api_football.py`, commit + push with a GitHub PAT

GitHub Actions is simpler for this project because data and site live in the same repo.

---

## Project structure

```
public/data/          ← JSON consumed by the app
src/                  ← React + TypeScript UI
scripts/              ← Sync + data tools
.github/workflows/    ← Auto sync + Pages deploy
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `team-map.json is empty` | Run `build_team_map.py` and commit the file |
| `unmapped teams` in sync log | Update `NAME_OVERRIDES` in `build_team_map.py` |
| API quota exceeded | Wait 24h or upgrade plan; increase cron interval |
| Site shows old data | Hard refresh (`Ctrl+Shift+R`); check `DATA_VERSION` bumped |
| Workflow push fails | Settings → Actions → General → allow workflows to write |
| Free plan missing WC 2026 | Verify key can call `league=1&season=2026` in API dashboard |

---

## Build commands

```bash
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

---

## License

Personal / educational use. FIFA and team marks belong to their owners.
