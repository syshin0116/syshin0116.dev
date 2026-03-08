---
title: "AI 개발 방법론 3종 비교: BMAD Method vs MoAI-ADK vs GitHub Spec Kit"
date: 2026-02-26
tags:
  - AI
  - agent
  - workflow
  - BMAD
  - MoAI-ADK
  - spec-kit
  - Agentic-AI
  - Claude-Code
  - development-methodology
  - vibe-coding
draft: false
enableToc: true
description: AI 코딩 도구가 넘쳐나는 시대, 실제로 개발 워크플로우를 바꿀 수 있는 방법론 3가지 — BMAD Method, MoAI-ADK, GitHub Spec Kit — 를 철저하게 비교한다.
summary: AI 코딩 도구가 넘쳐나는 시대, 실제로 개발 워크플로우를 바꿀 수 있는 방법론 3가지 — BMAD Method, MoAI-ADK, GitHub Spec Kit — 를 철저하게 비교한다.
published: 2026-02-26
modified: 2026-02-26
---

> [!summary]
> Claude Code, Cursor 같은 AI 코딩 어시스턴트가 대중화되면서, 이를 더 체계적으로 활용하기 위한 방법론들이 등장하고 있다. 이 글에서는 가장 주목받는 세 가지 — BMAD Method, MoAI-ADK, GitHub Spec Kit — 를 철학, 워크플로우, 에이전트 시스템, 실사용 경험까지 세세하게 비교한다.

---

## 왜 지금 이 비교인가

AI 코딩 어시스턴트가 진짜 쓸 만해지면서 새로운 고민이 생겼다. **"어떻게 쓰면 잘 쓰는 건가?"**

단순히 채팅창에 "이 기능 만들어줘"를 입력하는 수준을 넘어서, AI와 협업하는 *방법론*이 필요한 시점이 왔다. 그 수요를 정확히 겨냥한 세 프로젝트가 있다:

