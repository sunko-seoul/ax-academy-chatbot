# 사내 전용 챗봇 설계 문서

**날짜:** 2026-05-25  
**스택:** Next.js (App Router) + Claude Agent SDK + Supabase  
**상태:** 확정

---

## 1. 개요

전 직원이 사용하는 범용 사내 업무 도우미 챗봇. 사원이 자연어로 질문하면 Claude Agent SDK가 적절한 도구(Slack 검색, Notion 검색, 사내 knowledge base 조회)를 자동 선택해 답변을 스트리밍으로 제공한다. 모든 대화는 Supabase에 영구 저장되며 이어서 대화할 수 있다.

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App (App Router)           │
│                                                      │
│  ┌──────────────┐   ┌─────────────────────────────┐ │
│  │   Chat UI    │   │       Admin UI (/admin)      │ │
│  │  (스트리밍)   │   │  (문서 업로드/편집/삭제)      │ │
│  └──────┬───────┘   └──────────────┬──────────────┘ │
│         │                          │                 │
│  ┌──────▼──────────────────────────▼──────────────┐ │
│  │              API Routes                         │ │
│  │  POST /api/chat        (SSE 스트리밍)            │ │
│  │  GET/POST /api/conversations                    │ │
│  │  POST /api/admin/documents                      │ │
│  └──────────────────┬───────────────────────────-─-┘ │
└─────────────────────│───────────────────────────────┘
                      │
          ┌───────────▼──────────────┐
          │   Claude Agent SDK       │
          │   Model: claude-sonnet-4-6│
          │   (Orchestrator Agent)   │
          │                          │
          │  Tools:                  │
          │  • search_slack          │
          │  • search_notion         │
          │  • search_knowledge_base │
          └───────┬──────────────────┘
                  │
    ┌─────────────┼──────────────────┐
    ▼             ▼                  ▼
 Slack API    Notion API       Supabase
                              (pgvector RAG)
                                    │
                            ┌───────▼───────┐
                            │  Supabase DB  │
                            │ • users (Auth)│
                            │ • conversations│
                            │ • messages    │
                            │ • documents   │
                            │   (+ vectors) │
                            └───────────────┘
```

---

## 3. 데이터 모델 (Supabase)

```sql
-- 대화 목록
CREATE TABLE conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,              -- 첫 메시지 기반 자동 생성
  created_at  timestamptz DEFAULT now()
);

-- 메시지 (대화 히스토리)
CREATE TABLE messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content          text NOT NULL,
  tool_calls       jsonb,                 -- 에이전트 tool call 로그
  created_at       timestamptz DEFAULT now()
);

-- 사내 knowledge base 문서
CREATE TABLE documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text NOT NULL,             -- 원본 텍스트 청크
  embedding   vector(1536),              -- pgvector 임베딩
  metadata    jsonb DEFAULT '{}',        -- 카테고리, 작성자, 버전 등
  created_by  uuid REFERENCES auth.users(id),
  updated_at  timestamptz DEFAULT now()
);

-- 사용자 프로필 (관리자 권한)
CREATE TABLE profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin  boolean NOT NULL DEFAULT false
);

-- RLS 정책
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see own conversations"
  ON conversations FOR ALL USING (user_id = auth.uid());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see own messages"
  ON messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  ));

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all authenticated users can read documents"
  ON documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "only admins can write documents"
  ON documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));
```

---

## 4. Claude Agent SDK 설계

### 에이전트 정의

```typescript
// lib/agent.ts
import { Agent, run } from "@anthropic-ai/agent-sdk";

const internalAgent = new Agent({
  name: "사내 어시스턴트",
  model: "claude-sonnet-4-6",
  instructions: `
    당신은 사내 직원들의 업무를 돕는 AI 어시스턴트입니다.
    질문에 따라 Slack, Notion, 사내 문서를 검색해 정확한 정보를 제공하세요.
    - 검색 결과가 있으면 출처(링크 또는 문서명)를 함께 제공하세요.
    - 정보를 찾지 못하면 모른다고 솔직히 말하고 관리자에게 문의하도록 안내하세요.
    - 한국어로 답변하세요.
  `,
  tools: [searchSlack, searchNotion, searchKnowledgeBase],
});
```

### Tools 정의

| Tool | 입력 파라미터 | 동작 | 출력 |
|------|------------|------|------|
| `search_slack` | `query: string`, `channel?: string`, `limit?: number` | Slack API `/search.messages` 호출 | 관련 메시지 목록 + 링크 |
| `search_notion` | `query: string`, `limit?: number` | Notion API search 호출 | 관련 페이지 제목 + 요약 + 링크 |
| `search_knowledge_base` | `query: string` | Supabase pgvector 코사인 유사도 검색 | 관련 문서 청크 (상위 5개) |

### 스트리밍 API Route

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message, conversationId } = await req.json();
  
  // 인증 확인
  const user = await getAuthUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  // 이전 대화 히스토리 로드
  const history = await loadHistory(conversationId);

  // 에이전트 실행 (스트리밍)
  const stream = run(internalAgent, [...history, { role: "user", content: message }]);

  // 메시지 저장 (백그라운드)
  saveMessages(conversationId, message, stream);

  // SSE 스트리밍 응답
  return stream.toTextStreamResponse();
}
```

