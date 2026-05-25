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
| 에이전트 / Tools | `docs/design-docs/index.md` |
| RAG / 임베딩 | `docs/design-docs/index.md` |
| 보안 / 인증 | `docs/SECURITY.md` |
| 외부 라이브러리 | `docs/references/` |

## ✋ 절대 하지 마세요

- ❌ AGENTS.md에 임시 메모/규칙 추가 — 적절한 문서에 추가하고 여기서 링크만
- ❌ `docs/generated/` 수동 편집 — `npx tsx tools/update-generated.ts` 실행
- ❌ TDD 없이 구현 코드 작성 — 테스트가 먼저
- ❌ Supabase secret key를 클라이언트 코드에서 import
- ❌ HR 규정 같은 민감 정보를 코드 안에 하드코딩

## 🔀 superpowers 경로 오버라이드 (필수 절차)

superpowers 스킬들은 기본 경로에 출력합니다. 출력 직후 반드시 아래 경로로 이동:

| 스킬 호출 직후 | 수동 이동 |
|--------------|----------|
| `superpowers:brainstorming` 완료 | `docs/superpowers/specs/*.md` → `docs/product-specs/` |
| `superpowers:writing-plans` 완료 | `docs/superpowers/plans/*.md` → `docs/exec-plans/active/` |
| `superpowers:finishing-a-development-branch` 완료 | `docs/exec-plans/active/*.md` → `docs/exec-plans/completed/` |

이동 후 `tools/lint-structure.ts`가 `docs/superpowers/` 부재를 검증합니다 (CI에서 차단).

## 🔍 자체 검증

```bash
npm run verify    # lint + lint:docs + lint:links + typecheck + test
```

개별:
```bash
npm run lint        # eslint + markdownlint
npm run lint:docs   # AGENTS.md 링크 + 구조 검증
npm run lint:links  # lychee 내부 링크 체크
npm run test        # vitest
npm run typecheck   # tsc --noEmit
```

## 🚨 도움이 필요할 때

- 패턴 누락 → `docs/design-docs/core-beliefs.md`에 추가 PR
- 문서가 코드와 어긋남 → `docs/QUALITY_SCORE.md`에 부채 기록 + `docs/exec-plans/tech-debt-tracker.md`
- 새 외부 라이브러리 추가 → `docs/references/`에 LLM 문서 함께 추가
