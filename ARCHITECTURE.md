# Architecture

도메인 × 레이어 설계 맵. 자세한 설계 결정은 `docs/design-docs/`를 참조하세요.

## 비즈니스 도메인 (4개)

| 도메인 | 책임 |
|--------|------|
| `chat` | 대화, 메시지, Claude Agent 오케스트레이션 |
| `knowledge-base` | 문서 업로드, 임베딩, RAG 검색 |
| `auth` | 사용자 프로필, admin 권한 |
| `admin` | 관리자 UI (문서 CRUD) |

## 레이어 모델

```text
types → config → repo → service → runtime → ui
(Zod)   (env)   (DB)   (logic)   (route)  (React)
```

- import 방향: 왼쪽 → 오른쪽만 허용 (ESLint `layer-direction` 룰이 강제)
- 모든 레이어에서 `src/providers/*` import 가능

## 디렉토리 구조

```text
src/
├── domains/
│   ├── chat/
│   │   ├── types.ts, config.ts, repo.ts, service.ts
│   │   ├── runtime/
│   │   │   ├── agent.ts
│   │   │   └── tools/  (search-slack.ts, search-notion.ts, search-knowledge-base.ts)
│   │   └── __tests__/
│   ├── knowledge-base/, auth/, admin/
├── providers/
│   ├── auth.ts, connectors/slack.ts, connectors/notion.ts
│   ├── telemetry.ts, flags.ts
├── lib/utils/
└── app/
    ├── (auth)/page.tsx
    ├── chat/page.tsx, chat/[id]/page.tsx
    ├── admin/layout.tsx, admin/documents/page.tsx
    └── api/chat/route.ts, api/conversations/route.ts, api/admin/documents/route.ts
```

## 금지되는 의존성 패턴

| 위반 | ESLint 룰 |
|------|----------|
| 역방향 레이어 import (`repo` → `service`) | `layer-direction` |
| 도메인 간 직접 import (`chat` → `admin`) | `domain-boundary` |
| UI에서 DB 직접 호출 | `no-direct-db-in-ui` |
| 클라이언트에서 secret 참조 | `no-secret-in-client` |

예외: `src/providers/*`는 어디서든 import 가능.

## 관련 문서

- 황금 원칙: `docs/design-docs/core-beliefs.md`
- 보안 정책: `docs/SECURITY.md`
- 외부 라이브러리: `docs/references/`
- 품질 현황: `docs/QUALITY_SCORE.md`
- 신뢰성 패턴: `docs/RELIABILITY.md`
- UI 가이드: `docs/DESIGN.md`
- 프론트엔드: `docs/FRONTEND.md`
- 제품 스펙: `docs/product-specs/index.md`
- 실행 계획: `docs/exec-plans/index.md`
- 설계 문서: `docs/design-docs/index.md`