### 에이전트 실행 흐름 예시

**HR 규정 질문:**
```
사용자: "연차 휴가는 몇 일이야?"
  → search_knowledge_base("연차 휴가 일수") 실행
  → HR 규정 문서 청크 반환
  → "연차 휴가는 입사 1년 미만 11일, 1년 이상 15일입니다. (HR 규정 2024 기준)"
```

**Slack 채널 검색:**
```
사용자: "지난주 마케팅팀 채널에서 캠페인 얘기 뭐 있었어?"
  → search_slack("캠페인", channel="마케팅") 실행
  → Slack 메시지 목록 반환
  → Claude가 요약 후 스트리밍
```

---

## 5. 문서 임베딩 파이프라인 (Admin)

```
관리자가 파일 업로드 (PDF / TXT / MD)
  → 서버에서 텍스트 추출
  → 500~800 token 단위로 청크 분할 (overlap 50 tokens)
  → 각 청크에 대해 임베딩 생성 (text-embedding-3-small 또는 Claude)
  → Supabase documents 테이블에 content + embedding 저장
```

---

## 6. 페이지 구조 (Next.js App Router)

```
app/
├── page.tsx                  → 로그인 페이지
├── chat/
│   ├── page.tsx              → 메인 채팅 (새 대화)
│   └── [id]/page.tsx         → 이전 대화 이어서
├── admin/
│   ├── layout.tsx            → 관리자 권한 검증 레이아웃
│   └── documents/
│       └── page.tsx          → 문서 목록 / 업로드 / 편집 / 삭제
└── api/
    ├── chat/route.ts         → 에이전트 스트리밍
    ├── conversations/route.ts
    └── admin/
        └── documents/route.ts
```

**채팅 UI 레이아웃:**
```
┌──────────────────────────────────────────────┐
│  [사이드바]           │  [채팅 영역]            │
│                      │                        │
│  + 새 대화           │  assistant: 안녕하세요! │
│  ──────────────      │                        │
│  오늘                 │  user: 연차 며칠이야?  │
│  • 연차 문의          │                        │
│  • 마케팅 채널 검색   │  [🔍 HR 규정 검색 중...]│
│                      │  assistant: ▌(스트리밍) │
│  어제                 │                        │
│  • Q1 목표 확인      │  [입력창______________] │
└──────────────────────────────────────────────┘
```

- Tool 실행 중 상태 표시: "🔍 Slack 검색 중...", "📄 사내 문서 검색 중..."
- 대화 제목은 첫 메시지를 Claude가 자동 요약

---

## 7. 보안

| 항목 | 구현 방식 |
|------|----------|
| 라우트 보호 | Supabase Auth 미들웨어로 모든 `/api/*` 보호 |
| 관리자 접근 | `profiles.is_admin=true` 서버 측 검증 |
| API 키 노출 | Slack/Notion/Anthropic 키는 서버 환경변수만 |
| 데이터 격리 | Supabase RLS — 본인 대화만 조회 가능 |
| 문서 접근 | 전직원 read, 관리자만 write |

---

## 8. 에러 처리

| 상황 | 처리 |
|------|------|
| Slack API 실패 | tool이 에러 반환 → Claude가 자연어로 안내 |
| Notion API 실패 | 동일 — graceful degradation |
| 검색 결과 없음 | "관련 문서를 찾지 못했습니다. 관리자에게 문의하세요" |
| 스트리밍 연결 끊김 | SSE 자동 재연결 |
| 권한 없는 /admin 접근 | 403 → /chat 리다이렉트 |

---

## 9. 환경변수

```bash
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # 서버 전용

# 외부 연동
SLACK_BOT_TOKEN=
NOTION_API_KEY=
```

---

## 10. v1 범위 (Out of scope)

- BigQuery 연동 → v2
- 팀별 권한 세분화 → v2
- 멀티 에이전트 (orchestrator → sub-agents) → v2
- 대화 공유 기능 → v2
