export type CurrencyKey = 'gold' | 'scrap' | 'aether';

export type ThemeKey = 'seaMist' | 'forestMoss' | 'deepSlate' | 'sandDusk' | 'roseAsh';

export type TownTabId =
  | 'town'
  | 'outing'
  | 'lab'
  | 'forge'
  | 'builder'
  | 'market'
  | 'inventory'
  | 'fieldCollection'
  | 'enemyCollection';

export type BuildingCategory =
  | 'house'
  | 'normal'
  | 'research'
  | 'forge'
  | 'builder'
  | 'market'
  | 'inventory'
  | 'fieldCollection'
  | 'enemyCollection';

export type TownBuildingDefinition = {
  id: string;
  name: string;
  description: string;
  category: BuildingCategory;
  icon: string;
  maxLevel: number;
  cost: Partial<Record<CurrencyKey, bigint>>;
  baseDurationSeconds: number;
  rewardText: string;
  production?: {
    currency: CurrencyKey;
    basePerMinute: bigint;
    perLevel: bigint;
  };
};

export type BuildingState = {
  id: string;
  level: number;
  pendingConfirmation: boolean;
};

export type QueuedConstruction = {
  buildingId: string;
  targetLevel: number;
};

export type ActiveConstruction = QueuedConstruction & {
  startedAt: number;
  endsAt: number;
};

export type ConstructionLane = {
  laneId: number;
  activeProject: ActiveConstruction | null;
  queue: QueuedConstruction | null;
};

export type SpecialPanelEntry = {
  id: string;
  title: string;
  description: string;
  effect: string;
  costText: string;
};

export type SpecialPanel = {
  tabId: TownTabId;
  name: string;
  shortName: string;
  description: string;
  entries: SpecialPanelEntry[];
};

export type FieldPreview = {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
};
