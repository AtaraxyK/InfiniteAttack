import { useEffect, useMemo, useState } from 'react';
import { buildingDefinitions, stageDefinitions, starterGear } from './data';
import { formatBig, formatCurrencyMap, labelForCurrency, multiplyPercent } from './utils';
import goldIcon from './assets/icons/gold.svg';
import scrapIcon from './assets/icons/scrap.svg';
import aetherIcon from './assets/icons/aether.svg';
import type {
  ActiveConstruction,
  BuildingState,
  ConstructionLane,
  CurrencyKey,
  GearCard,
  HeroStats,
  StageDefinition,
} from './types';

type DetailPanel = 'resources' | 'construction' | 'battle';
type ThemeKey = 'seaMist' | 'forestMoss' | 'deepSlate' | 'sandDusk' | 'roseAsh';

const themeOptions: Array<{ key: ThemeKey; label: string }> = [
  { key: 'seaMist', label: '블루 미스트' },
  { key: 'forestMoss', label: '포레스트' },
  { key: 'deepSlate', label: '슬레이트' },
  { key: 'sandDusk', label: '샌드' },
  { key: 'roseAsh', label: '로즈 애쉬' },
];

const currencyIcons: Record<CurrencyKey, string> = {
  gold: goldIcon,
  scrap: scrapIcon,
  aether: aetherIcon,
};

const initialHero: HeroStats = {
  level: 7,
  attack: 140n,
  defense: 84n,
  hp: 920n,
  critRate: 0.18,
};

const initialResources: Record<CurrencyKey, bigint> = {
  gold: 860n,
  scrap: 140n,
  aether: 12n,
};

const initialBuildings: Record<string, BuildingState> = {
  forge: { id: 'forge', level: 2, pendingConfirmation: false },
  watchtower: { id: 'watchtower', level: 1, pendingConfirmation: false },
  aetherPump: { id: 'aetherPump', level: 0, pendingConfirmation: false },
};

const initialLanes: ConstructionLane[] = [
  { laneId: 1, activeProject: null, queue: null },
  { laneId: 2, activeProject: null, queue: null },
];

