import type { Match, Standing } from '../types';

export interface ScoreUpdateResponse {
  ok: boolean;
  match?: Match;
  standings?: Standing[];
  dataVersion?: string;
  error?: string;
}

export async function submitMatchScore(input: {
  edition: string;
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  adminKey: string;
}): Promise<ScoreUpdateResponse> {
  const response = await fetch('/api/update-match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': input.adminKey,
    },
    body: JSON.stringify({
      edition: input.edition,
      matchId: input.matchId,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      status: input.status,
    }),
  });

  const payload = (await response.json()) as ScoreUpdateResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }
  return payload;
}
