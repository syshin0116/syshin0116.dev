# Project Page Structure

## 데이터

프로젝트마다 `data/projects.ts`의 `projects` 배열에 레코드 하나만 둡니다. 목록 카드(`/projects`, 홈의 최근 프로젝트)와 상세 페이지(`/projects/[projectId]`)가 같은 레코드를 읽으므로 제목, 기간, 링크가 서로 어긋나지 않습니다.

- `projectById`: id로 레코드를 찾는 조회표. 상세 페이지와 `scripts/verify-rendered-pages.ts`가 사용합니다.
- 배열 순서는 수동입니다. 홈은 앞의 세 개를 보여 주고, 목록과 이전/다음 이동은 `period` 시작 시점 최신순(`lib/projects.ts`의 `sortByStart`)을 씁니다.
- 상태(진행 중/완료)는 `period`가 `~ 진행 중`으로 끝나는지로 정합니다. 별도 완료 플래그는 없습니다.
- `techStack`의 키는 `TECH_STACK_LABELS`에 있는 범주만 쓸 수 있고, 화면에는 그 라벨이 나옵니다. 새 범주가 필요하면 라벨을 먼저 추가합니다.

## 레코드 필드

| 필드 | 쓰이는 곳 |
| --- | --- |
| `id` | URL (`/projects/<id>`). 기존 id는 바꾸지 않습니다. |
| `title`, `subtitle` | 상세 페이지 `h1`과 그 아래 한 줄. 목록 카드 제목도 `title`입니다. |
| `summary`, `tags`, `category`, `company` | 목록 카드 |
| `period`, `duration`, `role`, `team` | 상세 페이지 정보 상자 |
| `github`, `demo`, `package`, `blogPost` | 제목 아래 링크 (목록 카드에는 `github`, `demo`) |
| `metrics` | 상단 핵심 지표 2~4개. `after`가 크게, `before`와 `improvement`가 설명으로 나옵니다. |
| `demoImage` | 지표 아래 대표 이미지 |
| `description`, `businessGoals` | 배경 |
| `architectureEvolution`, `keyResponsibilities`, `keyFeatures`, `challenges`, `highlights`, `learnings` | 한 일 |
| `techStack` | 기술 스택 |
| `blogSeries` | 관련 글. 이 콘텐츠 폴더 바로 아래의 공개 글을 파일명 순으로 자동 나열합니다 (예: `Projects/Nuartz`). |

같은 숫자는 한 번만 씁니다. `metrics`에 올린 수치는 `highlights`, `team`, 아키텍처 결과 문장에서 반복하지 않습니다.

## 상세 페이지 순서

1. 제목(`h1`)과 한 줄 요약, 링크
2. 정보 상자: 기간, 역할, 팀, 상태
3. 핵심 지표
4. 대표 이미지
5. 배경
6. 한 일: 아키텍처 변화(문제, 결정, 결과), 담당 업무, 주요 기능, 문제와 해결, 결과, 배운 점
7. 기술 스택
8. 관련 글
9. 이전/다음 프로젝트

모든 내용은 펼친 상태로 보이고, 카드 안에 카드를 넣지 않습니다.

## 파일

```
web/
├── app/projects/page.tsx                 # 목록
├── app/projects/[projectId]/page.tsx     # 상세 라우트, 관련 글과 이전/다음 계산
├── components/project-timeline.tsx       # 목록 카드
├── components/project-detail-template.tsx
├── components/recent-projects.tsx        # 홈의 최근 프로젝트
├── data/projects.ts                      # 레코드와 기술 스택 라벨
└── lib/projects.ts                       # 정렬, 상태, 이전/다음, 관련 글
```
