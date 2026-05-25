# Design

UI/UX 가이드라인 — shadcn/ui + 한국어 UX + 다크모드 정책.

## 컴포넌트 라이브러리

shadcn/ui를 기본으로 사용한다. 새 컴포넌트 추가 전 shadcn 목록을 먼저 확인하고,
없는 경우에만 직접 작성한다 (500 LOC 이하, Tailwind 클래스 기반).

## 한국어 UX 규약

- 사용자 노출 문자열은 모두 한국어
- 에러 메시지 포맷: `"[상황] [이유] [조치]"` — 예: "검색 결과가 없습니다. 다른 키워드로 시도해 보세요."
- Loading 상태: skeleton UI 우선, 스피너는 3초 이상 대기 시에만

## 다크모드 정책

v1: 시스템 설정을 따른다 (`prefers-color-scheme`). shadcn/ui의 CSS 변수 방식 사용.
사용자 토글은 v2에서 추가.

## 접근성

- 모든 인터랙티브 요소에 `aria-label` 필수
- 키보드 포커스 링 제거 금지
- 최소 명암비 WCAG AA (4.5:1)

## 관련 문서

→ `docs/FRONTEND.md` (React 패턴), `ARCHITECTURE.md` (레이어 구조)
