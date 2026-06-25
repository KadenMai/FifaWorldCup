# FIFA World Cup 2026 Static Web App — Cursor Build Guide

## Goal
Build a mobile-friendly React web app for FIFA World Cup 2026 information. The app will be hosted as a static site using GitHub Pages or Cloudflare Pages.

There is no backend and no admin page. All data will be stored in local JSON files and updated manually by editing JSON files with Cursor or ChatGPT.

## Tech Stack
Use:

- React
- Vite
- TypeScript
- React Router
- CSS Modules or plain CSS
- Local JSON files under `/public/data/`
- Responsive mobile-first design

Do not use:

- Backend server
- Database
- Admin page
- GitHub token in frontend
- Login system

## App Features
The app should show all useful FIFA World Cup 2026 information:

- Teams
- Players
- Coaches
- Match schedule
- Match results
- Live/final scores from JSON
- Group standings / points table
- Stadiums / locations
- Match time by local timezone
- Weather placeholder by stadium/city
- Search and filters
- Mobile bottom navigation bar

## Project Structure
Create this structure:

```text
src/
  components/
    BottomNav.tsx
    Header.tsx
    MatchCard.tsx
    TeamCard.tsx
    PlayerCard.tsx
    CoachCard.tsx
    StadiumCard.tsx
    SearchBar.tsx
    FilterTabs.tsx
    StandingsTable.tsx
    WeatherCard.tsx
  pages/
    HomePage.tsx
    TodayGamesPage.tsx
    TeamsPage.tsx
    TeamDetailPage.tsx
    PlayersPage.tsx
    CoachesPage.tsx
    StadiumsPage.tsx
    StandingsPage.tsx
    MatchDetailPage.tsx
    WeatherPage.tsx
  data/
    dataLoader.ts
  types/
    index.ts
  App.tsx
  main.tsx
  styles/
    global.css
    mobile.css
public/
  data/
    teams.json
    players.json
    coaches.json
    matches.json
    stadiums.json
    standings.json
    weather.json
```

## Main Navigation
Desktop navigation should be at the top.

Mobile navigation should have a fixed bottom bar with 5 common buttons:

1. Today
2. Teams
3. Coaches
4. Locations
5. Weather

Use simple icons if available, but text is enough.

Mobile bottom bar requirements:

```css
position: fixed;
bottom: 0;
left: 0;
right: 0;
height: 64px;
```

Add bottom padding to page content so the bottom nav does not cover content.

```css
main {
  padding-bottom: 80px;
}
```

## Pages

### 1. Home Page
Route: `/`

Show:

- Hero section: FIFA World Cup 2026 Tracker
- Today’s matches
- Quick search
- Quick cards:
  - Teams
  - Matches
  - Standings
  - Stadiums
  - Weather

### 2. Today Games Page
Route: `/today`

Show matches happening today based on the user’s local date.

Allow filters:

- All
- Upcoming
- Live
- Finished

Each match card should show:

- Home team
- Away team
- Score
- Match status
- Date
- Time
- Stadium
- City
- Group/round

### 3. Teams Page
Route: `/teams`

Show all teams with search and filters.

Filters:

- Group
- Confederation
- Qualified / placeholder status

Team card should show:

- Flag
- Team name
- Group
- Coach
- FIFA ranking if available
- Matches count

Clicking a team opens `/teams/:teamId`.

### 4. Team Detail Page
Route: `/teams/:teamId`

Show:

- Team name
- Flag
- Coach
- Group
- Players
- Matches
- Points table row

### 5. Players Page
Route: `/players`

Show searchable player list.

Filters:

- Team
- Position
- Group

Player card should show:

- Name
- Team
- Position
- Shirt number
- Club if available

### 6. Coaches Page
Route: `/coaches`

Show all coaches.

Search by:

- Coach name
- Team

Coach card should show:

- Name
- Team
- Nationality
- Notes

### 7. Stadiums / Locations Page
Route: `/locations`

Show stadiums and host cities.

