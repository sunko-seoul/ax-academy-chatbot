# 개발 하네스 (Development Harness) 설계 문서

**날짜:** 2026-05-25
**대상 프로젝트:** ax-academy-chatbot (사내 전용 챗봇)
**참조 패턴:** OpenAI Codex 팀의 에이전트 우선 리포지터리 운영 방식
**개발 워크플로우:** superpowers 플러그인 + TDD
**상태:** 확정

---

## 1. 목적과 범위

### 1.1 목적
사내 챗봇 제품을 **에이전트가 안정적으로 작성·검증·유지**할 수 있는 리포지터리 환경(하네스)을 구축한다. OpenAI Codex 팀이 5개월간 100만 라인 코드를 손으로 한 줄도 안 쓰고 만든 사례에서 검증된 패턴을 우리 상황(소규모 팀, Next.js + Supabase + Claude Agent SDK, superpowers TDD)에 맞춰 적용한다.

### 1.2 v1 범위
- `docs/` 디렉토리 구조 + 8종 핵심 문서 시드 콘텐츠
- `AGENTS.md` (목차/맵, ~100라인) + `CLAUDE.md` 심볼릭 링크
- 황금 원칙(`core-beliefs.md`) 10개 원칙
- 아키텍처 레이어 모델 + 도메인 분할 (`ARCHITECTURE.md`)
- 자체 검증 5가지 (markdown lint, 링크 체커, AGENTS.md 무결성, docs 구조, ESLint 커스텀 룰)
- npm scripts + GitHub Actions CI 게이트
- superpowers 경로 오버라이드 설정

### 1.3 v2 (out of scope)
- Doc-gardening 백그라운드 에이전트 (정기 PR 생성)
- Worktree별 격리 옵저버빌리티 스택
- Chrome DevTools Protocol 통합 (UI 검증 자동화)
- 의존성 방향 그래프 시각화 (`dependency-cruiser`)
- Quality score 자동 갱신

---

## 2. 디렉토리 구조

```
ax-academy-chatbot/
├── AGENTS.md                          ← 목차/맵 (~100 lines)
├── CLAUDE.md                          ← AGENTS.md 심볼릭 링크
├── ARCHITECTURE.md                    ← 도메인×레이어 최상위 맵
├── README.md                          ← 사람용 빠른 시작
├── docs/
│   ├── design-docs/
│   │   ├── index.md
│   │   ├── core-beliefs.md            ← 황금 원칙 10개
│   │   ├── agent-tool-design.md       ← (챗봇 구현 시 작성)
│   │   └── rag-strategy.md            ← (챗봇 구현 시 작성)
│   ├── product-specs/
│   │   ├── index.md
│   │   ├── 2026-05-25-internal-chatbot-design.md     ← 기존 챗봇 스펙 이전
│   │   └── 2026-05-25-development-harness-design.md  ← 본 문서 이전
│   ├── exec-plans/
│   │   ├── active/                    ← writing-plans 출력
│   │   ├── completed/                 ← 완료 시 이동
│   │   └── tech-debt-tracker.md
│   ├── generated/
│   │   ├── db-schema.md               ← Supabase 스키마 dump (AUTO-GENERATED)
│   │   └── api-routes.md              ← Next.js route 인벤토리 (AUTO-GENERATED)
│   ├── references/
│   │   ├── claude-agent-sdk-llms.txt
│   │   ├── supabase-llms.txt
│   │   ├── nextjs-app-router-llms.txt
│   │   └── pgvector-llms.txt
│   ├── DESIGN.md
│   ├── FRONTEND.md
│   ├── PLANS.md
│   ├── PRODUCT_SENSE.md
│   ├── QUALITY_SCORE.md
│   ├── RELIABILITY.md
│   └── SECURITY.md
├── tools/
│   ├── lint-agents-md.ts              ← AGENTS.md 링크/orphan 검증
│   ├── lint-structure.ts              ← docs/ 구조 검증
│   └── update-generated.ts            ← generated/ 재생성
├── .github/workflows/verify.yml       ← CI 게이트
└── eslint.config.mjs                  ← 커스텀 룰 포함
```

