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
`if (user.id !== row.user_id)` 같은 앱 레이어 체크 ❌.

## 4. Secrets are server-only

`SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `SLACK_BOT_TOKEN`, `NOTION_API_KEY`는
server-only 경로에서만 import 가능 (ESLint `no-secret-in-client` 룰로 강제).

## 5. Tool failures must be graceful

Claude Agent SDK의 모든 tool은:

- 외부 API 실패 시 **throw하지 않고** `{ error: "..." }` 형태로 반환
- 타임아웃 5초 이내 (vitest contract test가 강제)

## 6. Prefer narrow utilities over deps

500 LOC 이하로 구현 가능한 기능에 외부 라이브러리 추가 ❌.

## 7. Co-locate types with implementation

타입은 사용처 가까이. 별도 `types/` 디렉토리 금지. `any` 사용 시 주석으로 이유 명시.

## 8. Don't memorize external libs — read references

외부 라이브러리 사용법이 헷갈리면 **`docs/references/*-llms.txt`를 먼저 읽어라**.

## 9. Korean UX, English code

사용자 노출 문자열: 한국어. 코드 식별자, 주석, 커밋 메시지: 영어.

## 10. Source attribution

챗봇이 답변할 때: Slack 결과 → permalink, Notion 결과 → URL, 사내 문서 → 제목+수정일 첨부.
