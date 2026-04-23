import { useEffect, useMemo, useState } from 'react';
import { buildingDefinitions, stageDefinitions, starterGear } from './data';
import { formatBig, formatCurrencyMap, labelForCurrency, multiplyPercent } from './utils';
import type {
  ActiveConstruction,
  BuildingState,
  ConstructionLane,
  CurrencyKey,
  GearCard,
  HeroStats,
  StageDefinition,
} from './types';

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
  const [combatLog, setCombatLog] = useState(
    '무기와 보조 장비를 골라 예상 공격력을 확인하세요.',
  );
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

        setBuildings((previous) => {
          const currentBuilding = previous[completed.buildingId];
          return {
            ...previous,
            [completed.buildingId]: {
              ...currentBuilding,
              level: Math.max(currentBuilding.level, completed.targetLevel),
              pendingConfirmation: true,
            },
          };
        });

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

  const buildingAttackBonus = useMemo(() => 1 + forgeLevel * 0.08, [forgeLevel]);
  const buildingDefenseBonus = useMemo(() => 1 + watchtowerLevel * 0.12, [watchtowerLevel]);
  const passiveAetherGain = BigInt(aetherPumpLevel);

  const projectedCombatPower = useMemo(() => {
    const gearPower = selectedGear.reduce((total, gear) => total + gear.power, 0n);
    const heroBase = hero.attack + multiplyPercent(hero.attack, hero.critRate * 50);
    const totalAttack = BigInt(Math.floor(Number(heroBase + gearPower) * buildingAttackBonus));
    const totalDefense = BigInt(Math.floor(Number(hero.defense) * buildingDefenseBonus));
    return totalAttack + totalDefense / 2n;
  }, [buildingAttackBonus, buildingDefenseBonus, hero.attack, hero.critRate, hero.defense, selectedGear]);

  function toggleGear(id: string) {
    setSelectedGearIds((current) => {
      if (current.includes(id)) {
        return current.filter((gearId) => gearId !== id);
      }

      if (current.length >= 2) {
        return [current[1], id];
      }

      return [...current, id];
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

    const currentLevel = buildings[buildingId].level;
    const targetLevel = currentLevel + 1;

    if (targetLevel > definition.maxLevel) {
      return;
    }

    const lacksCost = Object.entries(definition.cost).some(([key, value]) => {
      const amount = value ?? 0n;
      return resources[key as CurrencyKey] < amount;
    });

    if (lacksCost) {
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
          return {
            ...lane,
            activeProject: beginConstruction(buildingId, targetLevel, now),
          };
        }

        return {
          ...lane,
          queue: { buildingId, targetLevel },
        };
      }),
    );
  }

  function confirmBuilding(buildingId: string) {
    setBuildings((current) => ({
      ...current,
      [buildingId]: {
        ...current[buildingId],
        pendingConfirmation: false,
      },
    }));
  }

  return (
    <div className="app-shell">
      <header className="hero-banner">
        <div>
          <p className="eyebrow">GitHub Pages-ready idle battle prototype</p>
          <h1>Infinite Attack</h1>
          <p className="hero-copy">
            방치형 건설, 장비 선택형 턴제 전투, 큰 수치 누적을 전제로 한 웹 게임 시작점입니다.
          </p>
        </div>
        <div className="resource-panel">
          {Object.entries(resources).map(([key, value]) => (
            <div key={key} className="resource-chip">
              <span>{labelForCurrency(key as CurrencyKey)}</span>
              <strong>{formatBig(value)}</strong>
            </div>
          ))}
        </div>
      </header>

      <main className="dashboard">
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
                  예약: {lane.queue ? `${findBuildingName(lane.queue.buildingId)} Lv.${lane.queue.targetLevel}` : '없음'}
                </p>
              </article>
            ))}
          </div>

          <div className="building-list">
            {buildingDefinitions.map((building) => {
              const state = buildings[building.id];
              return (
                <article key={building.id} className="building-card">
                  <div>
                    <p className="eyebrow">{building.reward}</p>
                    <h3>
                      {building.name} Lv.{state.level}
                    </h3>
                    <p>{building.description}</p>
                    <p className="muted">비용: {formatCurrencyMap(building.cost)}</p>
                  </div>
                  <div className="building-actions">
                    <button onClick={() => queueConstruction(building.id)}>건설 예약</button>
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

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Architecture</p>
              <h2>추천 확장 순서</h2>
            </div>
          </div>
          <ol className="roadmap">
            <li>로컬 저장을 붙여 건설/자원/영웅 상태를 문자열 기반으로 직렬화</li>
            <li>마지막 접속 시각을 기준으로 오프라인 생산량과 건설 완료를 계산</li>
            <li>장비 획득, 강화, 스테이지 해금, 전투 로그를 데이터 테이블로 확장</li>
            <li>클라우드 저장은 이후 Supabase 같은 BaaS를 연결해 계정 단위로 동기화</li>
          </ol>
        </section>
      </main>
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
      <span>{gear.slot === 'weapon' ? '무기' : '보조'}</span>
      <strong>{gear.name}</strong>
      <p>{gear.synergy}</p>
      <em>+{formatBig(gear.power)}</em>
    </button>
  );
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
