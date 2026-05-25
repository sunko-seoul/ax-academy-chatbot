# Frontend

Next.js App Router 패턴 — Server Components 우선, RSC 경계, 상태관리.

## Server Components 우선 원칙

- 기본: Server Component (`async function Page()`)
- 클라이언트 필요 시만 `'use client'` 추가 — 이유를 주석으로 명시
- 데이터 패칭은 Server Component에서 직접. `useEffect` + fetch 패턴 금지

## RSC 경계 규칙

```
app/page.tsx (Server)
  └── components/ChatContainer.tsx ('use client' — 스트리밍 SSE 필요)
        └── components/MessageBubble.tsx (Server 가능 시 Server로)
```

## 상태 관리

- 서버 상태: React Server Components + SWR (필요 시)
- 클라이언트 전용 상태: `useState` / `useReducer`
- URL 상태: `useSearchParams` / `useRouter`

## 스트리밍 패턴

`/api/chat` SSE → `ReadableStream` → `useEffect`에서 읽기.
`EventSource` 대신 `fetch` + `ReadableStreamDefaultReader` 사용 (POST body 전송 가능).

## 관련 문서

→ `docs/DESIGN.md` (UI 가이드라인), `ARCHITECTURE.md` (레이어 구조)