### 2.1 superpowers 출력 경로 오버라이드
superpowers 플러그인은 기본적으로 `docs/superpowers/specs/`, `docs/superpowers/plans/`에 출력한다. 이를 다음 경로로 오버라이드한다 (AGENTS.md에 명시):
- `superpowers:brainstorming` → `docs/product-specs/YYYY-MM-DD-<topic>-design.md`
- `superpowers:writing-plans` → `docs/exec-plans/active/YYYY-MM-DD-<topic>-plan.md`
- 완료된 plan은 `docs/exec-plans/completed/`로 이동

---

## 3. AGENTS.md (목차/맵)

전체 내용 (~100라인):

```markdown
# AGENTS.md

> 이 파일은 코드베이스의 **목차**입니다. 자세한 내용은 링크된 문서를 참조하세요.
> 한 곳에 모든 걸 담지 않습니다 — 컨텍스트는 희소 리소스입니다.

## 🎯 이 프로젝트는

전 직원이 사용하는 사내 AI 어시스턴트. 자연어 질문에 따라 Slack/Notion/사내 문서를 자동 검색해 답변.
- 제품 스펙: `docs/product-specs/2026-05-25-internal-chatbot-design.md`
- 아키텍처: `ARCHITECTURE.md`

## ⚡ 작업 시작 전 반드시 확인

1. **황금 원칙**: `docs/design-docs/core-beliefs.md` — 위반 시 PR 자동 차단
2. **활성 실행 계획**: `docs/exec-plans/active/` — 현재 진행 중인 작업
3. **품질 점수**: `docs/QUALITY_SCORE.md` — 손대는 도메인의 현재 상태

## 🛠 개발 워크플로우 (superpowers + TDD)

| 작업 | 사용 skill | 출력 위치 |
|------|----------|----------|
| 새 기능 설계 | `superpowers:brainstorming` | `docs/product-specs/` |
| 구현 계획 | `superpowers:writing-plans` | `docs/exec-plans/active/` |
| 계획 실행 | `superpowers:executing-plans` | (TDD 사이클) |
| 코드 작성 | `superpowers:test-driven-development` | 테스트 먼저, 구현 후 |
| 리뷰 | `superpowers:requesting-code-review` | (PR 코멘트) |
| 완료 | `superpowers:finishing-a-development-branch` | plan을 completed/로 이동 |

## 📚 기술 영역별 진입점

| 작업 영역 | 시작 파일 |
|---------|----------|
| 프론트엔드 (UI/React) | `docs/FRONTEND.md` → `docs/DESIGN.md` |
| API 라우트 / 서버 | `docs/RELIABILITY.md` → `ARCHITECTURE.md` |
| 데이터베이스 / 스키마 | `docs/generated/db-schema.md` |
| 에이전트 / Tools | `docs/design-docs/agent-tool-design.md` |
| RAG / 임베딩 | `docs/design-docs/rag-strategy.md` |
| 보안 / 인증 | `docs/SECURITY.md` |
| 외부 라이브러리 | `docs/references/*-llms.txt` |

## ✋ 절대 하지 마세요

- ❌ AGENTS.md에 임시 메모/규칙 추가 — 적절한 문서에 추가하고 여기서 링크만
- ❌ `docs/generated/` 수동 편집 — `tools/update-generated.ts` 실행
- ❌ TDD 없이 구현 코드 작성 — 테스트가 먼저
- ❌ Supabase service role 키를 클라이언트 코드에서 import
- ❌ HR 규정 같은 민감 정보를 코드 안에 하드코딩
- ❌ superpowers 기본 경로(`docs/superpowers/...`) 사용 — 위 표의 경로로 오버라이드

## 🔍 자체 검증

PR 열기 전:
\```bash
npm run verify    # lint + lint:docs + typecheck + test
\```

개별 명령:
\```bash
npm run lint        # eslint + markdownlint
npm run lint:docs   # AGENTS.md 링크 + 구조 검증
npm run test        # vitest (TDD 결과물)
npm run typecheck   # tsc --noEmit
\```

## 🚨 도움이 필요할 때

- 패턴이 누락되어 보임 → `docs/design-docs/core-beliefs.md`에 추가 PR
- 문서가 코드와 어긋남 → `docs/QUALITY_SCORE.md`에 부채 기록 + `tech-debt-tracker.md`
- 새 외부 라이브러리 추가 → `docs/references/`에 LLM 문서 함께 추가
```

`CLAUDE.md`는 `ln -s AGENTS.md CLAUDE.md`로 심볼릭 링크 처리 (단일 소스 유지).

---

## 4. 황금 원칙 (`docs/design-docs/core-beliefs.md`)

```markdown
# Core Beliefs

이 프로젝트의 모든 코드와 문서가 따라야 할 원칙. 위반은 PR 차단 사유.

## 1. Parse, don't validate (경계에서)
외부에서 들어오는 모든 데이터(API request body, 외부 API response, env vars)는
**Zod 스키마로 파싱**해서 타입을 좁혀야 한다. 검증 후 캐스팅 ❌.

## 2. TDD always
구현 코드 작성 전 **반드시** `superpowers:test-driven-development` skill을 호출.
순서: 실패하는 테스트 → 최소 구현 → 리팩토링. 예외 없음.

## 3. RLS first
데이터 접근 권한은 **Supabase Row Level Security가 1차 방어선**.
애플리케이션 레이어에서 `if (user.id !== row.user_id)` 같은 체크 ❌.
RLS 정책으로 표현 가능한 모든 권한은 RLS로.

## 4. Secrets are server-only
- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `SLACK_BOT_TOKEN`, `NOTION_API_KEY`는
  **`app/api/`, `src/providers/`, `src/domains/*/repo.ts`, `src/domains/*/runtime/`에서만 import 가능** (ESLint 룰로 강제)
- `NEXT_PUBLIC_*` prefix 없는 env var를 클라이언트 코드에서 참조 ❌

## 5. Tool failures must be graceful
Claude Agent SDK의 모든 tool은:
- 외부 API 실패 시 **에러를 throw하지 않고** `{ error: "..." }` 형태로 반환
- Claude가 자연어로 사용자에게 안내할 수 있도록
- 타임아웃 5초 이내

## 6. Prefer narrow utilities over deps
500 LOC 이하로 구현 가능한 기능에 외부 라이브러리 추가 ❌.
`src/lib/utils/`에 직접 작성. 단, 테스트 커버리지 100% 필수.

## 7. Co-locate types with implementation
- 타입은 사용처 가까이 (별도 `types/` 디렉토리 만들지 않음)
- 도메인 공유 타입만 `src/domains/*/types.ts`에 둠
- `any` 사용 시 주석으로 이유 명시

## 8. Don't memorize external libs — read references
외부 라이브러리(Claude SDK, Supabase, Next.js) 사용법이 헷갈리면
**`docs/references/*-llms.txt`를 먼저 읽어라**. 기억에 의존하지 말 것.

## 9. Korean UX, English code
- 사용자 노출 문자열: 한국어
- 코드 식별자, 주석, 커밋 메시지: 영어
- 예외: 한국 비즈니스 도메인 용어 (예: `연차`, `직급`)

## 10. Source attribution (agent의 행동 규칙)
챗봇이 답변할 때:
- Slack 결과 → 메시지 permalink 첨부
- Notion 결과 → 페이지 URL 첨부
- 사내 문서 → 문서 제목 + 마지막 수정일 첨부
"~인 것 같습니다" 같은 hedging 표현 시 반드시 출처 명시
```

---

## 5. 아키텍처 레이어 모델 (`ARCHITECTURE.md`)

### 5.1 비즈니스 도메인 (4개)
- `chat` — 대화, 메시지, agent orchestration
- `knowledge-base` — 문서 업로드, 임베딩, RAG 검색
- `auth` — 사용자 프로필, admin 권한
- `admin` — 관리자 UI (문서 CRUD)

### 5.2 레이어 모델 (도메인 내부)

```
types  →  config  →  repo  →  service  →  runtime  →  ui
(Zod)    (env)     (DB)     (logic)     (route)     (React)
```

- import 방향: 왼 → 오 (역방향 차단)
- 같은 레이어 내 import 가능
- 모든 레이어가 `src/providers/*`는 import 가능

### 5.3 디렉토리 매핑

```
src/
├── domains/
│   ├── chat/
│   │   ├── types.ts
│   │   ├── config.ts
│   │   ├── repo.ts
│   │   ├── service.ts
│   │   ├── runtime/
│   │   │   ├── agent.ts
│   │   │   └── tools/
│   │   │       ├── search-slack.ts
│   │   │       ├── search-notion.ts
│   │   │       └── search-knowledge-base.ts
│   │   └── __tests__/
│   ├── knowledge-base/
│   ├── auth/
│   └── admin/
├── providers/
│   ├── auth.ts
│   ├── connectors/
│   │   ├── slack.ts
│   │   └── notion.ts
│   ├── telemetry.ts
│   └── flags.ts
├── lib/
│   └── utils/                    ← 좁은 헬퍼만
└── app/                          ← Next.js App Router (UI 레이어)
    ├── (auth)/page.tsx
    ├── chat/...
    ├── admin/...
    └── api/                      ← runtime을 얇게 wrapping
```

### 5.4 금지되는 의존성 패턴

| 위반 | 예시 | ESLint 룰 |
|------|------|----------|
| 역방향 import | `repo.ts`가 `service.ts`를 import | `layer-direction` |
| 도메인 간 직접 import | `chat/service.ts`가 `admin/repo.ts`를 import | `domain-boundary` |
| UI → repo 직접 호출 | `ChatPage.tsx`가 Supabase 클라이언트 직접 사용 | `no-direct-db-in-ui` |
| service에서 외부 API 직접 호출 | `chat/service.ts`가 `fetch('slack...')` | `no-external-fetch-in-service` |
| 클라이언트에서 secret 참조 | `'use client'` 파일이 `SUPABASE_SERVICE_ROLE_KEY` 참조 | `no-secret-in-client` |

예외: `src/providers/*`는 어디서든 import 가능.

---

## 6. 핵심 문서 시드 콘텐츠

각 파일은 빈 껍데기가 아니라 **초기 시드 내용**으로 시작 (에이전트가 패턴 학습).

| 파일 | 라인 한도 | 초기 내용 |
|-----|---------|----------|
| `docs/DESIGN.md` | 200 | shadcn/ui 컴포넌트 기본, 한국어 UX 규약, 다크모드 정책 |
| `docs/FRONTEND.md` | 200 | Server Components 우선, RSC 경계, 상태관리(Zustand vs Server state) |
| `docs/PLANS.md` | 200 | "active/에 진행중 계획. 완료 시 completed/로 이동" + tech-debt-tracker 사용법 |
| `docs/PRODUCT_SENSE.md` | 200 | "1) 직원 시간 절약 최우선 2) 모른다고 답하기를 두려워하지 않음 3) 출처 투명성" |
| `docs/QUALITY_SCORE.md` | 200 | 표: 도메인 / 등급(A~D) / 마지막 갱신 / 부채 노트 — 초기엔 모든 도메인 N/A |
| `docs/RELIABILITY.md` | 200 | "외부 API 호출은 항상 timeout + retry, graceful degradation 패턴, p99 응답시간 목표" |
| `docs/SECURITY.md` | 200 | "service role key는 서버에서만, RLS 우선, secret은 env, PII 로깅 금지" |
| `docs/design-docs/index.md` | - | design-docs/ 하위 파일 목록 + 각각의 목적 |
| `docs/product-specs/index.md` | - | product-specs/ 하위 파일 목록 + 각각의 상태 |

**규칙:**
- 모든 파일은 첫 줄에 `# {파일명}` 헤딩 + 한 문장 목적 설명
- 모든 파일은 반드시 `AGENTS.md` 또는 `ARCHITECTURE.md`에서 링크되어야 함
- 200라인 초과 시 `design-docs/`로 분리 (린터가 경고)

---

## 7. 자체 검증 메커니즘 (5종)

### 7.1 Markdown lint
- 도구: `markdownlint-cli2`
- 검사: 문법, 헤딩 일관성, 줄 길이 ≤ 120
- 설정 파일: `.markdownlint-cli2.jsonc`

### 7.2 링크 체커
- 도구: `lychee` (offline 모드)
- 검사: `AGENTS.md`, `ARCHITECTURE.md`, `docs/**/*.md`의 모든 내부 링크가 실존
- 외부 링크는 검사 대상 제외 (네트워크 의존성 회피)

### 7.3 AGENTS.md 무결성 (`tools/lint-agents-md.ts`)
직접 작성. 다음을 검증:
- AGENTS.md에서 언급된 모든 `docs/*.md` 파일이 실존
- `docs/`의 모든 `.md` 파일이 AGENTS.md 또는 ARCHITECTURE.md에서 최소 1회 링크됨 (orphan 검출)
- 각 `docs/*.md` 파일이 200라인 이하 (예외 디렉토리: 아래 참조)
- 각 파일 첫 줄이 `# {제목}` 형식 (예외 디렉토리: 아래 참조)

**Orphan 검출 예외 (디렉토리 단위 링크로 충분):**
- `docs/exec-plans/active/**` — AGENTS.md가 `active/` 디렉토리를 통째로 참조하므로 개별 plan은 orphan 아님
- `docs/exec-plans/completed/**` — 동일
- `docs/generated/**` — AUTO-GENERATED, 디렉토리로 참조
- `docs/references/**` — `.txt` 파일이므로 `.md` 스캔 대상 자체에서 제외

**라인 한도/첫줄 헤딩 예외:**
- `docs/generated/**` (자동 생성)
- `docs/references/**` (외부 자료, 형식 다양)
- `docs/exec-plans/**` (plan 템플릿은 §7.4에서 별도 검증)

검사 대상 glob: `docs/**/*.md` (단 `docs/references/`는 .txt만 있어 자동 제외).

종료 코드: 위반 시 1, 메시지에 위반 파일/사유 명시.

### 7.4 docs/ 구조 검증 (`tools/lint-structure.ts`)
- `docs/exec-plans/active/` 의 모든 파일이 **비어있지 않고 최소 1개의 H2 헤더 보유** (superpowers writing-plans 출력 형식이 안정화되기 전까지 느슨하게 적용; v2에서 엄격 템플릿으로 강화)
- `docs/product-specs/` 의 파일명이 `YYYY-MM-DD-*.md` 패턴
- `docs/generated/` 의 모든 파일 첫 줄에 `<!-- AUTO-GENERATED: do not edit -->`
- `docs/superpowers/`가 **존재하지 않아야 함** (경로 오버라이드 강제)
- 종료 코드: 위반 시 1

### 7.5 ESLint 커스텀 룰 (`eslint.config.mjs`)

5개 커스텀 룰을 `eslint-plugin-local`로 직접 작성. 모두 `@typescript-eslint/parser` + `parserOptions.project: './tsconfig.json'`을 요구 (타입 정보 활용).

| 룰 ID | 검사 방식 | 검사 내용 | 위반 메시지 |
|------|---------|----------|------------|
| `no-secret-in-client` | **경로 allowlist 방식** — `SUPABASE_SERVICE_ROLE_KEY` 등 지정 변수를 참조하는 파일이 허용 경로(`app/api/**`, `src/providers/**`, `src/domains/*/repo.ts`, `src/domains/*/runtime/**`)에 없으면 위반. `'use client'` 디렉티브 감지는 사용하지 않음 (§4 원칙 4와 일치). | secret env var가 허용 경로 밖에서 참조 | "Secret X cannot be used outside allowed paths. Allowed: app/api/**, src/providers/**, src/domains/*/repo.ts, src/domains/*/runtime/**. See docs/SECURITY.md." |
| `domain-boundary` | AST: import 경로 분석 | `src/domains/X`가 `src/domains/Y` import | "Cross-domain import detected. Use providers or duplicate logic. See ARCHITECTURE.md." |
| `layer-direction` | AST: import 경로 + 파일명 매핑 | 역방향 레이어 import | "Layer violation: repo cannot import service. See ARCHITECTURE.md." |
| `no-direct-db-in-ui` | AST: import source 검사 | `src/app/**/*.tsx`가 `@supabase/supabase-js` import | "UI must call API routes, not DB directly. See ARCHITECTURE.md." |
| `tool-must-return-error` | **타입 기반** — `@typescript-eslint`의 `getTypeAtLocation`으로 export 함수 반환 타입이 `{ error: string }` union을 포함하는지 검사 | `src/domains/chat/runtime/tools/*` export 함수가 `Promise<{...} \| { error: string }>` 형태 아님 | "Tools must return { error: string } union. See docs/design-docs/core-beliefs.md#5." |

→ 모든 메시지는 **수정 방법 + 관련 문서 경로** 포함 (에이전트 다음 시도에서 참조).

---

## 8. npm scripts + CI

### 8.1 npm scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . && markdownlint-cli2 \"**/*.md\" \"#node_modules\"",
    "lint:docs": "tsx tools/lint-agents-md.ts && tsx tools/lint-structure.ts && lychee --offline --no-progress 'docs/**/*.md' AGENTS.md ARCHITECTURE.md",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify": "npm run lint && npm run lint:docs && npm run typecheck && npm run test",
    "update-generated": "tsx tools/update-generated.ts"
  }
}
```

### 8.2 CI 게이트 (`.github/workflows/verify.yml`)

```yaml
name: verify
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run lint
      - run: npm run lint:docs
      - run: npm run typecheck
      - run: npm run test
