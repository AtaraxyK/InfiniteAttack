# Infinite Attack

정적 배포가 가능한 웹 기반 방치형 + 선택형 턴제 전투 게임의 시작 프로젝트입니다.  
배포 대상은 GitHub Pages를 기준으로 맞췄고, 초기 코어 루프는 아래 흐름을 전제로 잡았습니다.

- 건물 건설과 수동 완료 확인으로 계정 성장
- 영웅 레벨과 장비 조합으로 전투력 상승
- 스테이지 도전으로 재화 획득
- 큰 수치 누적을 고려한 `bigint` 기반 내부 계산

## 기술 선택

- `React + TypeScript + Vite`
- 정적 자산만으로 동작 가능
- `vite.config.ts`에서 GitHub Pages용 `base` 경로 설정

## 왜 이 구조가 맞는가

GitHub Pages는 서버 코드를 직접 돌릴 수 없기 때문에, 초기 버전은 아래 기준으로 설계하는 것이 안전합니다.

- 게임 로직은 전부 클라이언트에서 수행
- 저장은 먼저 로컬 저장으로 완성
- 이후 클라우드 저장은 외부 BaaS 연동

즉, 멀티플레이는 하지 않더라도 `Supabase` 같은 외부 저장소를 붙여 계정 저장은 충분히 가능합니다.

## 추천 시스템 설계

### 1. 저장 계층

- `localStorage` 또는 `IndexedDB`
- `lastUpdatedAt` 기록
- `bigint` 값은 저장 시 문자열로 변환

예시 저장 모델:

```ts
type SaveData = {
  version: 1;
  updatedAt: number;
  hero: {
    level: number;
    attack: string;
    defense: string;
    hp: string;
  };
  resources: Record<string, string>;
  buildings: Record<string, { level: number; pendingConfirmation: boolean }>;
  lanes: Array<{
    laneId: number;
    activeProject: null | {
      buildingId: string;
      targetLevel: number;
      startedAt: number;
      endsAt: number;
    };
    queue: null | {
      buildingId: string;
      targetLevel: number;
    };
  }>;
};
```

### 2. 방치형 시간 계산

게임이 꺼져 있던 시간은 `현재 시간 - 마지막 저장 시간`으로 계산합니다.

- 건설 완료 여부 반영
- 재화 생산량 계산
- 오프라인 최대 누적 시간 제한 가능

### 3. 전투 구조

실시간 조작이 아니라 선택형 전투이므로 다음처럼 단순하게 갈 수 있습니다.

- 스테이지 선택
- 장비 또는 무기 카드 선택
- 선택 조합으로 공격력 산출
- 적 요구치와 비교
- 승패 및 보상 반영

이 구조는 발라트로처럼 `선택의 재미`를 살리면서도 구현 복잡도를 낮춰줍니다.

### 4. 건설 구조

현재 초안은 다음 요구를 반영합니다.

- 동시 건설 2개
- 각 라인당 예약 1개
- 완료 후 즉시 적용이 아니라 `수동 확인`
- 특정 건물 레벨이 능력치/재화 생산에 영향

## GitHub Pages 배포

### 1. 저장소 이름

현재 설정은 저장소 이름이 `InfiniteAttack`일 것을 전제로 합니다.

`vite.config.ts`

```ts
base: process.env.NODE_ENV === 'production' ? '/InfiniteAttack/' : '/',
```

저장소 이름이 바뀌면 이 경로도 같이 바꿔야 합니다.

### 2. 설치와 실행

```bash
npm install
npm run dev
```

### 3. 빌드

```bash
npm run build
```

빌드 결과물은 `dist/`에 생성됩니다.

### 4. GitHub Pages 게시

가장 쉬운 방식은 GitHub Actions 또는 `gh-pages` 브랜치 게시입니다.  
정적 사이트이기 때문에 둘 다 가능합니다.

## 다음 구현 우선순위

1. 저장/불러오기
2. 오프라인 진행 계산
3. 장비 인벤토리와 강화
4. 스테이지 해금 규칙
5. 건물 효과 테이블화
6. 클라우드 저장 연동

## 클라우드 저장 주의점

GitHub Pages는 비밀 서버를 둘 수 없으니, 클라우드 저장은 별도 서비스가 필요합니다.

추천:

- `Supabase Auth + Database`
- 익명 로그인 또는 이메일 로그인
- 브라우저에서는 공개 가능한 `anon key`만 사용

민감한 검증 로직이 필요해지면 그때는 Pages만으로는 부족할 수 있습니다.
