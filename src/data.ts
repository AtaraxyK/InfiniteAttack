import type {
  CurrencyKey,
  FieldPreview,
  SpecialPanel,
  ThemeKey,
  TownBuildingDefinition,
} from './types';
import forgeIcon from './assets/icons/forge.svg';
import watchtowerIcon from './assets/icons/watchtower.svg';
import aetherPumpIcon from './assets/icons/aether-pump.svg';
import goldIcon from './assets/icons/gold.svg';
import scrapIcon from './assets/icons/scrap.svg';
import aetherIcon from './assets/icons/aether.svg';

export const themeOptions: Array<{ key: ThemeKey; label: string }> = [
  { key: 'seaMist', label: '블루 미스트' },
  { key: 'forestMoss', label: '포레스트' },
  { key: 'deepSlate', label: '슬레이트' },
  { key: 'sandDusk', label: '샌드' },
  { key: 'roseAsh', label: '로즈 애쉬' },
];

export const currencyIcons: Record<CurrencyKey, string> = {
  gold: goldIcon,
  scrap: scrapIcon,
  aether: aetherIcon,
};

export const currencyLabels: Record<CurrencyKey, string> = {
  gold: '골드',
  scrap: '목재',
  aether: '시간석',
};

export const townBuildings: TownBuildingDefinition[] = [
  {
    id: 'house',
    name: '주인공의 집',
    description:
      '마을 성장의 기준이 되는 핵심 건물입니다. 다른 건물은 집 레벨보다 높게 올릴 수 없습니다.',
    category: 'house',
    icon: watchtowerIcon,
    maxLevel: 20,
    cost: { gold: 80n, scrap: 20n },
    baseDurationSeconds: 30,
    rewardText: '건물 최대 레벨 기준',
  },
  {
    id: 'field',
    name: '밭',
    description: '골드를 안정적으로 생산하는 기본 건물입니다.',
    category: 'normal',
    icon: goldIcon,
    maxLevel: 20,
    cost: { gold: 35n, scrap: 10n },
    baseDurationSeconds: 24,
    rewardText: '분당 골드 생산',
    production: { currency: 'gold', basePerMinute: 14n, perLevel: 8n },
  },
  {
    id: 'lumberyard',
    name: '벌목장',
    description: '건설과 연구에 필요한 목재를 꾸준히 공급하는 생산 건물입니다.',
    category: 'normal',
    icon: scrapIcon,
    maxLevel: 20,
    cost: { gold: 50n, scrap: 12n },
    baseDurationSeconds: 28,
    rewardText: '분당 목재 생산',
    production: { currency: 'scrap', basePerMinute: 9n, perLevel: 6n },
  },
  {
    id: 'timeShrine',
    name: '시간 제단',
    description: '희귀 재화인 시간석을 조금씩 생산합니다. 후반 확장에 중요한 건물입니다.',
    category: 'normal',
    icon: aetherIcon,
    maxLevel: 15,
    cost: { gold: 120n, scrap: 60n },
    baseDurationSeconds: 42,
    rewardText: '분당 시간석 생산',
    production: { currency: 'aether', basePerMinute: 1n, perLevel: 1n },
  },
  {
    id: 'lab',
    name: '연구소',
    description: '플레이어 기본 스탯과 마을 운영 보너스를 연구하는 특수 건물입니다.',
    category: 'research',
    icon: aetherPumpIcon,
    maxLevel: 10,
    cost: { gold: 100n, scrap: 40n },
    baseDurationSeconds: 36,
    rewardText: '연구 항목 해금',
  },
  {
    id: 'forge',
    name: '대장간',
    description: '무기와 장비 관련 기능을 준비하는 특수 건물입니다.',
    category: 'forge',
    icon: forgeIcon,
    maxLevel: 10,
    cost: { gold: 110n, scrap: 55n },
    baseDurationSeconds: 38,
    rewardText: '장비 기능 해금',
  },
  {
    id: 'builder',
    name: '건설소',
    description: '건설 속도와 건설 라인 확장 같은 보조 기능을 담당합니다.',
    category: 'builder',
    icon: watchtowerIcon,
    maxLevel: 10,
    cost: { gold: 130n, scrap: 80n },
    baseDurationSeconds: 44,
    rewardText: '건설 보조 기능 해금',
  },
  {
    id: 'market',
    name: '시장',
    description: '교환과 장비 보관 기능으로 이어질 예정인 특수 건물입니다.',
    category: 'market',
    icon: scrapIcon,
    maxLevel: 10,
    cost: { gold: 160n, scrap: 90n },
    baseDurationSeconds: 50,
    rewardText: '시장 기능 해금',
  },
  {
    id: 'inventory',
    name: '창고',
    description: '아이템, 재화, 소모품 보관 기능으로 이어질 공간입니다.',
    category: 'inventory',
    icon: goldIcon,
    maxLevel: 5,
    cost: { gold: 90n, scrap: 30n },
    baseDurationSeconds: 26,
    rewardText: '창고 기능 해금',
  },
  {
    id: 'fieldCollection',
    name: '기록관',
    description: '필드와 탐사 기록을 정리하는 특수 건물입니다.',
    category: 'fieldCollection',
    icon: watchtowerIcon,
    maxLevel: 5,
    cost: { gold: 140n, scrap: 45n },
    baseDurationSeconds: 40,
    rewardText: '필드 도감 해금',
  },
  {
    id: 'enemyCollection',
    name: '박물관',
    description: '적과 보스 기록을 보관하는 특수 건물입니다.',
    category: 'enemyCollection',
    icon: aetherPumpIcon,
    maxLevel: 5,
    cost: { gold: 150n, scrap: 55n },
    baseDurationSeconds: 40,
    rewardText: '적 도감 해금',
  },
];

