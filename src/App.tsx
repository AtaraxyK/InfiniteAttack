import { useEffect, useMemo, useState } from 'react';
import {
  currencyIcons,
  currencyLabels,
  fieldPreviews,
  specialPanels,
  themeOptions,
  townBuildings,
} from './data';
import { formatBig } from './utils';
import type {
  ActiveConstruction,
  BuildingState,
  ConstructionLane,
  CurrencyKey,
  ThemeKey,
  TownTabId,
} from './types';

const initialResources: Record<CurrencyKey, bigint> = {
  gold: 520n,
  scrap: 180n,
  aether: 7n,
};

const initialBuildings: Record<string, BuildingState> = {
  house: { id: 'house', level: 2, pendingConfirmation: false },
  field: { id: 'field', level: 1, pendingConfirmation: false },
  lumberyard: { id: 'lumberyard', level: 1, pendingConfirmation: false },
  timeShrine: { id: 'timeShrine', level: 0, pendingConfirmation: false },
  lab: { id: 'lab', level: 1, pendingConfirmation: false },
  forge: { id: 'forge', level: 1, pendingConfirmation: false },
  builder: { id: 'builder', level: 1, pendingConfirmation: false },
  market: { id: 'market', level: 0, pendingConfirmation: false },
  inventory: { id: 'inventory', level: 1, pendingConfirmation: false },
  fieldCollection: { id: 'fieldCollection', level: 0, pendingConfirmation: false },
  enemyCollection: { id: 'enemyCollection', level: 0, pendingConfirmation: false },
};

const initialLanes: ConstructionLane[] = [
  { laneId: 1, activeProject: null, queue: null },
  { laneId: 2, activeProject: null, queue: null },
];

const specialTabOrder: Array<{ tabId: TownTabId; buildingId: string }> = [
  { tabId: 'lab', buildingId: 'lab' },
  { tabId: 'forge', buildingId: 'forge' },
  { tabId: 'builder', buildingId: 'builder' },
  { tabId: 'market', buildingId: 'market' },
  { tabId: 'inventory', buildingId: 'inventory' },
  { tabId: 'fieldCollection', buildingId: 'fieldCollection' },
  { tabId: 'enemyCollection', buildingId: 'enemyCollection' },
];