Filters:

- Country
- City

Stadium card should show:

- Stadium name
- City
- Country
- Capacity if available
- Matches hosted
- Weather summary placeholder

### 8. Standings Page
Route: `/standings`

Show group standings table.

Columns:

- Position
- Team
- Played
- Won
- Drawn
- Lost
- Goals For
- Goals Against
- Goal Difference
- Points

Allow filter by group.

### 9. Match Detail Page
Route: `/matches/:matchId`

Show:

- Teams
- Score
- Date/time
- Stadium
- City
- Round/group
- Match status
- Referee if available
- Team lineups placeholder
- Related weather

### 10. Weather Page
Route: `/weather`

Because this is a static app, use `weather.json` as a placeholder or manually updated file.

Show:

- City
- Stadium
- Temperature
- Condition
- Wind
- Updated date/time

Important: do not call a paid weather API unless configured later.

## Data Files

### `/public/data/teams.json`

```json
[
  {
    "id": "usa",
    "name": "United States",
    "shortName": "USA",
    "flag": "🇺🇸",
    "group": "A",
    "confederation": "CONCACAF",
    "coachId": "coach-usa",
    "fifaRanking": null,
    "qualified": true
  }
]
```

### `/public/data/players.json`

```json
[
  {
    "id": "player-001",
    "teamId": "usa",
    "name": "Player Name",
    "position": "Forward",
    "shirtNumber": 10,
    "club": "Club Name",
    "age": null
  }
]
```

### `/public/data/coaches.json`

```json
[
  {
    "id": "coach-usa",
    "teamId": "usa",
    "name": "Coach Name",
    "nationality": "United States",
    "notes": "Head coach information"
  }
]
```

### `/public/data/matches.json`

```json
[
  {
    "id": "match-001",
    "date": "2026-06-11",
    "time": "18:00",
    "timezone": "America/Los_Angeles",
    "homeTeamId": "usa",
    "awayTeamId": "canada",
    "homeScore": null,
    "awayScore": null,
    "status": "Scheduled",
    "round": "Group Stage",
    "group": "A",
    "stadiumId": "sofi-stadium",
    "notes": ""
  }
]
```

Allowed match statuses:

```text
Scheduled
Live
Finished
Postponed
Cancelled
```

### `/public/data/stadiums.json`

```json
[
  {
    "id": "sofi-stadium",
    "name": "SoFi Stadium",
    "city": "Inglewood",
    "state": "California",
    "country": "USA",
    "capacity": null,
    "latitude": null,
    "longitude": null,
    "notes": ""
  }
]
```

### `/public/data/standings.json`

```json
[
  {
    "group": "A",
    "teamId": "usa",
    "played": 0,
    "won": 0,
    "drawn": 0,
    "lost": 0,
    "goalsFor": 0,
    "goalsAgainst": 0,
    "goalDifference": 0,
    "points": 0
  }
]
```

### `/public/data/weather.json`

```json
[
  {
    "stadiumId": "sofi-stadium",
    "city": "Inglewood",
    "temperatureF": null,
    "condition": "Not updated",
    "wind": null,
    "updatedAt": null
  }
]
```

## TypeScript Types
Create `src/types/index.ts`:

```ts
export type MatchStatus = 'Scheduled' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  flag?: string;
  group?: string;
  confederation?: string;
  coachId?: string;
  fifaRanking?: number | null;
  qualified?: boolean;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position?: string;
  shirtNumber?: number | null;
  club?: string;
  age?: number | null;
}

export interface Coach {
  id: string;
  teamId: string;
  name: string;
  nationality?: string;
  notes?: string;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  timezone: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  round?: string;
  group?: string;
  stadiumId?: string;
  notes?: string;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  capacity?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string;
}

export interface Standing {
  group: string;
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface WeatherInfo {
  stadiumId: string;
  city: string;
  temperatureF?: number | null;
  condition?: string;
  wind?: string | null;
  updatedAt?: string | null;
}
```