export const specialPanels: SpecialPanel[] = [
  {
    tabId: 'lab',
    name: '연구소',
    shortName: '연구소',
    description: '전투와 마을 운영에 적용되는 기본 연구를 준비하는 공간입니다.',
    entries: [
      {
        id: 'lab-1',
        title: '작업 기록 정리',
        description: '마을 운영 효율을 높여 골드 생산 계수를 끌어올립니다.',
        effect: '골드 생산량 +8%',
        costText: '골드 120 / 목재 30',
      },
      {
        id: 'lab-2',
        title: '체력 훈련',
        description: '플레이어 기본 체력 증가 연구입니다.',
        effect: '플레이어 기본 체력 +5',
        costText: '골드 90 / 목재 25',
      },
      {
        id: 'lab-3',
        title: '비축 규약',
        description: '재화 보유 한도를 늘리는 운영 연구입니다.',
        effect: '골드 최대 보유량 +20%',
        costText: '골드 150 / 목재 40',
      },
    ],
  },
  {
    tabId: 'forge',
    name: '대장간',
    shortName: '대장간',
    description: '장비와 무기 기능으로 이어질 연구를 준비하는 공간입니다.',
    entries: [
      {
        id: 'forge-1',
        title: '초기 무기 틀',
        description: '기본 무기 카드 풀을 넓히는 연구입니다.',
        effect: '기본 무기 카드 1종 추가',
        costText: '골드 140 / 목재 65',
      },
      {
        id: 'forge-2',
        title: '보조 슬롯 확장',
        description: '장비 조합 선택지를 늘리는 보조 연구입니다.',
        effect: '보조 장비 슬롯 +1',
        costText: '골드 180 / 목재 90',
      },
      {
        id: 'forge-3',
        title: '합금 공정 개선',
        description: '장비 기본 수치를 끌어올리는 공정 연구입니다.',
        effect: '장비 기본 수치 계수 +6%',
        costText: '골드 220 / 목재 110',
      },
    ],
  },
  {
    tabId: 'builder',
    name: '건설소',
    shortName: '건설소',
    description: '건설 시간과 건설 라인 확장 관련 기능을 준비하는 공간입니다.',
    entries: [
      {
        id: 'builder-1',
        title: '작업 순환 정리',
        description: '건설에 쓰이는 전체 시간을 줄이는 운영 개선입니다.',
        effect: '건설 시간 5% 감소',
        costText: '골드 120 / 목재 60',
      },
      {
        id: 'builder-2',
        title: '보조 인력 배치',
        description: '추가 라인 확장으로 이어질 준비 연구입니다.',
        effect: '추가 건설 라인 준비',
        costText: '골드 260 / 목재 120 / 시간석 2',
      },
      {
        id: 'builder-3',
        title: '현장 기록 보강',
        description: '완료 확인 흐름을 더 보기 쉽게 정리하는 보조 기능입니다.',
        effect: '완료 알림 정리',
        costText: '골드 90 / 목재 45',
      },
    ],
  },
  {
    tabId: 'market',
    name: '시장',
    shortName: '시장',
    description: '교환과 장비 관리 기능으로 이어질 공간입니다.',
    entries: [
      {
        id: 'market-1',
        title: '장비 교환 준비',
        description: '장비 교환 시스템을 위한 기초 설계 단계입니다.',
        effect: '교환 기능 준비',
        costText: '골드 180 / 목재 80',
      },
      {
        id: 'market-2',
        title: '정산 규칙 정리',
        description: '추후 거래와 교환에 쓰일 정산 규칙입니다.',
        effect: '시장 기능 준비',
        costText: '골드 110 / 목재 70',
      },
    ],
  },
  {
    tabId: 'inventory',
    name: '창고',
    shortName: '창고',
    description: '아이템 보관과 소모품 사용 흐름으로 이어질 공간입니다.',
    entries: [
      {
        id: 'inventory-1',
        title: '시간석 보관함',
        description: '귀한 재화를 따로 보관하는 슬롯 구조입니다.',
        effect: '특수 재화 보관 기능 준비',
        costText: '보유 상태 확인 전용',
      },
      {
        id: 'inventory-2',
        title: '재화 분류 캐비닛',
        description: '재화와 소모품을 분류해서 보여줄 보관 체계입니다.',
        effect: '분류 UI 준비',
        costText: '보유 상태 확인 전용',
      },
    ],
  },
  {
    tabId: 'fieldCollection',
    name: '기록관',
    shortName: '기록관',
    description: '필드, 스테이지, 탐사 기록을 모아두는 공간입니다.',
    entries: [
      {
        id: 'field-1',
        title: '초원 지대',
        description: '가장 먼저 확인할 필드 기록입니다.',
        effect: '초기 필드 정보 정리',
        costText: '도감 기능 준비 중',
      },
      {
        id: 'field-2',
        title: '사막 지대',
        description: '다음 단계로 이어질 탐사 지역입니다.',
        effect: '후속 필드 정보 정리',
        costText: '도감 기능 준비 중',
      },
    ],
  },
  {
    tabId: 'enemyCollection',
    name: '박물관',
    shortName: '박물관',
    description: '적과 보스 기록을 정리해두는 공간입니다.',
    entries: [
      {
        id: 'enemy-1',
        title: '초원 병사',
        description: '초반 일반 적 기록 예시입니다.',
        effect: '일반 적 도감 준비',
        costText: '도감 기능 준비 중',
      },
      {
        id: 'enemy-2',
        title: '초원 감시자',
        description: '초반 엘리트 적 기록 예시입니다.',
        effect: '엘리트 적 도감 준비',
        costText: '도감 기능 준비 중',
      },
    ],
  },
];

export const fieldPreviews: FieldPreview[] = [
  {
    id: 'meadow',
    name: '초원',
    type: '초원',
    description: '가장 먼저 보게 될 기본 필드입니다. 아직은 목록만 확인할 수 있습니다.',
    status: '준비중',
  },
  {
    id: 'desert',
    name: '사막',
    type: '사막',
    description: '다음 단계로 이어질 후속 필드입니다. 아직 진입은 막혀 있습니다.',
    status: '준비중',
  },
];
