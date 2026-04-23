import type { BuildingDefinition, GearCard, StageDefinition } from './types';

export const buildingDefinitions: BuildingDefinition[] = [
  {
    id: 'forge',
    name: '대장간',
    description: '무기 계열 공격력을 올려 전투 점수를 안정적으로 끌어올립니다.',
    baseDurationSeconds: 45,
    maxLevel: 20,
    cost: { gold: 120n, scrap: 15n },
    reward: '무기 공격력 +8%',
  },
  {
    id: 'watchtower',
    name: '감시탑',
    description: '스테이지 정보를 더 많이 보여주고 방어 점수에 보너스를 제공합니다.',
    baseDurationSeconds: 75,
    maxLevel: 20,
    cost: { gold: 180n, scrap: 25n },
    reward: '방어력 +12%, 정찰 보너스',
  },
  {
    id: 'aetherPump',
    name: '에테르 펌프',
    description: '희귀 재화 생산량을 높여 장기 성장의 속도를 끌어올립니다.',
    baseDurationSeconds: 120,
    maxLevel: 15,
    cost: { gold: 260n, aether: 6n },
    reward: '에테르 생산량 +1',
  },
];

export const starterGear: GearCard[] = [
  { id: 'iron-blade', name: '철검', slot: 'weapon', power: 32n, synergy: '기본 공격 배율 안정' },
  { id: 'burst-hammer', name: '파열 해머', slot: 'weapon', power: 48n, synergy: '높은 단일 턴 점수' },
  { id: 'scope-lens', name: '조준 렌즈', slot: 'aux', power: 18n, synergy: '치명타 기대값 상승' },
  { id: 'gyro-core', name: '자이로 코어', slot: 'aux', power: 24n, synergy: '연계 무기 보정' },
];

export const stageDefinitions: StageDefinition[] = [
  {
    id: 'stage-1',
    name: '먼지 평원 1-1',
    encounterPower: 95n,
    reward: { gold: 60n, scrap: 8n },
    note: '입문 전투. 무기 1장만 골라도 클리어 가능한 난이도입니다.',
  },
  {
    id: 'stage-2',
    name: '먼지 평원 1-2',
    encounterPower: 180n,
    reward: { gold: 120n, scrap: 16n },
    note: '무기와 보조 장비 조합을 의도한 구간입니다.',
  },
  {
    id: 'stage-3',
    name: '유리 협곡 2-1',
    encounterPower: 360n,
    reward: { gold: 260n, scrap: 22n, aether: 3n },
    note: '건물 보너스와 장비 시너지가 중요해지는 구간입니다.',
  },
];
