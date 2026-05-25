# Reliability

외부 API 호출, 재시도, graceful degradation 패턴.

## 외부 API 호출 원칙

모든 외부 API 호출 (Slack, Notion, Anthropic, Supabase) 은:

1. **Timeout 5초 이내** — tool contract test가 강제
2. **에러 시 throw 금지** — `{ error: "..." }` 반환 (Golden Rule #5)
3. **재시도 없음 (v1)** — 단순성 우선

## Rate Limiting

- `/api/chat`: 사용자당 분당 20 요청
- Slack API: 기본 Tier 1 제한 준수

## SSE 스트리밍 복구

클라이언트 SSE 연결 끊김 시 자동 재연결.
재연결 시 동일 `conversationId`로 히스토리 재로드.

## 저장 실패 정책 (v1)

스트리밍 완료 후 메시지 저장 실패 시:

- 서버 로그만 기록 (`console.error`)
- 클라이언트에 알림 없음

## 관련 문서

→ `docs/design-docs/core-beliefs.md` (Golden Rule #5, #6)