export function App() {
  const [theme, setTheme] = useState<ThemeKey>('seaMist');
  const [activeTab, setActiveTab] = useState<TownTabId>('town');
  const [resources, setResources] = useState(initialResources);
  const [buildings, setBuildings] = useState(initialBuildings);
  const [lanes, setLanes] = useState(initialLanes);
  const [notice, setNotice] = useState('마을에서 건설과 특수 건물을 관리할 수 있습니다.');
  const [lastTickAt, setLastTickAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [expandedBuildingId, setExpandedBuildingId] = useState<string>('house');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const elapsedSeconds = Math.floor((now - lastTickAt) / 1000);
    if (elapsedSeconds <= 0) {
      return;
    }

    setResources((current) => {
      const next = { ...current };
      for (const building of townBuildings) {
        const state = buildings[building.id];
        if (!state || state.level <= 0 || !building.production) {
          continue;
        }

        const productionPerMinute =
          building.production.basePerMinute +
          building.production.perLevel * BigInt(Math.max(0, state.level - 1));
        const earned = (productionPerMinute * BigInt(elapsedSeconds)) / 60n;
        next[building.production.currency] += earned;
      }
      return next;
    });

    setLastTickAt((current) => current + elapsedSeconds * 1000);
  }, [buildings, lastTickAt, now]);

  useEffect(() => {
    setLanes((current) =>
      current.map((lane) => {
        if (!lane.activeProject || lane.activeProject.endsAt > now) {
          return lane;
        }

        const completed = lane.activeProject;
        setBuildings((previous) => ({
          ...previous,
          [completed.buildingId]: {
            ...previous[completed.buildingId],
            level: Math.max(previous[completed.buildingId].level, completed.targetLevel),
            pendingConfirmation: true,
          },
        }));

        return {
          ...lane,
          activeProject: lane.queue
            ? beginConstruction(lane.queue.buildingId, lane.queue.targetLevel, now)
            : null,
          queue: null,
        };
      }),
    );
  }, [now]);

  const visibleSpecialTabs = specialTabOrder.filter(
    ({ buildingId }) => (buildings[buildingId]?.level ?? 0) > 0,
  );

  const houseLevel = buildings.house.level;
  const activeConstructionCount = lanes.filter((lane) => lane.activeProject).length;
  const queuedConstructionCount = lanes.filter((lane) => lane.queue).length;
  const pendingConfirmations = Object.values(buildings).filter((building) => building.pendingConfirmation)
    .length;

  const productionSummary = useMemo(() => {
    const summary: Record<CurrencyKey, bigint> = { gold: 0n, scrap: 0n, aether: 0n };
    for (const building of townBuildings) {
      const state = buildings[building.id];
      if (!state || state.level <= 0 || !building.production) {
        continue;
      }
      summary[building.production.currency] +=
        building.production.basePerMinute +
        building.production.perLevel * BigInt(Math.max(0, state.level - 1));
    }
    return summary;
  }, [buildings]);

  const townPromotionReady = useMemo(() => {
    const normalBuildings = townBuildings.filter((building) =>
      ['normal', 'research', 'forge', 'builder', 'inventory'].includes(building.category),
    );
    return houseLevel >= 2 && normalBuildings.every((building) => (buildings[building.id]?.level ?? 0) >= 1);
  }, [buildings, houseLevel]);

  function queueConstruction(buildingId: string) {
    const definition = townBuildings.find((building) => building.id === buildingId);
    if (!definition) {
      return;
    }

    const currentLevel = buildings[buildingId].level;
    const targetLevel = currentLevel + 1;

    if (targetLevel > definition.maxLevel) {
      setNotice('이미 최대 레벨입니다.');
      return;
    }
    if (definition.category !== 'house' && targetLevel > houseLevel) {
      setNotice('다른 건물은 주인공의 집보다 높게 올릴 수 없습니다.');
      return;
    }
    if (!canAffordCost(resources, definition.cost)) {
      setNotice('재화가 부족합니다.');
      return;
    }

    const laneIndex = lanes.findIndex((lane) => !lane.activeProject || !lane.queue);
    if (laneIndex === -1) {
      setNotice('모든 건설 라인이 가득 찼습니다.');
      return;
    }

    setResources((current) => subtractCost(current, definition.cost));
    setLanes((current) =>
      current.map((lane, index) => {
        if (index !== laneIndex) {
          return lane;
        }
        if (!lane.activeProject) {
          return { ...lane, activeProject: beginConstruction(buildingId, targetLevel, now) };
        }
        return { ...lane, queue: { buildingId, targetLevel } };
      }),
    );
    setNotice(`${definition.name} Lv.${targetLevel} 건설을 예약했습니다.`);
  }

  function confirmBuilding(buildingId: string) {
    setBuildings((current) => ({
      ...current,
      [buildingId]: {
        ...current[buildingId],
        pendingConfirmation: false,
      },
    }));
    setNotice(`${findBuildingName(buildingId)} 완료 확인을 처리했습니다.`);
  }

  function onOpenField(fieldName: string) {
    setNotice(`${fieldName} 필드는 준비중입니다!`);
  }

  const activePanel = specialPanels.find((panel) => panel.tabId === activeTab);

  return (
    <div className={`app-theme theme-${theme}`}>
      <div className="app-shell game-shell">
        <header className="panel top-summary-panel">
          <div className="summary-copy-block">
            <p className="eyebrow">Village Overview</p>
            <div className="summary-headline-row">
              <h1>마을 운영</h1>
              {townPromotionReady ? <button className="promotion-button">승급 가능</button> : null}
            </div>
            <div className="notice-box">{notice}</div>
          </div>

          <div className="summary-overview-strip">
            <article className="overview-card">
              <span>주인공의 집</span>
              <strong>Lv.{houseLevel}</strong>
              <p>다른 건물 최대 레벨 기준</p>
            </article>
            <article className="overview-card">
              <span>건설 라인</span>
              <strong>{activeConstructionCount}/2</strong>
              <p>예약 {queuedConstructionCount} / 확인 {pendingConfirmations}</p>
            </article>
            <article className="overview-card">
              <span>열린 특수 건물</span>
              <strong>{visibleSpecialTabs.length}개</strong>
              <p>탭에서 바로 이동 가능</p>
            </article>
          </div>

          <div className="resource-panel compact-resources">
            {(Object.keys(resources) as CurrencyKey[]).map((key) => (
              <div key={key} className="resource-chip">
                <img className="game-icon" src={currencyIcons[key]} alt="" aria-hidden />
                <span>{currencyLabels[key]}</span>
                <strong>{formatBig(resources[key])}</strong>
                <small>분당 +{formatBig(productionSummary[key])}</small>
              </div>
            ))}
          </div>

          <div className="theme-picker compact-theme-picker" aria-label="테마 선택">
            {themeOptions.map((option) => (
              <button
                key={option.key}
                className={theme === option.key ? 'theme-button active' : 'theme-button'}
                onClick={() => setTheme(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <section className="panel menu-panel">
          <div className="tab-strip" role="tablist" aria-label="마을 메뉴">
            <TabButton label="마을" active={activeTab === 'town'} onClick={() => setActiveTab('town')} />
            <TabButton label="외출" active={activeTab === 'outing'} onClick={() => setActiveTab('outing')} />
            {visibleSpecialTabs.map(({ tabId, buildingId }) => (
              <TabButton
                key={tabId}
                label={findBuildingName(buildingId)}
                active={activeTab === tabId}
                onClick={() => setActiveTab(tabId)}
              />
            ))}
          </div>
        </section>

        <main className="content-region">
          <div className="content-scroller">
            {activeTab === 'town' ? (
              <>
                <section className="panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Construction Lines</p>
                      <h2>건설 라인</h2>
                    </div>
                    <span className="pill">동시 2개, 줄당 예약 1개</span>
                  </div>

                  <div className="lane-grid mobile-lane-grid">
                    {lanes.map((lane) => (
                      <article key={lane.laneId} className="lane-card">
                        <h3>라인 {lane.laneId}</h3>
                        <p>{lane.activeProject ? describeProject(lane.activeProject, now) : '비어 있음'}</p>
                        <p className="muted">
                          예약:{' '}
                          {lane.queue ? `${findBuildingName(lane.queue.buildingId)} Lv.${lane.queue.targetLevel}` : '없음'}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="panel fill-panel">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Buildings</p>
                      <h2>건설 목록</h2>
                    </div>
                    <span className="pill">펼쳐서 상세 확인</span>
                  </div>

                  <div className="building-list">
                    {townBuildings.map((building) => {
                      const state = buildings[building.id];
                      const nextLevel = state.level + 1;
                      const isMaxLevel = state.level >= building.maxLevel;
                      const canAfford = canAffordCost(resources, building.cost);
                      const blockedByHouse = building.category !== 'house' && nextLevel > houseLevel;
                      const expanded = expandedBuildingId === building.id;

                      return (
                        <article
                          key={building.id}
                          className={expanded ? 'building-card compact-building expanded' : 'building-card compact-building'}
                        >
                          <button
                            className="building-summary"
                            onClick={() => setExpandedBuildingId(expanded ? '' : building.id)}
                          >
                            <img className="game-icon" src={building.icon} alt="" aria-hidden />
                            <div className="building-summary-copy">
                              <p className="eyebrow">{building.rewardText}</p>
                              <h3>
                                {building.name} Lv.{state.level}
                              </h3>
                              <p className="muted">
                                {building.production
                                  ? `분당 ${currencyLabels[building.production.currency]} +${formatBig(
                                      getPerMinute(building.id, buildings),
                                    )}`
                                  : '기능 해금 건물'}
                              </p>
                            </div>
                            <span className="expand-indicator">{expanded ? '−' : '+'}</span>
                          </button>

                          {expanded ? (
                            <div className="building-detail">
                              <p>{building.description}</p>
                              <div className="building-meta">
                                <span>다음 목표: Lv.{Math.min(nextLevel, building.maxLevel)}</span>
                                <span>비용: {formatCost(building.cost)}</span>
                                <span>시간: {building.baseDurationSeconds * Math.min(nextLevel, building.maxLevel)}초</span>
                              </div>
                              <div className="building-actions">
                                <button
                                  disabled={isMaxLevel || !canAfford || blockedByHouse}
                                  onClick={() => queueConstruction(building.id)}
                                >
                                  {isMaxLevel ? '최대 레벨' : blockedByHouse ? '집 레벨 부족' : '건설 예약'}
                                </button>
                                {state.pendingConfirmation ? (
                                  <button className="secondary" onClick={() => confirmBuilding(building.id)}>
                                    완료 확인
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : null}

            {activeTab === 'outing' ? (
              <section className="panel fill-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Outing</p>
                    <h2>필드 목록</h2>
                  </div>
                  <span className="pill">준비중</span>
                </div>

                <div className="field-list">
                  {fieldPreviews.map((field) => (
                    <button key={field.id} className="field-card" onClick={() => onOpenField(field.name)}>
                      <span>{field.type}</span>
                      <strong>{field.name}</strong>
                      <p>{field.description}</p>
                      <em>{field.status}</em>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {activePanel ? (
              <section className="panel fill-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Special Building</p>
                    <h2>{activePanel.name}</h2>
                  </div>
                </div>
                <p className="panel-description">{activePanel.description}</p>
                <div className="special-list">
                  {activePanel.entries.map((entry) => (
                    <article key={entry.id} className="special-card">
                      <div>
                        <p className="eyebrow">{entry.effect}</p>
                        <h3>{entry.title}</h3>
                        <p>{entry.description}</p>
                        <p className="muted">비용: {entry.costText}</p>
                      </div>
                      <button className="secondary" onClick={() => setNotice(`${entry.title} 항목은 아직 준비중입니다!`)}>
                        준비중
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? 'tab-button active' : 'tab-button'} onClick={onClick}>
      {label}
    </button>
  );
}

function beginConstruction(buildingId: string, targetLevel: number, now: number): ActiveConstruction {
  const definition = townBuildings.find((building) => building.id === buildingId)!;
  return {
    buildingId,
    targetLevel,
    startedAt: now,
    endsAt: now + definition.baseDurationSeconds * targetLevel * 1000,
  };
}

function describeProject(project: ActiveConstruction, now: number): string {
  const remainingSeconds = Math.max(0, Math.ceil((project.endsAt - now) / 1000));
  return `${findBuildingName(project.buildingId)} Lv.${project.targetLevel} (${remainingSeconds}초 남음)`;
}

function findBuildingName(buildingId: string): string {
  return townBuildings.find((building) => building.id === buildingId)?.name ?? buildingId;
}

function canAffordCost(
  resources: Record<CurrencyKey, bigint>,
  cost: Partial<Record<CurrencyKey, bigint>>,
): boolean {
  return !Object.entries(cost).some(([key, value]) => resources[key as CurrencyKey] < (value ?? 0n));
}

function subtractCost(
  resources: Record<CurrencyKey, bigint>,
  cost: Partial<Record<CurrencyKey, bigint>>,
): Record<CurrencyKey, bigint> {
  return {
    gold: resources.gold - (cost.gold ?? 0n),
    scrap: resources.scrap - (cost.scrap ?? 0n),
    aether: resources.aether - (cost.aether ?? 0n),
  };
}

function formatCost(cost: Partial<Record<CurrencyKey, bigint>>): string {
  return (Object.keys(cost) as CurrencyKey[])
    .map((key) => `${currencyLabels[key]} ${formatBig(cost[key] ?? 0n)}`)
    .join(' / ');
}

function getPerMinute(buildingId: string, buildings: Record<string, BuildingState>): bigint {
  const definition = townBuildings.find((building) => building.id === buildingId);
  if (!definition?.production) {
    return 0n;
  }
  const level = buildings[buildingId]?.level ?? 0;
  if (level <= 0) {
    return 0n;
  }
  return definition.production.basePerMinute + definition.production.perLevel * BigInt(Math.max(0, level - 1));
}
