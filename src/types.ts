export type CurrencyKey = 'gold' | 'scrap' | 'aether';

export type BuildingDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseDurationSeconds: number;
  maxLevel: number;
  cost: Partial<Record<CurrencyKey, bigint>>;
  reward: string;
};

export type BuildingState = {
  id: string;
  level: number;
  pendingConfirmation: boolean;
};

export type ConstructionLane = {
  laneId: number;
  activeProject: ActiveConstruction | null;
  queue: QueuedConstruction | null;
};

export type QueuedConstruction = {
  buildingId: string;
  targetLevel: number;
};

export type ActiveConstruction = QueuedConstruction & {
  startedAt: number;
  endsAt: number;
};

export type HeroStats = {
  level: number;
  attack: bigint;
  defense: bigint;
  hp: bigint;
  critRate: number;
};

export type GearCard = {
  id: string;
  name: string;
  slot: 'weapon' | 'aux';
  icon: string;
  power: bigint;
  synergy: string;
};

export type StageDefinition = {
  id: string;
  name: string;
  encounterPower: bigint;
  reward: Partial<Record<CurrencyKey, bigint>>;
  note: string;
};