```

PR 차단 정책: 위 단계 중 하나라도 실패 시 머지 불가.

---

## 9. superpowers TDD 통합

### 9.1 워크플로우

```
1. 새 기능 요청
     ↓
2. superpowers:brainstorming
     → docs/product-specs/YYYY-MM-DD-<topic>-design.md 생성
     ↓
3. superpowers:writing-plans
     → docs/exec-plans/active/YYYY-MM-DD-<topic>-plan.md 생성
     ↓
4. superpowers:executing-plans
     → 각 step마다:
         a. superpowers:test-driven-development 호출
         b. 실패 테스트 → 최소 구현 → 리팩토링
         c. npm run verify로 자체 검증
     ↓
5. superpowers:requesting-code-review
     ↓
6. superpowers:finishing-a-development-branch
     → plan을 docs/exec-plans/completed/로 이동
     → QUALITY_SCORE.md 업데이트
```

### 9.2 경로 오버라이드
superpowers는 기본적으로 `docs/superpowers/specs/`, `docs/superpowers/plans/`에 출력. 본 하네스에서는 AGENTS.md에 명시된 경로로 오버라이드한다. 에이전트는 작업 시작 시 AGENTS.md를 먼저 읽으므로 자동으로 올바른 경로에 출력하게 됨.

명시적 보장을 위해 `tools/lint-structure.ts`가 `docs/superpowers/`가 비어있는지 검증 (있으면 위반).

---

## 10. 부트스트랩 순서

이 하네스 자체의 구축 순서. **린터를 먼저 만들고 그 다음 문서를 작성**해야 검증 체인이 성립한다 (chicken-and-egg 회피). `writing-plans`에서 상세 plan으로 확장됨.

| 단계 | 작업 | 검증 |
|-----|------|------|
| 1 | Next.js 15 App Router + TypeScript + Tailwind 프로젝트 초기화 | `npm run build` 성공 (build만, verify는 아직) |
| 2 | 의존성 추가 (vitest, eslint, @typescript-eslint/*, markdownlint-cli2, lychee, tsx, zod, @anthropic-ai/agent-sdk, @supabase/supabase-js) | `npm install` 성공 |
| 3 | **린터 도구 먼저 작성 (TDD)** — `tools/lint-agents-md.ts`, `tools/lint-structure.ts` + fixture 테스트 | vitest로 fixture 통과 |
| 4 | ESLint 커스텀 룰 5개 작성 (TDD) + `eslint.config.mjs` 설정 (TS 프로젝트 참조 포함) | 룰별 fixture 테스트 통과 |
| 5 | `docs/` 디렉토리 + 8종 핵심 문서 시드 작성 (`DESIGN.md`, `FRONTEND.md`, `PLANS.md`, `PRODUCT_SENSE.md`, `QUALITY_SCORE.md`, `RELIABILITY.md`, `SECURITY.md`, `design-docs/core-beliefs.md` + 각 디렉토리 `index.md`) | (아직 AGENTS.md 없음) 파일 존재 확인 |
| 6 | `ARCHITECTURE.md` 작성 | 파일 존재 |
| 7 | `AGENTS.md` 작성 + `CLAUDE.md` 심볼릭 링크 (`ln -s AGENTS.md CLAUDE.md`) | 양쪽 존재, symlink target 정확 |
| 8 | 이제 `tools/lint-agents-md.ts` 실행 → 통과해야 함 | 통과 |
| 9 | `package.json` scripts + `.github/workflows/verify.yml` 작성 | 로컬에서 `npm run verify` 통과 |
| 10 | 기존 챗봇 스펙(`docs/superpowers/specs/2026-05-25-internal-chatbot-design.md`)과 본 문서를 `docs/product-specs/`로 이동 → `docs/superpowers/` 디렉토리 삭제 | `tools/lint-structure.ts`가 `docs/superpowers/` 부재 확인 |
| 11 | CI 워크플로우에 **symlink 보존 가드** 추가: `test -L CLAUDE.md` (CLAUDE.md가 심볼릭 링크인지 확인) | CI 통과 |

**Symlink 정책 (Section 11):**
- 개발/배포 환경: macOS, Linux (Vercel) — git symlink 정상 동작
- Windows 미지원 (v1): contributor가 Windows를 쓸 경우 `git config core.symlinks=true` + Developer Mode 필요. README에 명시
- CI 가드: `test -L CLAUDE.md && diff CLAUDE.md AGENTS.md` (symlink 깨졌거나 내용 불일치 시 실패)

부트스트랩 완료 후 → 챗봇 제품 구현은 `superpowers:writing-plans`로 전환.

---

## 11. 성공 기준

1. 부트스트랩 step 9 완료 후 `npm run verify`가 통과한다 (시드 콘텐츠가 자체 검증 통과)
2. 의도적으로 황금 원칙 위반 코드를 작성하면 ESLint 또는 lint:docs가 차단한다
3. AGENTS.md에 없는 새 문서를 임의 디렉토리에 만들면 lint:docs가 orphan으로 감지한다 (단 §7.3의 예외 디렉토리 제외)
4. CI 게이트가 PR을 차단할 수 있다 (실제 PR로 검증)
5. superpowers의 brainstorming/writing-plans/executing-plans가 지정된 경로에 출력한다
6. `CLAUDE.md` 심볼릭 링크가 깨지면 CI가 차단한다
7. `tool-must-return-error` 룰이 throw하는 tool 코드를 차단한다 (타입 정보 기반)
8. `no-secret-in-client` 룰이 허용 경로 밖에서 secret 사용 시 차단한다 (경로 기반)