## Data Loading
Create `src/data/dataLoader.ts`.

Use fetch to load JSON files from `/data/`.

```ts
export async function loadJson<T>(fileName: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${fileName}`);

  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}`);
  }

  return response.json();
}
```

Example usage:

```ts
const teams = await loadJson<Team[]>('teams.json');
```

## Filtering Requirements
Every major list page should have search/filter.

Implement search by lower-case matching.

Examples:

- Teams: search team name, short name, group
- Players: search player name, team name, position
- Coaches: search coach name, team name
- Matches: search team name, stadium, city, round
- Stadiums: search stadium name, city, country

## Responsive Design
Use mobile-first CSS.

### Mobile

- Cards should be one column
- Bottom nav should be visible
- Header should be compact
- Search bar should be sticky near the top if useful
- Tables should be horizontally scrollable

### Desktop

- Use max-width container
- Cards can be 2–4 columns
- Top nav visible
- Bottom nav hidden

Example CSS:

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bottom-nav {
    display: none;
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## UI Style
Use a clean sports dashboard style.

Design goals:

- Easy to read
- Fast on mobile
- Clear cards
- Large tap targets
- Good contrast
- Simple filters
- No heavy animations

Recommended card style:

```css
.card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

## Match Card Behavior
For each match card:

- If status is Scheduled, show time and stadium
- If status is Live, highlight score and show LIVE label
- If status is Finished, show final score and winner if possible
- If score is null, show `-`

Example display:

```text
USA 2 - 1 Canada
Finished
Group A · SoFi Stadium · Inglewood
```

## Standings Sorting
Sort standings by:

1. Points descending
2. Goal difference descending
3. Goals for descending
4. Team name ascending

## Today Matches Logic
A match is today if `match.date` equals today in the user’s local date.

Keep it simple first:

```ts
const today = new Date().toISOString().slice(0, 10);
const todayMatches = matches.filter(match => match.date === today);
```

Later we can improve timezone handling.

## JSON Update Workflow
Data will be updated manually.

Workflow:

1. Open JSON file in Cursor
2. Ask ChatGPT to update the data
3. Paste updated JSON into file
4. Run app locally
5. Commit and push
6. GitHub Pages or Cloudflare Pages redeploys automatically

Example update:

```json
{
  "id": "match-001",
  "homeScore": 2,
  "awayScore": 1,
  "status": "Finished"
}
```

When match score changes, update both:

- `matches.json`
- `standings.json`

## Important Rules for Cursor

- Keep the app static.
- Do not create an admin page.
- Do not add authentication.
- Do not add backend API.
- Do not store secrets or tokens.
- Keep all source data in `/public/data/*.json`.
- Build reusable components.
- Make the mobile version excellent.
- Bottom mobile nav must always be easy to tap.
- All pages must load data from JSON files.
- Add loading and error states.
- Avoid hardcoding teams/matches inside components.

## Nice-to-Have Features
Add these only after core version works:

- Favorite team saved in localStorage
- Dark mode
- Countdown to next match
- Group filter chips
- Stadium map link
- Share match button
- Last updated label from JSON
- Badge for live games

## Acceptance Criteria
The app is complete when:

- It runs locally with `npm run dev`
- It builds with `npm run build`
- It works on mobile and desktop
- Bottom nav appears on mobile
- User can find today’s games quickly
- User can search teams, players, coaches, stadiums, and matches
- Standings table is readable on mobile
- All data comes from JSON files
- Updating JSON updates the website after redeploy

## Suggested Cursor Prompt
Use this prompt in Cursor:

```text
Build a React + Vite + TypeScript static FIFA World Cup 2026 dashboard using the requirements in FIFA2026_CURSOR_BUILD_GUIDE.md. Use local JSON files from public/data. Create all pages, components, routing, filters, mobile bottom navigation, and responsive CSS. Do not create backend, database, login, or admin page. Make the site mobile friendly and ready for GitHub Pages or Cloudflare Pages.
```