export function App() {
  const [hero] = useState(initialHero);
  const [resources, setResources] = useState(initialResources);
  const [buildings, setBuildings] = useState(initialBuildings);
  const [lanes, setLanes] = useState(initialLanes);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>(['iron-blade', 'scope-lens']);
  const [selectedStageId, setSelectedStageId] = useState(stageDefinitions[0].id);
  const [activeDetailPanel, setActiveDetailPanel] = useState<DetailPanel>('construction');
  const [theme, setTheme] = useState<ThemeKey>('seaMist');
  const [combatLog, setCombatLog] = useState('무기와 보조 장비를 골라 예상 공격력을 확인하세요.');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  const selectedStage = stageDefinitions.find((stage) => stage.id === selectedStageId)!;
  const selectedGear = starterGear.filter((gear) => selectedGearIds.includes(gear.id));
  const forgeLevel = buildings.forge.level;
  const watchtowerLevel = buildings.watchtower.level;
  const aetherPumpLevel = buildings.aetherPump.level;
  const buildingAttackBonus = 1 + forgeLevel * 0.08;
  const buildingDefenseBonus = 1 + watchtowerLevel * 0.12;
  const passiveAetherGain = BigInt(aetherPumpLevel);

  const projectedCombatPower = useMemo(() => {
    const gearPower = selectedGear.reduce((total, gear) => total + gear.power, 0n);
    const heroBase = hero.attack + multiplyPercent(hero.attack, hero.critRate * 50);
    const totalAttack = BigInt(Math.floor(Number(heroBase + gearPower) * buildingAttackBonus));
    const totalDefense = BigInt(Math.floor(Number(hero.defense) * buildingDefenseBonus));
    return totalAttack + totalDefense / 2n;
  }, [buildingAttackBonus, buildingDefenseBonus, hero.attack, hero.critRate, hero.defense, selectedGear]);

  const activeConstructionCount = lanes.filter((lane) => lane.activeProject).length;
  const queuedConstructionCount = lanes.filter((lane) => lane.queue).length;
  const pendingConfirmations = Object.values(buildings).filter((building) => building.pendingConfirmation)
    .length;

  function toggleGear(id: string) {
    setSelectedGearIds((current) => {
      if (current.includes(id)) {
        return current.filter((gearId) => gearId !== id);
      }

      return current.length >= 2 ? [current[1], id] : [...current, id];
    });
  }

  function runBattle(stage: StageDefinition) {
    const success = projectedCombatPower >= stage.encounterPower;
    if (success) {
      setResources((current) => ({
        gold: current.gold + (stage.reward.gold ?? 0n),
        scrap: current.scrap + (stage.reward.scrap ?? 0n),
        aether: current.aether + (stage.reward.aether ?? 0n) + passiveAetherGain,
      }));
      setCombatLog(
        `${stage.name} 승리. 전투력 ${formatBig(projectedCombatPower)}로 요구치 ${formatBig(
          stage.encounterPower,
        )}를 돌파했고 ${formatCurrencyMap(stage.reward)}를 획득했습니다.`,
      );
      return;
    }

    setCombatLog(
      `${stage.name} 패배. 현재 전투력 ${formatBig(projectedCombatPower)}가 요구치 ${formatBig(
        stage.encounterPower,
      )}보다 낮습니다. 건물 업그레이드나 장비 조합을 바꿔보세요.`,
    );
  }

  function queueConstruction(buildingId: string) {
    const definition = buildingDefinitions.find((building) => building.id === buildingId);
    if (!definition) {
      return;
    }

    const targetLevel = buildings[buildingId].level + 1;
    if (targetLevel > definition.maxLevel || !canAffordCost(resources, definition.cost)) {
      return;
    }

    const laneIndex = lanes.findIndex((lane) => !lane.activeProject || !lane.queue);
    if (laneIndex === -1) {
      return;
    }

    setResources((current) => ({
      gold: current.gold - (definition.cost.gold ?? 0n),
      scrap: current.scrap - (definition.cost.scrap ?? 0n),
      aether: current.aether - (definition.cost.aether ?? 0n),
    }));

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
  }

  function confirmBuilding(buildingId: string) {
    setBuildings((current) => ({
      ...current,
      [buildingId]: { ...current[buildingId], pendingConfirmation: false },
    }));
  }

  return (
    <div className={`app-theme theme-${theme}`}>
      <div className="app-shell">
        <header className="hero-banner">
          <div>
            <p className="eyebrow">GitHub Pages-ready idle battle prototype</p>
            <h1>Infinite Attack</h1>
            <p className="hero-copy">
              방치형 건설, 장비 선택형 턴제 전투, 큰 수치 누적을 전제로 한 웹 게임 시작점입니다.
            </p>
            <p className="status-note">저장은 아직 미구현입니다. 지금은 UI와 핵심 루프를 먼저 다듬는 단계예요.</p>
          </div>
          <div className="hero-side">
            <div className="theme-picker" aria-label="테마 선택">
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
            <div className="resource-panel">
              {Object.entries(resources).map(([key, value]) => (
                <div key={key} className="resource-chip">
                  <Icon src={currencyIcons[key as CurrencyKey]} alt="" />
                  <span>{labelForCurrency(key as CurrencyKey)}</span>
                  <strong>{formatBig(value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="dashboard">
          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Overview</p>
                <h2>한눈 요약</h2>
              </div>
            </div>

            <div className="overview-grid">
              <button
                className={activeDetailPanel === 'resources' ? 'overview-card active' : 'overview-card'}
                onClick={() => setActiveDetailPanel('resources')}
              >
                <Icon src={goldIcon} alt="" />
                <span>재화 흐름</span>
                <strong>{formatBig(resources.gold)}</strong>
                <p>현재 보유량과 재화 용도를 한 번에 봅니다.</p>
              </button>
              <button
                className={activeDetailPanel === 'construction' ? 'overview-card active' : 'overview-card'}
                onClick={() => setActiveDetailPanel('construction')}
              >
                <span className="large-symbol">🏗</span>
                <span>건설 상황</span>
                <strong>{activeConstructionCount}/2 진행 중</strong>
                <p>예약 {queuedConstructionCount}개 / 완료 확인 대기 {pendingConfirmations}개</p>
              </button>
              <button
                className={activeDetailPanel === 'battle' ? 'overview-card active' : 'overview-card'}
                onClick={() => setActiveDetailPanel('battle')}
              >
                <span className="large-symbol">⚔</span>
                <span>전투 준비</span>
                <strong>{formatBig(projectedCombatPower)}</strong>
                <p>{selectedStage.name} / 요구치 {formatBig(selectedStage.encounterPower)}</p>
              </button>
            </div>

            <DetailPanelSection
              activeDetailPanel={activeDetailPanel}
              resources={resources}
              passiveAetherGain={passiveAetherGain}
              buildings={buildings}
              lanes={lanes}
              now={now}
              selectedStage={selectedStage}
              projectedCombatPower={projectedCombatPower}
              selectedGear={selectedGear}
            />
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Hero</p>
                <h2>영웅 성장</h2>
              </div>
            </div>
            <div className="stat-grid">
              <StatCard label="레벨" value={hero.level.toString()} />
              <StatCard label="공격력" value={formatBig(hero.attack)} />
              <StatCard label="방어력" value={formatBig(hero.defense)} />
              <StatCard label="체력" value={formatBig(hero.hp)} />
              <StatCard label="치명타" value={`${Math.round(hero.critRate * 100)}%`} />
              <StatCard label="예상 전투력" value={formatBig(projectedCombatPower)} />
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Construction</p>
                <h2>건설 라인</h2>
              </div>
              <span className="pill">동시 진행 2개, 줄당 예약 1개</span>
            </div>
            <div className="lane-grid">
              {lanes.map((lane) => (
                <article key={lane.laneId} className="lane-card">
                  <h3>라인 {lane.laneId}</h3>
                  <p>{lane.activeProject ? describeProject(lane.activeProject, now) : '비어 있음'}</p>
                  <p className="muted">
                    예약:{' '}
                    {lane.queue
                      ? `${findBuildingName(lane.queue.buildingId)} Lv.${lane.queue.targetLevel}`
                      : '없음'}
                  </p>
                </article>
              ))}
            </div>

            <div className="building-list">
              {buildingDefinitions.map((building) => {
                const state = buildings[building.id];
                const nextLevel = state.level + 1;
                const isMaxLevel = state.level >= building.maxLevel;
                const canAfford = canAffordCost(resources, building.cost);

                return (
                  <article key={building.id} className="building-card">
                    <Icon src={building.icon} alt="" />
                    <div>
                      <p className="eyebrow">{building.reward}</p>
                      <h3>
                        {building.name} Lv.{state.level}
                      </h3>
                      <p>{building.description}</p>
                      <div className="building-meta">
                        <span>다음 목표: Lv.{Math.min(nextLevel, building.maxLevel)}</span>
                        <span>비용: {formatCurrencyMap(building.cost)}</span>
                        <span>시간: {building.baseDurationSeconds * Math.min(nextLevel, building.maxLevel)}초</span>
                      </div>
                    </div>
                    <div className="building-actions">
                      <button disabled={isMaxLevel || !canAfford} onClick={() => queueConstruction(building.id)}>
                        {isMaxLevel ? '최대 레벨' : '건설 예약'}
                      </button>
                      {state.pendingConfirmation ? (
                        <button className="secondary" onClick={() => confirmBuilding(building.id)}>
                          완료 확인
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Battle</p>
                <h2>장비 선택 전투</h2>
              </div>
            </div>
            <div className="gear-grid">
              {starterGear.map((gear) => (
                <GearButton
                  key={gear.id}
                  gear={gear}
                  active={selectedGearIds.includes(gear.id)}
                  onToggle={() => toggleGear(gear.id)}
                />
              ))}
            </div>

            <div className="stage-list">
              {stageDefinitions.map((stage) => (
                <button
                  key={stage.id}
                  className={stage.id === selectedStageId ? 'stage-card active' : 'stage-card'}
                  onClick={() => setSelectedStageId(stage.id)}
                >
                  <span>{stage.name}</span>
                  <strong>요구치 {formatBig(stage.encounterPower)}</strong>
                </button>
              ))}
            </div>

            <div className="battle-preview">
              <p className="muted">{selectedStage.note}</p>
              <p>선택 장비: {selectedGear.map((gear) => gear.name).join(', ') || '없음'}</p>
              <p>승리 보상: {formatCurrencyMap(selectedStage.reward)}</p>
              <button onClick={() => runBattle(selectedStage)}>전투 실행</button>
            </div>

            <div className="combat-log">{combatLog}</div>
          </section>
        </main>
      </div>
    </div>
  );
}

function DetailPanelSection({
  activeDetailPanel,
  resources,
  passiveAetherGain,
  buildings,
  lanes,
  now,
  selectedStage,
  projectedCombatPower,
  selectedGear,
}: {
  activeDetailPanel: DetailPanel;
  resources: Record<CurrencyKey, bigint>;
  passiveAetherGain: bigint;
  buildings: Record<string, BuildingState>;
  lanes: ConstructionLane[];
  now: number;
  selectedStage: StageDefinition;
  projectedCombatPower: bigint;
  selectedGear: GearCard[];
}) {
  if (activeDetailPanel === 'resources') {
    return (
      <div className="detail-card">
        <h3>재화 상세</h3>
        <div className="detail-grid">
          {Object.entries(resources).map(([key, value]) => (
            <article key={key} className="detail-item">
              <Icon src={currencyIcons[key as CurrencyKey]} alt="" />
              <span>{labelForCurrency(key as CurrencyKey)}</span>
              <strong>{formatBig(value)}</strong>
              <p>{describeResource(key as CurrencyKey, passiveAetherGain)}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (activeDetailPanel === 'construction') {
    return (
      <div className="detail-card">
        <h3>건설 상세</h3>
        <div className="detail-grid">
          {lanes.map((lane) => (
            <article key={lane.laneId} className="detail-item">
              <span>라인 {lane.laneId}</span>
              <strong>{lane.activeProject ? describeProject(lane.activeProject, now) : '비어 있음'}</strong>
              <p>
                예약:{' '}
                {lane.queue ? `${findBuildingName(lane.queue.buildingId)} Lv.${lane.queue.targetLevel}` : '없음'}
              </p>
            </article>
          ))}
          {buildingDefinitions.map((building) => (
            <article key={building.id} className="detail-item">
              <Icon src={building.icon} alt="" />
              <span>{building.name}</span>
              <strong>Lv.{buildings[building.id].level}</strong>
              <p>
                {building.reward}
                {buildings[building.id].pendingConfirmation ? ' / 완료 확인 대기 중' : ''}
              </p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="detail-card">
      <h3>전투 상세</h3>
      <div className="detail-grid">
        <article className="detail-item">
          <span>현재 도전</span>
          <strong>{selectedStage.name}</strong>
          <p>{selectedStage.note}</p>
        </article>
        <article className="detail-item">
          <span>전투력 비교</span>
          <strong>
            {formatBig(projectedCombatPower)} / {formatBig(selectedStage.encounterPower)}
          </strong>
          <p>{projectedCombatPower >= selectedStage.encounterPower ? '현재 조합으로 승리 가능' : '추가 성장 필요'}</p>
        </article>
        <article className="detail-item">
          <span>선택 장비</span>
          <strong>{selectedGear.map((gear) => gear.name).join(', ') || '없음'}</strong>
          <p>보상: {formatCurrencyMap(selectedStage.reward)}</p>
        </article>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function GearButton({
  gear,
  active,
  onToggle,
}: {
  gear: GearCard;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button className={active ? 'gear-card active' : 'gear-card'} onClick={onToggle}>
      <Icon src={gear.icon} alt="" />
      <span>{gear.slot === 'weapon' ? '무기' : '보조'}</span>
      <strong>{gear.name}</strong>
      <p>{gear.synergy}</p>
      <em>+{formatBig(gear.power)}</em>
    </button>
  );
}

function Icon({ src, alt }: { src: string; alt: string }) {
  return <img className="game-icon" src={src} alt={alt} aria-hidden={alt ? undefined : true} />;
}

function beginConstruction(buildingId: string, targetLevel: number, now: number): ActiveConstruction {
  const definition = buildingDefinitions.find((building) => building.id === buildingId)!;
  const duration = definition.baseDurationSeconds * 1000 * targetLevel;
  return {
    buildingId,
    targetLevel,
    startedAt: now,
    endsAt: now + duration,
  };
}

function findBuildingName(buildingId: string): string {
  return buildingDefinitions.find((building) => building.id === buildingId)?.name ?? buildingId;
}

function describeProject(project: ActiveConstruction, now: number): string {
  const remainingSeconds = Math.max(0, Math.ceil((project.endsAt - now) / 1000));
  return `${findBuildingName(project.buildingId)} Lv.${project.targetLevel} (${remainingSeconds}초 남음)`;
}

function canAffordCost(
  resources: Record<CurrencyKey, bigint>,
  cost: Partial<Record<CurrencyKey, bigint>>,
): boolean {
  return !Object.entries(cost).some(([key, value]) => resources[key as CurrencyKey] < (value ?? 0n));
}

function describeResource(key: CurrencyKey, passiveAetherGain: bigint): string {
  switch (key) {
    case 'gold':
      return '주요 건설과 성장에 쓰이는 기본 재화입니다.';
    case 'scrap':
      return '건설과 장비 성장에 들어가는 보조 재화입니다.';
    case 'aether':
      return `희귀 재화입니다. 현재 전투 승리 시 추가 +${formatBig(passiveAetherGain)}를 얻습니다.`;
  }
}
