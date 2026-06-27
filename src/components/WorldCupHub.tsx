import { useMemo, useState } from 'react';
import type { AppData } from '../data/dataLoader';
import type { Match } from '../types';
import { useLanguage, useT } from '../context/LanguageContext';
import GoogleSportsPanel from './GoogleSportsPanel';
import GoogleTabBar from './GoogleTabBar';
import GoogleStandings from './GoogleStandings';
import { GoogleMatchDateGroup, GoogleMatchPastSection } from './GoogleMatchRow';
import LiveScoresStrip from './LiveScoresStrip';
import KnockoutBracket from './d3/KnockoutBracket';
import { getTodayString, getGroupsFromTeams, isMatchDayStillActive } from '../utils/helpers';

interface WorldCupHubProps {
  data: AppData;
  defaultTab?: string;
  matchesFilter?: 'all' | 'today';
}

export default function WorldCupHub({
  data,
  defaultTab = 'matches',
  matchesFilter = 'all',
}: WorldCupHubProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { teams, matches, stadiums, standings } = data;
  const t = useT();
  const { locale } = useLanguage();

  const panelTabs = useMemo(
    () => [
      { id: 'matches', label: t('nav.matches') },
      { id: 'standings', label: t('nav.standings') },
      { id: 'bracket', label: t('nav.bracket') },
    ],
    [t]
  );

  const groups = useMemo(() => getGroupsFromTeams(teams), [teams]);

  const displayMatches = useMemo(() => {
    let list = [...matches];
    if (matchesFilter === 'today') {
      const today = getTodayString();
      list = list.filter((m) => m.date === today);
    }
    return list.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.time.localeCompare(b.time);
    });
  }, [matches, matchesFilter]);

  const { activeDays, futureDays, pastDays } = useMemo(() => {
    const today = getTodayString();
    const todayList: [string, Match[]][] = [];
    const future: [string, Match[]][] = [];
    const past: [string, Match[]][] = [];

    const map = new Map<string, Match[]>();
    displayMatches.forEach((m) => {
      const existing = map.get(m.date) ?? [];
      existing.push(m);
      map.set(m.date, existing);
    });

    for (const [date, dateMatches] of map.entries()) {
      const stillActive = isMatchDayStillActive(dateMatches);
      if (stillActive) {
        // Keep in-progress days visible even if calendar date is "yesterday" (UTC vs local).
        todayList.push([date, dateMatches]);
      } else if (date === today) {
        todayList.push([date, dateMatches]);
      } else if (date > today) {
        future.push([date, dateMatches]);
      } else {
        past.push([date, dateMatches]);
      }
    }

    todayList.sort(([a], [b]) => a.localeCompare(b));
    future.sort(([a], [b]) => a.localeCompare(b));
    past.sort(([a], [b]) => b.localeCompare(a));

    return { activeDays: todayList, futureDays: future, pastDays: past };
  }, [displayMatches]);

  const liveCount = matches.filter((m) => m.status === 'Live').length;
  const subtitle =
    liveCount > 0
      ? t('hub.liveNow', { count: liveCount })
      : t('hub.hosts');

  return (
    <GoogleSportsPanel
      subtitle={subtitle}
      tabs={
        <GoogleTabBar tabs={panelTabs} active={activeTab} onChange={setActiveTab} />
      }
    >
      <LiveScoresStrip matches={matches} teams={teams} />

      {activeTab === 'matches' && (
        <>
          {displayMatches.length === 0 ? (
            <p className="empty-state" style={{ padding: '32px 16px' }}>
              {t('hub.noMatches')}
            </p>
          ) : (
            <>
              {activeDays.map(([date, dateMatches]) => (
                <GoogleMatchDateGroup
                  key={date}
                  date={date}
                  matches={dateMatches}
                  teams={teams}
                  stadiums={stadiums}
                  locale={locale}
                  initialExpanded
                  allMatches={matches}
                />
              ))}
              {futureDays.map(([date, dateMatches]) => (
                <GoogleMatchDateGroup
                  key={date}
                  date={date}
                  matches={dateMatches}
                  teams={teams}
                  stadiums={stadiums}
                  locale={locale}
                  initialExpanded={false}
                  allMatches={matches}
                />
              ))}
              <GoogleMatchPastSection
                days={pastDays}
                teams={teams}
                stadiums={stadiums}
                locale={locale}
                allMatches={matches}
              />
            </>
          )}
        </>
      )}

      {activeTab === 'standings' && (
        <GoogleStandings
          standings={standings}
          teams={teams}
          groups={groups}
          matches={matches}
        />
      )}

      {activeTab === 'bracket' && (
        <KnockoutBracket matches={matches} teams={teams} />
      )}
    </GoogleSportsPanel>
  );
}
