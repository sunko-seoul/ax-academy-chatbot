-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 대화 목록
CREATE TABLE conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- 메시지 (대화 히스토리)
CREATE TABLE messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content          text,
  tool_calls       jsonb,
  created_at       timestamptz DEFAULT now()
);

-- 사내 knowledge base 문서
CREATE TABLE documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text NOT NULL,
  embedding   vector(1536),
  metadata    jsonb DEFAULT '{}',
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
