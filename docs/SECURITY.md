# Security

보안 정책 — secret 관리, RLS, PII.

## Secret 관리

| Secret | 허용 위치 |
|--------|-----------|
| `SUPABASE_SECRET_KEY` | `app/api/**`, `src/providers/**`, `src/domains/*/repo.ts`, `src/domains/*/runtime/**` |
| `ANTHROPIC_API_KEY` | 동일 |
| `SLACK_BOT_TOKEN` | 동일 |
| `NOTION_API_KEY` | 동일 |

클라이언트 코드에서 위 변수 참조 시 ESLint `no-secret-in-client` 룰이 차단.

## Row Level Security

- 모든 Supabase 테이블에 RLS 활성화 필수 (Golden Rule #3)
- 새 테이블 생성 시 RLS 정책 없으면 마이그레이션 PR 차단

## PII 로깅 금지

- 사용자 이름, 이메일, 대화 내용을 서버 로그에 기록 금지
- 에러 로깅 시 `user_id`만 포함 (이메일 X)

## Admin 접근

- `profiles.is_admin = true`를 서버에서 검증
- 관리자 계정 최초 설정: Supabase 대시보드에서 수동으로 UPDATE

## 관련 문서

→ `docs/design-docs/core-beliefs.md` (Golden Rule #3, #4)
