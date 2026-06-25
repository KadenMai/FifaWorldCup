import { useState } from 'react';
import type { Team } from '../types';
import { getTeamById } from '../utils/helpers';
import { getTeamFlagUrl } from '../utils/flags';

interface TeamFlagProps {
  team?: Team | null;
  teamId?: string;
  teams?: Team[];
  size?: number;
  className?: string;
  title?: string;
}

export default function TeamFlag({
  team,
  teamId,
  teams,
  size = 24,
  className = '',
  title,
}: TeamFlagProps) {
  const [failed, setFailed] = useState(false);

  const resolved =
    team ?? (teamId && teams ? getTeamById(teams, teamId) : undefined);

  if (!resolved) {
    return (
      <span
        className={`team-flag team-flag-fallback ${className}`}
        style={{ fontSize: size }}
        aria-hidden="true"
      >
        🏳️
      </span>
    );
  }

  const alt = title ?? resolved.name;

  if (failed && resolved.flag) {
    return (
      <span
        className={`team-flag team-flag-fallback ${className}`}
        style={{ fontSize: size }}
        aria-label={alt}
        title={alt}
      >
        {resolved.flag}
      </span>
    );
  }

  const src = getTeamFlagUrl(resolved, size <= 20 ? 40 : size <= 32 ? 80 : 160);

  return (
    <img
      src={src}
      alt={alt}
      title={alt}
      className={`team-flag ${className}`}
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