| 프로젝트 | 주체 | GitHub Stars | 라이선스 | 핵심 철학 |
|---|---|---|---|---|
| [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) | 커뮤니티 | ⭐ 38k | MIT | 협업 AI 에이전트로 애자일 개발 |
| [MoAI-ADK](https://github.com/modu-ai/moai-adk) | modu-ai (한국) | ⭐ 769 | GPL-3.0 | 빠름보다 품질, SPEC-First |
| [GitHub Spec Kit](https://github.com/github/spec-kit) | GitHub 공식 | ⭐ 72k | MIT | Spec-Driven Development |

세 가지 모두 "AI에게 일을 잘 시키는 법"을 다루지만, 접근 방식이 완전히 다르다.

---

## BMAD Method

### 개요

**BMAD**는 *Breakthrough Method for Agile AI-Driven Development*의 약자다. 2024년 초 개인 프로젝트로 시작해 현재 38,000개 이상의 스타를 받은 커뮤니티 주도 프레임워크다. v6.0.3까지 출시되었고, 118명의 컨트리뷰터가 참여하고 있다.

### 핵심 철학

> "AI가 대신 생각하게 만드는 것이 아니라, AI를 전문 협업자로서 구조화된 프로세스를 통해 당신의 최선을 끌어내도록 한다."

BMAD의 핵심 아이디어는 AI에게 **역할(페르소나)** 을 부여하는 것이다. PM, 아키텍트, 개발자, UX 디자이너, QA 등 12개 이상의 전문 에이전트 페르소나가 있고, 이들이 애자일 방식으로 협업한다. "Party Mode"를 켜면 여러 에이전트가 한 세션에서 동시에 대화한다.

### 워크플로우

```
분석(Analysis) → 기획(Planning) → 설계(Solutioning) → 구현(Implementation)
```

각 단계는 YAML 기반 워크플로우 파일로 정의된다. 에이전트 간 핸드오프가 명시적으로 일어나며, 어떤 에이전트가 어떤 작업을 담당하는지 명확하다.

### 생태계

BMAD는 단독 도구가 아니라 **모듈 생태계**다:

- **BMad Method (BMM)** — 34+ 핵심 워크플로우
- **BMad Builder (BMB)** — 커스텀 에이전트 생성
- **Test Architect (TEA)** — 위험 기반 테스트 전략
- **Game Dev Studio (BMGD)** — 게임 개발 특화
- **Creative Intelligence Suite (CIS)** — 디자인 싱킹 도구

```bash
npx bmad-method install
```

Node.js v20+ 기반이며, CI/CD 파이프라인을 위한 비대화형 설치도 지원한다.

### 실사용 경험

**좋은 점:**
- 문서 우선 개발로 AI 환각(hallucination)이 줄어든다. 스펙이 있으면 AI가 행동을 "발명"할 여지가 줄기 때문
- 레거시 시스템 현대화에 강하다. 감사 추적이 가능한 아티팩트(Git에 커밋된 PRD, 아키텍처 문서)를 생성
- 규제 산업(금융, 의료 등)에서의 컴플라이언스 추적에 유용

**어려운 점:**
- 학습 곡선이 가파르다. CLI 커맨드, YAML 설정, 6~7개 에이전트 역할과 핸드오프를 모두 이해해야 한다
- **토큰 비용이 높다.** 각 에이전트에 방대한 컨텍스트를 제공하기 때문에, 초기 버전 기준 월 API 비용이 $847에 달하는 사례도 있었다
- 한 에이전트의 결과물이 틀려도 하위 에이전트가 감지하지 못하는 경우가 있다. "AI 팀이 협력해서 잘못된 인증 기능을 완성하고, 완료로 마킹한" 사례가 보고됨
- YAML 워크플로우가 탐색적 프로젝트에는 너무 경직될 수 있다

---

## MoAI-ADK

### 탄생 배경: 실패에서 시작된 도구

MoAI-ADK를 만든 Goos Kim([goos.kim](https://goos.kim))은 2024년 초 와디즈에서 "모두의 사주"라는 GPT 기반 서비스를 직접 개발하다 3주 만에 API 비용 약 $500를 태우는 경험을 했다. 스파게티 코드, 문서와 코드의 비동기화, 컨텍스트 윈도우 소진 후 작업 맥락 유실—현재 많은 개발자들이 AI 코딩에서 겪는 문제들이 그대로였다.

이 실패 경험을 바탕으로 약 6개월간 TDD, DDD, 스펙 문서 방식 등 다양한 개발 방법론을 AI 에이전트에 직접 적용해보며 탄생한 것이 MoAI-ADK다. 원래는 Python으로 작성된 73,000줄짜리 프레임워크였는데, Go로 완전히 다시 작성해 단일 바이너리로 5ms 안에 시작된다(Python 버전은 ~800ms).

스타 수(769)는 다른 두 개에 비해 적지만, **한국어 README가 기본 제공**되고 한국 개발자 커뮤니티에서 활발히 사용되고 있다.

### 핵심 철학

> "바이브 코딩의 목적은 빠른 생산성이 아니라 코드 품질이다."

> "LLM은 거의 다 똑같은 것 같아요. 제일 중요한 건 사용자의 프롬프트가 문제지, 컨텍스트가 문제지, LLM의 성능은 이미 믿고 맡길 정도에 와 있다."

MoAI-ADK를 이해하는 두 가지 열쇠다. 대부분의 AI 코딩 도구들이 "더 빠르게"를 외칠 때, MoAI-ADK는 "더 좋게"를 강조한다. 그리고 모델 선택보다 **컨텍스트의 품질**이 결과를 결정한다는 관점에서 출발한다.

실제로 Goos Kim은 라이브 스트림에서 이렇게 말했다:

> "얘네들 범위를 정해 주지 않으면 막 중구난방이고 그냥 확률적으로 나오는 거니까. '이거 안 돼, 저거 안 돼' 다 막아 놓고 '요렇게만 해야 돼' 라고 하면 딱 그것만 바라보고 진행한다."

세 가지 근간 원칙:
1. **SPEC-First** — EARS(Easy Approach to Requirements Syntax) 형식의 명세서 작성이 구현보다 먼저. 재작업을 90% 줄인다고 주장
2. **TDD/DDD 자동 선택** — 신규 프로젝트는 TDD, 기존 프로젝트(커버리지 10% 미만)는 DDD로 자동 전환
3. **지능형 오케스트레이션** — 20개 전문 에이전트가 작업 복잡도에 따라 병렬/순차 실행

### TDD vs DDD: 언제 어느 쪽을?

MoAI-ADK의 독특한 점 중 하나는 **프로젝트 상황에 따라 개발 방법론을 자동으로 선택**한다는 것이다.

| 상황 | 방식 | 이유 |
|---|---|---|
| 신규 프로젝트 | **TDD** | 실패하는 테스트 코드를 먼저 작성해 맥락을 세션 내에서 유지 |
| 기존 프로젝트 (커버리지 <10%) | **DDD** | 수백 개 파일 대상 테스트 재작성은 비효율적 |

`moai project` 명령 실행 시 코드베이스를 자동 분석해 TDD/DDD를 결정한다. TDD에서는 AI가 테스트를 통과시키려 테스트 코드 자체를 수정하는 "치팅" 문제를 3~4중 지침으로 방지하고, 마지막 Sync 단계에서도 이중 검사한다.

### 에이전트 시스템

20개 에이전트가 세 계층으로 나뉜다:

**Manager 에이전트 (7개)** — 워크플로우 조율
- `manager-spec`: EARS 형식 명세서 생성
- `manager-ddd`: DDD 사이클 실행
- `manager-docs`: Nextra 통합 문서 생성
- `manager-quality`: TRUST 5 품질 검증
- `manager-git`: Git 작업 및 PR 자동화
- `manager-project`: 프로젝트 초기화
- `manager-strategy`: 아키텍처 의사결정

**Expert 에이전트 (9개)** — 도메인 전문성 제공
백엔드, 프론트엔드, 보안, DevOps, 디버깅, 테스팅, 리팩토링, 성능 최적화, UI/UX

**Builder 에이전트 (4개)** — 메타 프로그래밍
새 에이전트, 슬래시 커맨드, 스킬, 플러그인 생성

중앙에는 **Alfred SuperAgent**라는 전략적 오케스트레이터가 있어서 요청을 분석하고, 태스크 타입에 따라 라우팅하며, 최대 10개 에이전트를 병렬로 실행한다.

또한 두 가지 실행 모드가 있다:
- **Solo 모드** (`moai --solo`): 현재 Claude Code 세션 안의 서브 에이전트로 동작
- **Team 모드** (`moai --team`): 독립된 Claude Code 인스턴스를 병렬로 실행해 팀 리더처럼 지휘. 프론트엔드 + 백엔드 동시 개발에 적합하며, 구글 A2A 프로토콜과 유사한 양방향 소통이 가능

### TRUST 5 품질 프레임워크

모든 결과물에 5가지 품질 기준을 적용한다:

| 기준 | 내용 |
|---|---|
| **T**estable | 단위/통합 테스트, 커버리지 ≥85% |
| **R**eadable | 린팅(ruff), 네이밍 컨벤션, 문서화 |
| **U**nified | 코드 포맷팅 일관성 |
| **S**ecured | bandit + AST-grep 보안 스캔 |
| **T**rackable | 버전 컨트롤 통합, SPEC 추적, 진단 로깅 |

### 워크플로우: 3단계 + Sync의 핵심

```bash
moai project      # 프로젝트 분석, TDD/DDD 자동 선택, SPEC 폴더 생성
/moai:1-plan      # manager-spec이 .moai/specs/에 EARS 명세서 생성
/moai:2-run       # LSP 품질 게이트와 함께 구현 실행
/moai:3-sync      # 코드 ↔ 스펙 ↔ MX 주석 3방향 동기화 + Git 자동화
/moai:alfred      # 전체 자동화 (세 단계 병렬 실행)
```

**Sync 단계가 특히 중요하다.** 개발 중 DB 스키마가 UUID에서 시퀀스 번호로 바뀌는 등 코드가 스펙과 달라지면, Sync가 코드를 분석해 스펙 문서와 MX 주석을 모두 업데이트한다. 이 덕분에 6~7개월짜리 장기 프로젝트에서도 코드-문서 동기화가 유지된다. 단순히 스펙을 먼저 쓰는 것과 달리, **코드가 진화해도 스펙이 따라간다**는 점이 차별점이다.

`/moai:alfred`와 `moai loop` 명령을 조합하면 미완료 스펙이 완료될 때까지 자동으로 반복 실행되는 야간 무인 개발도 가능하다.

### MX 태그 시스템: 토큰 효율의 비밀

MoAI-ADK는 각 함수와 파일 상단에 에이전트가 읽을 수 있는 맥락 주석(@MX 태그)을 자동으로 삽입한다. 에이전트는 전체 코드를 읽지 않고 MX 태그만 검색해 파일 간 관계와 위치를 파악하므로 토큰 낭비가 크게 줄어든다. 16개 언어를 지원하며, 스킬 시스템과 함께 컨텍스트 점유 최소화의 핵심 기제다.

**스킬 시스템**: 500토큰 이내의 핵심 참조 문서로, 에이전트가 필요할 때만 로드한다. 회사 내부 라이브러리(예: LangChain 특정 버전 사용법)를 커스텀 스킬로 추가할 수 있다. MCP도 스킬로 변환해 토큰 소모를 대폭 줄일 수 있다.

### 비용 최적화: 모델 역할 분담

> "앞으로 회사들의 IT 경쟁력은 토큰 사용량에 비례할 것이다. 스타트업은 토큰을 얼마나 효율화하느냐가 기술력에 비례한다."

MoAI-ADK는 모델을 역할에 따라 분리해 비용을 최적화한다:

| 모델 | 용도 |
|---|---|
| Opus | 스펙 작성, 아키텍처 판단 |
| Sonnet | 일반 코딩 |
| Haiku | 탐색, 배시 작업 등 단순 처리 |
| GLM 4.7 | 팀 모드의 Worker (비용 대비 성능 최적) |

**CG 모드**: Leader가 Claude API로 판단하고, Worker들이 GLM API로 실행하는 하이브리드 구조. Claude Code 구독 플랜의 rate limit 내에서 최대 품질을 뽑아낸다.

### 컨텍스트 관리 전략

컨텍스트 윈도우가 꽉 찼을 때의 대응도 체계적이다. 스펙 문서 3개(프로젝트 문서, 스택 문서, 요구사항 문서)가 체크리스트 역할을 하기 때문에, 세션이 끊겨도 새 세션에서 이 세 파일을 읽으면 바로 이어서 진행할 수 있다. Auto Compact에 의존하기보다 수동 compact 또는 export 후 서브 에이전트가 맥락을 추출해 재개하는 방식을 권장한다.

### 기술적 특징 요약

- **단일 바이너리**, 의존성 없음 (Go 34,220줄, 32 패키지)
- **18개 프로그래밍 언어** 지원
- **16개 Claude Code 훅 이벤트** 통합
- **Git 기반 메모리**: 세션 간 컨텍스트 보존
- **E2E 테스트**: Playwright 연동으로 UX 레벨 검증

---

## GitHub Spec Kit

### 개요

**Spec Kit**은 GitHub이 2025년 9월 공식 출시한 오픈소스 개발 툴킷이다. 72,000개 이상의 스타를 받으며 세 가지 중 가장 큰 커뮤니티를 보유하고 있다. 2026년 2월 기준 v0.1.4이며, GitHub Copilot, Claude Code, Cursor, Windsurf, Gemini CLI 등 17개 이상의 AI 코딩 에이전트와 통합된다.

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

### 핵심 철학

> "명세서가 '실행 가능'해져서 구현을 직접 생성할 수 있어야 한다. 단순히 개발을 안내하는 수준이 아니라."

Spec Kit은 전통적인 개발 워크플로우를 **뒤집는다**. 명세서를 프리릴리즈 스캐폴딩이 아니라 핵심 아티팩트로 취급한다. "무엇을(what)"을 먼저 명확히 정의하고, "어떻게(how)"는 나중에 결정한다는 원칙이다.

네 가지 설계 원칙:
1. **인텐트 주도(Intent-driven)**: 스펙이 '무엇을'과 '왜'를 먼저 정의
2. **풍부한 명세서 생성**: 가드레일과 조직 원칙으로 제약된 스펙
3. **단계별 정제**: 단발성 프롬프트가 아닌 멀티스텝 정제
4. **고급 AI 활용**: 스펙 해석을 위해 모델의 고급 능력에 의존

### 6단계 워크플로우

```
/speckit.constitution  → 1단계: 프로젝트 거버넌스 원칙 수립
/speckit.specify       → 2단계: 요구사항 및 유저 스토리 정의
/speckit.clarify       → 3단계: 모호한 부분 명확화
/speckit.plan          → 4단계: 기술 아키텍처 계획 수립
/speckit.tasks         → 5단계: 실행 가능한 태스크 목록 생성
/speckit.implement     → 6단계: 구현 실행
```

**Constitution**이 특히 독특하다. 프로젝트 전반의 거버넌스 원칙을 미리 정의해두는 개념으로, 이후 모든 스펙과 구현이 이 헌법을 기준으로 평가된다. 기업의 클라우드 제공자 선택, 컴플라이언스 요구사항, 디자인 시스템 등을 여기에 담는다.

### 실사용 경험

Spec Kit은 GitHub이 직접 만든 만큼 높은 기대를 받았지만, 실사용 후기는 엇갈린다.

**Scott Logic의 리뷰 (Colin Eberhardt)** — KartLog 앱의 회로 관리 기능을 Spec Kit으로 재구현하는 실험:
- 피처 하나에 33~56분 소요 (기존 방식의 10배)
- 주기당 2,000줄 이상의 마크다운 생성 (실제 코드보다 문서가 더 많음)
- 단순한 버그(폼 데이터 미입력)가 여전히 발생 — 상세한 스펙이 있음에도
- **결론**: "흥미로운 개념이지만, 순수한 형태로는 비실용적. 애자일의 핵심 장점인 빠른 코드 생성을 낭비하는 재발명된 워터폴"

**긍정적인 측면:**
- 팀 협업 시 명시적인 검토 포인트를 만들어줌 — 코드 변경이 쌓이기 전에 스펙 단계에서 거부/수정 가능
- 기술 스택에 무관하게 동작 (Python, JS, Go, Rust 등 어디서나)
- 그린필드 + 브라운필드 모두 지원
- Constitution 기반 일관성이 장기 프로젝트에서 빛남

---

## 세 가지 비교 정리

### 철학 비교

| | BMAD | MoAI-ADK | Spec Kit |
|---|---|---|---|
| 핵심 가치 | **협업** | **품질** | **명확성** |
| AI 역할 | 전문 협업자 | 지능형 오케스트레이터 | 스펙 해석기 |
| 접근 방식 | 역할 기반 에이전트 | 단계별 품질 게이트 | 문서 주도 개발 |
| 인간의 역할 | 감독자 + 의사결정자 | SPEC 작성자 | 스펙 정의자 |

### 워크플로우 비교

| | BMAD | MoAI-ADK | Spec Kit |
|---|---|---|---|
| 단계 수 | 4단계 | 3단계 (+루프) | 6단계 |
| 자동화 수준 | 중간 (에이전트 조율) | 높음 (Alfred 자율 + 루프) | 낮음 (단계별 수동 진행) |
| 결과물 | YAML 워크플로우 + 코드 | SPEC + MX 주석 + 코드 (3방향 동기화) | Constitution + Spec + Plan + Tasks + 코드 |
| 속도 | 중간 | 빠름 (병렬 실행) | 느림 (많은 문서화) |
| 컨텍스트 관리 | 에이전트별 분리 | SPEC + MX 태그 기반 복원 | 단계별 문서로 재개 |

### 기술 비교

| | BMAD | MoAI-ADK | Spec Kit |
|---|---|---|---|
| 구현 언어 | JavaScript | Go | Python |
| 에이전트 수 | 12+ 페르소나 | 20개 전문 에이전트 | 에이전트 없음 (AI 도구에 위임) |
| 설치 | `npx bmad-method install` | 단일 바이너리 | `uv tool install` |
| AI 도구 통합 | Claude Code 등 | Claude Code 전용 | 17개+ AI 도구 |
| 비용 | 높음 (많은 토큰) | 최적화됨 (역할별 모델 + CG 모드) | 도구에 따라 다름 |

### 커뮤니티 비교

| | BMAD | MoAI-ADK | Spec Kit |
|---|---|---|---|
| Stars | 38k | 769 | 72k |
| 성숙도 | 높음 (v6, 23개 릴리즈) | 중간 (활발히 개발 중) | 낮음 (v0.1.4, 실험적) |
| 문서 | 풍부 | 한/영/일/중 다국어 | GitHub 공식 지원 |
| Discord | 있음 | 있음 | 없음 (Discussions) |

---

## 어떤 상황에 어떤 도구를?

### BMAD Method를 선택해야 할 때

- **팀 단위 개발** — 에이전트 역할이 팀 내 역할 분담을 자연스럽게 반영
- **엔터프라이즈 / 규제 업종** — 감사 가능한 아티팩트와 거버넌스 필요 시
- **레거시 시스템 현대화** — 비즈니스 로직 추적이 중요한 경우
- **애자일 프로세스가 이미 익숙한 팀** — PM-아키텍트-개발자 역할 분리가 자연스러운 환경

### MoAI-ADK를 선택해야 할 때

- **코드 품질이 최우선인 프로젝트** — 단순 기능 구현이 아니라 프로덕션 수준의 코드 필요
- **Claude Code를 주 도구로 사용하는 개발자** — 훅 통합과 최적화가 Claude Code에 맞춰져 있음
- **장기 프로젝트** — Sync의 3방향 동기화 덕분에 수개월 후에도 코드-문서 일관성 유지
- **기존 프로젝트 리팩토링** — DDD 사이클의 ANALYZE-PRESERVE-IMPROVE가 안전한 점진적 개선에 적합
- **API 비용 최적화** — 역할별 모델 분리 + CG 모드로 고비용 모델 사용 최소화
- **한국어 환경** — 다국어 README와 한국 커뮤니티

### GitHub Spec Kit을 선택해야 할 때

- **특정 AI 도구에 종속되기 싫은 경우** — 17개+ 도구 지원, 기술 스택 무관
- **문서화가 중요한 팀** — 상세한 스펙, 플랜, 태스크 아티팩트를 체계적으로 관리
- **그린필드 프로젝트의 초기 설계** — Constitution으로 일관된 거버넌스 원칙 수립
- **GitHub 생태계 활용** — Copilot과의 통합이 자연스럽고 GitHub 공식 지원

---

## 내 생각

세 도구 모두 결국 같은 문제를 다루고 있다: **AI에게 일을 시킬 때 어떻게 하면 엉망이 안 되는가.**

흥미로운 점은 이들의 해답이 정반대에 가깝다는 것이다:

- **Spec Kit**은 "더 많이 계획하라"고 말한다. 코드보다 문서를 먼저, 그리고 더 많이.
- **BMAD**는 "AI에게 역할을 줘라"고 말한다. 구조화된 에이전트 협업으로 일관성을 만든다.
- **MoAI-ADK**는 "품질 게이트를 걸어라"고 말한다. 자동화된 검증으로 결과물을 보증한다.

Goos Kim의 라이브에서 인상 깊었던 말이 있다:

> "2022년 11월 30일에 ChatGPT 3.5가 나오고 나서 느꼈던 게 뭔가 하면... 전 세계 모든 개발자 리셋이다. 오늘부터 1대1 모두. 프롬프트 엔지니어링부터 모든 환경이 달라지니까."

세 도구의 탄생 배경을 보면 이 말이 더 와닿는다. 개인 실패 경험에서 MoAI-ADK가, 레거시 시스템과의 사투에서 BMAD가, GitHub의 공식 문제 의식에서 Spec Kit이 나왔다. 방향은 달라도 모두 같은 현실을 마주하고 있다.

실사용 리뷰들을 보면, Spec Kit의 순수한 형태는 "재발명된 워터폴"이라는 비판을 피하기 어렵고, BMAD는 토큰 비용과 복잡성이 진입 장벽이 된다. MoAI-ADK는 Claude Code에 가장 깊이 통합되어 있고 비용 최적화와 품질 게이트 면에서 두드러지지만, 커뮤니티 규모와 Claude Code 전용이라는 제약이 있다.

세 도구가 앞으로 어떻게 수렴하거나 발산할지 지켜보는 것 자체가 흥미롭다. AI 개발 방법론은 지금 막 형성되는 중이다.

---

## 참고 자료

- [BMAD Method GitHub](https://github.com/bmad-code-org/BMAD-METHOD)
- [MoAI-ADK GitHub](https://github.com/modu-ai/moai-adk)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [모아이 ADK 소개 라이브 스트림 - Goos Kim 인터뷰](https://www.youtube.com/live/mFBaEZ4VAGI)
- [Applied BMAD - Reclaiming Control in AI Development](https://bennycheung.github.io/bmad-reclaiming-control-in-ai-dev)
- [Putting Spec Kit Through Its Paces: Radical Idea or Reinvented Waterfall?](https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html)
- [Spec-Driven Development with AI - GitHub Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [BMAD: The Agile Framework That Makes AI Actually Predictable - DEV Community](https://dev.to/extinctsion/bmad-the-agile-framework-that-makes-ai-actually-predictable-5fe7)
- [MoAI-ADK DeepWiki](https://deepwiki.com/modu-ai/moai-adk)
