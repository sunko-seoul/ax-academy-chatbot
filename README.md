# ax-academy-chatbot

사내 전용 AI 어시스턴트. 자연어 질문에 따라 Slack/Notion/사내 문서를 자동 검색해 답변합니다.

## 요구 사항

- Node.js 24+
- Supabase CLI: `brew install supabase/tap/supabase`
- lychee (docs 링크 체커): `brew install lychee`

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # API 키 입력 후 저장
npm run dev
```

## 개발 워크플로우

```bash
npm run verify    # 전체 검증 (lint + typecheck + test)
npm run test      # vitest 단위 테스트
npm run lint      # ESLint + markdownlint
npm run lint:docs # AGENTS.md 링크 + 구조 검증
```

## Windows 지원

v1은 macOS / Linux만 지원합니다. Windows 사용자는 WSL2를 사용하세요.

## 프로젝트 구조

→ [AGENTS.md](AGENTS.md) — 목차/맵 (여기서 시작)
→ [ARCHITECTURE.md](ARCHITECTURE.md) — 도메인 × 레이어 설계
