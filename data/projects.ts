export interface ProjectTimeline {
  id: string;
  title: string;
  period: string;
  year: number;
  periodType: "Q" | "H";
  periodNumber: number;
  isCompleted: boolean;
  description: string;
  tags: string[];
  category: "company" | "personal"; // 회사 프로젝트 vs 개인 프로젝트
}

export interface ProjectDetail {
  id: string;
  title: string;
  subtitle: string;
  period: string;
  duration: string;
  role: string;
  team: string;
  description: string;
  techStack: {
    [key: string]: string[];
  };
  achievements?: (string | {
    metric: string;
    before: string;
    after: string;
    improvement: string;
  })[];
  keyFeatures?: {
    title: string;
    details: string[];
  }[];
  keyResponsibilities?: {
    title: string;
    details: string[];
  }[];
  businessGoals?: {
    title: string;
    description?: string;
    items?: string[];
  }[];
  architectureEvolution?: {
    version: string;
    title: string;
    problems?: string[];
    changes?: string[];
    results?: string[];
  }[];
  challenges?: {
    title: string;
    description: string;
  }[];
  learnings?: string[];
}

// Timeline data for the main projects page
export const projectsTimeline: ProjectTimeline[] = [
  // 진행 중인 프로젝트 (최신순)
  {
    id: "apphub",
    title: "AppHub - Living Portfolio 플랫폼",
    period: "2025.11 ~ 진행 중",
    year: 2025,
    periodType: "H",
    periodNumber: 2,
    isCompleted: false,
    description: "실제 동작하는 프로젝트들을 통합 관리하는 Living Portfolio 플랫폼. 모든 개인 프로젝트를 통합하는 플랫폼으로 개발. 인증, 데이터베이스, AI 백엔드 등을 통합 관리.",
    tags: ["Full Stack", "Next.js 15", "React 19", "LangGraph", "Supabase"],
    category: "personal"
  },
  {
    id: "sk-pharmaaix",
    title: "SK PharmaAIX MR Assistant",
    period: "2025.07 ~ 진행 중",
    year: 2025,
    periodType: "H",
    periodNumber: 2,
    isCompleted: false,
    description: "제약 영업 지원 AI 챗봇 - RAG 기반 질의응답 시스템",
    tags: ["AI/ML", "LangGraph", "FastAPI", "Azure"],
    category: "company"
  },
  {
    id: "katech-ai-agent",
    title: "한국자동차연구원 AI 에이전트",
    period: "2024.03 ~ 진행 중",
    year: 2024,
    periodType: "H",
    periodNumber: 1,
    isCompleted: false,
    description: "자동차 분야 특화 RAG 기반 보고서 자동 생성 시스템",
    tags: ["Full Stack", "RAG", "Next.js", "FastAPI"],
    category: "company"
  },

  // 완료된 프로젝트 (최신순)
  {
    id: "naver-hackathon",
    title: "네이버 부스트캠프 기업 해커톤",
    period: "2025.01 ~ 2025.02",
    year: 2025,
    periodType: "Q",
    periodNumber: 1,
    isCompleted: true,
    description: "기업 평가 챗봇 개발 해커톤 기획 및 운영",
    tags: ["해커톤", "멘토링", "챗봇"],
    category: "company"
  },
  {
    id: "langchain-tutorial",
    title: "LangChain Open Tutorial 기여",
    period: "2025.01 ~ 2025.02",
    year: 2025,
    periodType: "Q",
    periodNumber: 1,
    isCompleted: true,
    description: "2,000+ 커밋 오픈소스 프로젝트에 RAG 튜토리얼 작성",
    tags: ["오픈소스", "LangChain", "RAG", "LangGraph"],
    category: "personal"
  },
  {
    id: "greentech",
    title: "그린텍 하수처리 수질 예측 AI",
    period: "2024.07 ~ 2024.11",
    year: 2024,
    periodType: "H",
    periodNumber: 2,
    isCompleted: true,
    description: "하수처리 공정 수질 예측 및 이상탐지 AI 시스템",
    tags: ["AI/ML", "LightGBM", "PyTorch", "Time Series"],
    category: "company"
  },
  {
    id: "podlybot",
    title: "PodlyBot - 카카오톡 LLM 챗봇",
    period: "2024.09",
    year: 2024,
    periodType: "H",
    periodNumber: 2,
    isCompleted: true,
    description: "개인 비서 & 회사 업무용 LLM 챗봇 - URL 요약, Notion 자동 정리, 회사 LLM 서비스 연동",
    tags: ["챗봇", "LLM", "Notion API", "JavaScript"],
    category: "personal"
  },
  {
    id: "podly",
    title: "Podly - AI 음성 뉴스 서비스",
    period: "2024.08 ~ 2024.09",
    year: 2024,
    periodType: "H",
    periodNumber: 2,
    isCompleted: true,
    description: "AI 기반 맞춤형 음성 뉴스 및 관심사 정보 제공 서비스",
    tags: ["AI/ML", "RAG", "TTS", "Flutter"],
    category: "personal"
  },
  {
    id: "employment-data",
    title: "고용노동 공공데이터 활용 공모전",
    period: "2024.06",
    year: 2024,
    periodType: "H",
    periodNumber: 1,
    isCompleted: true,
    description: "고용노동 공공데이터 분석 및 Plotly 시각화",
    tags: ["데이터 분석", "Plotly", "Python"],
    category: "personal"
  },
  {
    id: "prop",
    title: "PROP - 제안서 작성 AI Agent",
    period: "2024.03 ~ 2024.04",
    year: 2024,
    periodType: "Q",
    periodNumber: 1,
    isCompleted: true,
    description: "제안서 및 문서 생성 자동화 시스템",
    tags: ["AI/ML", "OpenAI API", "Flask"],
    category: "company"
  },
  {
    id: "men-in-black",
    title: "Men-in-Black - 교통 법규 위반 감지",
    period: "2023.10 ~ 2023.12",
    year: 2023,
    periodType: "H",
    periodNumber: 2,
    isCompleted: true,
    description: "블랙박스 영상 속 교통 법규 위반 차량 감지 시스템",
    tags: ["Computer Vision", "YOLOv8", "OCR", "PyTorch"],
    category: "personal"
  },
];

// Detailed project data for individual project pages
export const projectsDetail: { [key: string]: ProjectDetail } = {
  "sk-pharmaaix": {
    id: "sk-pharmaaix",
    title: "SK PharmaAIX MR Assistant",
    subtitle: "제약 영업 지원 AI 챗봇",
    period: "2025.07 ~ 현재 (진행 중)",
    duration: "약 6개월",
    role: "AI 파트 리드 / 랩큐 팀 PL",
    team: "랩큐 팀원 3명 + BCG RA 5~6명 리딩",
    description: "SK Chemical 제약 제품을 영업하는 MR 약 350명을 위한 AI 챗봇. 영업활동 기록, 제품 정보 검색, 고성과자 노하우 공유를 통한 성과 향상 지원. 제약 도메인 특화 RAG 기반 질의응답 시스템.",
    techStack: {
      backend: ["FastAPI", "Python"],
      database: ["MariaDB", "Qdrant (Vector DB)", "AWS Redshift", "Redis"],
      aiml: ["LangChain", "LangGraph", "Azure OpenAI API"],
      infrastructure: ["Azure", "Docker"],
      collaboration: ["Slack", "Jira", "Confluence"]
    },
    businessGoals: [
      {
        title: "생산성 향상 목표",
        description: "MR 인당 생산성 11% 향상 (BCG 예상치)"
      },
      {
        title: "4R 전략",
        items: [
          "Right Target: 적절한 타겟 고객 식별 및 추천",
          "Right Product: 고객 상황에 맞는 적절한 제품 추천",
          "Right Message: 효과적인 메시지 전달 전략 제공",
          "Right Timing: 최적의 타이밍 제안"
        ]
      }
    ],
    achievements: [
      {
        metric: "응답 속도",
        before: "평균 3분 이상",
        after: "평균 30초",
        improvement: "83% 개선"
      },
      {
        metric: "답변 커버리지",
        before: "30%",
        after: "100%",
        improvement: "233% 향상"
      },
      {
        metric: "답변 품질",
        before: "-",
        after: "99% 만족도",
        improvement: "AIX팀 정성 평가"
      }
    ],
    architectureEvolution: [
      {
        version: "V1",
        title: "완전 Chain 방식",
        problems: [
          "Orchestrator + Chain 방식으로 지나치게 지엽적",
          "설계된 specific한 질문만 답변 가능",
          "대부분의 실제 사용자 질의에 대답 불가",
          "응답 속도 3분 이상, 커버리지 30% 수준"
        ]
      },
      {
        version: "V2",
        title: "Multi-Agent Supervisor 전환",
        changes: [
          "Agentic Supervisor Multi-Agent 아키텍처로 전환",
          "Supervisor가 사용자 질문 분석 후 적절한 Agent 호출"
        ],
        problems: [
          "많은 개발자들이 설계 의도대로 구현하지 못함",
          "아키텍처 이해도 부족으로 인한 구현 오류"
        ]
      },
      {
        version: "V3",
        title: "완전 재설계",
        changes: [
          "Agent 구조, init, tool까지 직접 제작하여 배포",
          "개발자들이 그대로 사용할 수 있도록 완성된 형태로 제공",
          "Chain + Agentic 하이브리드 구조"
        ],
        results: [
          "응답 속도 83% 개선 (3분 → 30초)",
          "답변 커버리지 233% 향상 (30% → 100%)",
          "답변 품질 99% 만족도 달성"
        ]
      }
    ],
    keyResponsibilities: [
      {
        title: "AI 파트 리딩 및 멀티 팀 협업",
        details: [
          "BCG PM 다음으로 AI 파트 전체 리더 역할",
          "BCG RA 5~6명 (3개월 로테이션, 총 15명) 업무 분담 및 관리",
          "랩큐 팀원 3명 PL 역할 (요구사항 분석, 일정 관리, 코드 리뷰)",
          "추진팀, 인프라팀, 보안팀, QA팀, 백엔드, 프론트 등 다수 팀과 협업 및 조율"
        ]
      },
      {
        title: "서비스 아키텍처 재설계",
        details: [
          "LangGraph 기반 Multi-Agent Supervisor 구조로 전환",
          "Supervisor Agent: 사용자 질문 분석 및 적절한 하위 에이전트 호출",
          "다양한 Tool Agent 설계 및 구현 (MariaDB 조회, Qdrant 검색, Redshift 분석 등)",
          "Chain + Agentic 하이브리드 구조 구현"
        ]
      },
      {
        title: "Vector Database 교체",
        details: [
          "LanceDB → Qdrant 마이그레이션",
          "하이브리드 검색 (Dense + Sparse) 구현",
          "컬렉션 관리 및 임베딩 파이프라인 재구축",
          "검색 정확도 및 속도 향상"
        ]
      },
      {
        title: "성능 고도화",
        details: [
          "비동기 처리, 캐싱 전략 (Redis, Qdrant)",
          "병렬처리 및 Forward Tool 적용",
          "Agent 워크플로우 최적화",
          "실시간 스트리밍 응답 구현 (SSE)"
        ]
      }
    ],
    challenges: [
      {
        title: "대규모 인력 관리",
        description: "다수 인턴급 RA(15명) + 타 업체 개발자 코드 리뷰 및 관리. V3 아키텍처로 완성된 구조 제공, 명확한 가이드라인 제시로 극복"
      },
      {
        title: "대기업 보안 정책",
        description: "방화벽 신청 → 승인 → 작업 완료까지 5일 소요. 사전에 모든 담당자 파악, 직접 커뮤니케이션으로 극복"
      },
      {
        title: "대규모 협업의 어려움",
        description: "약 10개 팀과 빈번한 회의, 오래 걸리는 의사결정. 명확한 문서화 및 사전 조율, 변경 최소화 전략으로 극복"
      }
    ],
    learnings: [
      "아키텍처 설계의 중요성: 개발자들이 이해하고 따라할 수 있는 명확한 구조 제공",
      "고객 중심 개발: 약 10회 반복 개선 사이클로 99% 만족도 달성",
      "대기업 문화 이해: 변경 최소화 전략, 사전 조율 및 명확한 문서화",
      "성능 최적화 경험: 병목 지점 정확히 파악하고 단계적으로 개선",
      "멀티 팀 협업: 각 분야 최고 전문가들의 일하는 방식을 직접 관찰하고 배움",
      "기술 깊이의 중요성: LLM 고유명사 오표기 문제를 토크나이저 레벨까지 분석"
    ]
  },
  "katech-ai-agent": {
    id: "katech-ai-agent",
    title: "한국자동차연구원 AI 에이전트",
    subtitle: "자동차 분야 특화 통합 데이터 관리 및 AI Agent",
    period: "2024.03 ~ 2024.11",
    duration: "약 1년 8개월",
    role: "1~2차: 1인 풀스택 개발 (7개월) / 3~4차: 메인 PL / 팀 3명",
    team: "개발자 3명 (본인 포함)",
    description: "한국자동차연구원의 자동차 분야 특화 RAG 기반 보고서 자동 생성 시스템 및 챗봇. 사전 공개/공개/비공개 데이터 3단계 분류 관리, 마이디스크 연동, Keycloak SSO 인증.",
    techStack: {
      backend: ["FastAPI", "Python", "Celery", "Redis"],
      frontend: ["Next.js", "React", "TypeScript", "BlockNote Editor"],
      database: ["PostgreSQL (Kysely ORM)", "Qdrant (Vector DB)"],
      aiml: ["LangChain", "LangGraph", "OpenAI API (GPT-3.5/4/4o)", "Claude"],
      infrastructure: ["Docker", "Docker Compose", "Nginx", "Linux Server"],
      authentication: ["Keycloak (SSO)"],
      monitoring: ["LangSmith", "DataDog"],
      etc: ["Server-Sent Events (SSE)"]
    },
    keyFeatures: [
      {
        title: "서버 인프라 구축 및 배포",
        details: [
          "Docker Compose 기반 멀티 컨테이너 환경 구축",
          "HTTPS 적용 및 도메인 설정 (https://agent.bigdata-car.kr/)",
          "VPN 및 SSH 접속 환경 설정"
        ]
      },
      {
        title: "인증 및 권한 관리",
        details: [
          "Keycloak 기반 SSO(Single Sign-On) 로그인 시스템",
          "OAuth 2.0 토큰 관리",
          "세션 기반 사용자 인증 및 권한 검증"
        ]
      },
      {
        title: "RAG 기반 보고서 자동 생성",
        details: [
          "사전 공개/공개/비공개 데이터 3단계 분류",
          "마이디스크 연동 파일 업로드 및 관리",
          "PDF, DOCX, PPTX 파일 자동 파싱",
          "DALL-E 3 연동 이미지 자동 생성",
          "출처 표기 UI (PDF 페이지 번호 포함)"
        ]
      },
      {
        title: "LangGraph 멀티 에이전트 시스템",
        details: [
          "Research Agent: Multi-Query 생성 및 하이브리드 검색",
          "Report Agent: 검색 결과 기반 보고서 생성",
          "Supervisor Agent: 에이전트 조율 및 상태 관리",
          "PostgreSQL Checkpointer로 에이전트 상태 영속화"
        ]
      },
      {
        title: "멀티 파일 파서 통합",
        details: [
          "4개 파서 통합: Upstage, LlamaParse, Docling, Unstructured",
          "파서별 성능 비교 및 최적화",
          "파싱 결과 시각화 (PDF + Markdown Interactive Highlight)",
          "사용자별 기본 파서 선택 기능"
        ]
      }
    ],
    achievements: [
      {
        metric: "보고서 작성 시간",
        before: "1시간",
        after: "1분",
        improvement: "98% 단축"
      },
      "1인 풀스택으로 7개월간 전체 시스템 설계 및 구현",
      "Keycloak SSO 기반 보안 인증 시스템 구축",
      "3단계 데이터 분류 및 권한 관리 시스템",
      "Flask → FastAPI 마이그레이션 성공",
      "LangGraph 멀티 에이전트 아키텍처 구축",
      "200+ 테스트 케이스 작성으로 시스템 안정성 확보"
    ],
    challenges: [
      {
        title: "1인 풀스택 개발",
        description: "백엔드, 프론트엔드, 인프라, AI 모델 연동까지 전체 스택 담당. 체계적인 아키텍처 설계와 단계적 구현으로 극복"
      },
      {
        title: "대규모 재설계",
        description: "3차에서 Flask를 FastAPI로 전환. API 문서 선행 작성 및 모듈별 단계적 이전으로 안전하게 완료"
      },
      {
        title: "프로젝트 동시 진행",
        description: "SK Chemical과 동시 진행으로 매일 새벽 2시까지 근무. 시간대별 우선순위 분리로 효율적 관리"
      }
    ],
    learnings: [
      "풀스택 개발 역량: 백엔드/프론트엔드/인프라 전체 스택 경험",
      "SSO 인증 시스템: Keycloak 기반 OAuth 2.0 구현 노하우",
      "데이터 권한 관리: 3단계 분류 및 세밀한 권한 제어",
      "프로젝트 관리: 1인 개발에서 팀 PL로 역할 전환 경험",
      "단계별 개선의 힘: MVP부터 시작하여 지속적으로 개선"
    ]
  },
  "greentech": {
    id: "greentech",
    title: "그린텍 하수처리 수질 예측 AI",
    subtitle: "하수처리공정 수질 예측 및 이상탐지",
    period: "2024.07 ~ 2024.11",
    duration: "약 4개월",
    role: "PL (팀 2명: 본인 포함)",
    team: "개발자 2명",
    description: "하수처리장의 공정 단계별 수질 예측 모델 개발 및 실시간 이상 탐지 시스템. 19개 타겟 변수에 대한 예측 모델 구축으로 품질 Hunting 최소화 및 안정 운전 지원.",
    techStack: {
      ml: ["PyTorch", "LightGBM", "XGBoost", "CatBoost"],
      anomaly: ["PyOD", "COMBO"],
      dataprocessing: ["NumPy", "Pandas", "Numba"],
      visualization: ["Matplotlib", "Seaborn", "Plotly Dash"],
      backend: ["Flask", "Gunicorn"],
      timeseries: ["statsmodels"],
      deployment: ["Docker"]
    },
    keyFeatures: [
      {
        title: "수질 예측 모델 개발",
        details: [
          "LightGBM, XGBoost, CatBoost 앙상블 모델",
          "PyTorch 기반 LSTM, GRU 딥러닝 모델",
          "ARIMA, SARIMA 시계열 모델",
          "Optuna 하이퍼파라미터 튜닝"
        ]
      },
      {
        title: "이상 탐지 시스템",
        details: [
          "PyOD 기반 10+ 알고리즘 실험 (Isolation Forest, LOF, CBLOF)",
          "COMBO 앙상블 이상 탐지",
          "이상치 스코어 계산 및 임계값 설정",
          "실시간 모니터링 및 알림"
        ]
      },
      {
        title: "시각화 대시보드",
        details: [
          "Plotly Dash 기반 실시간 모니터링",
          "공정 단계별 수질 예측값 및 실측값 시각화",
          "이상 탐지 알림 표시",
          "자동 분석 리포트 생성"
        ]
      }
    ],
    achievements: [
      {
        metric: "T-N 방류수 예측",
        before: "-",
        after: "R² 0.9244",
        improvement: "RandomForest"
      },
      {
        metric: "TOC 방류수 예측",
        before: "-",
        after: "R² 0.8640",
        improvement: "CatBoost"
      },
      {
        metric: "이상 탐지 정확도",
        before: "-",
        after: "98.50%",
        improvement: "Random Forest"
      },
      "19개 타겟 변수 예측 모델 개발 완료",
      "실시간 이상 탐지 시스템 구축",
      "품질 Hunting 최소화로 안정 운전 가능"
    ],
    challenges: [
      {
        title: "시계열 데이터 처리",
        description: "결측치, 이상치가 많은 공정 데이터. 도메인 지식 기반 전처리 및 피처 엔지니어링으로 해결"
      },
      {
        title: "모델 선택",
        description: "다양한 ML/DL 모델 실험 필요. 체계적인 실험 관리 및 성능 비교로 최적 모델 도출"
      }
    ],
    learnings: [
      "앙상블 모델의 강력함: 단일 모델 대비 성능 향상",
      "도메인 지식의 중요성: 하수처리 공정 이해가 피처 엔지니어링에 핵심",
      "실시간 시스템 구축: 배치 예측과 실시간 모니터링의 차이",
      "클라이언트 커뮤니케이션: 기술 용어를 비즈니스 가치로 전달"
    ]
  },
  "prop": {
    id: "prop",
    title: "PROP - 제안서 작성 AI Agent",
    subtitle: "제안서 및 문서 생성 자동화 시스템",
    period: "2024.03 ~ 2024.04",
    duration: "약 2개월",
    role: "유지보수 및 추가 개발",
    team: "랩큐 자체 프로젝트",
    description: "AI 기반 사업 제안서, 기술 제안서 자동 생성 시스템. 템플릿 기반 문서 구조 생성 및 사용자 정의 프롬프트 지원. Celery 기반 비동기 작업 처리로 사용자 경험 개선.",
    techStack: {
      backend: ["Flask", "Celery", "Redis", "MySQL"],
      frontend: ["HTML", "JavaScript (Vanilla JS)"],
      ai: ["OpenAI API (GPT-3.5-turbo, GPT-4, GPT-4o)"]
    },
    keyFeatures: [
      {
        title: "제안서 생성 엔진",
        details: [
          "템플릿 기반 문서 구조 자동 생성",
          "프롬프트 엔지니어링을 통한 품질 향상",
          "섹션별 생성 로직 개선",
          "GPT-4/GPT-4o 업그레이드"
        ]
      },
      {
        title: "비동기 작업 처리",
        details: [
          "Celery 기반 문서 생성 비동기 처리",
          "Redis 작업 큐 관리",
          "생성 진행 상황 실시간 업데이트"
        ]
      },
      {
        title: "사용자 관리",
        details: [
          "MySQL 기반 사용자 정보 관리",
          "사용자별 생성 이력 저장",
          "사용 통계 수집 (생성 횟수, 토큰 사용량)"
        ]
      }
    ],
    achievements: [
      "OpenAI API 업데이트로 제안서 품질 향상",
      "Celery 비동기 처리로 사용자 경험 개선",
      "사용자 가입 및 사용 현황 모니터링 시스템 구축"
    ],
    learnings: [
      "기존 시스템 유지보수 경험: 레거시 코드 이해 및 개선",
      "비동기 작업 처리: Celery + Redis 활용 노하우",
      "프롬프트 엔지니어링: 생성 품질 향상을 위한 프롬프트 최적화"
    ]
  },
  "langchain-tutorial": {
    id: "langchain-tutorial",
    title: "LangChain Open Tutorial 오픈소스 기여",
    subtitle: "RAG 및 LangGraph 튜토리얼 작성",
    period: "2025.01 ~ 2025.02",
    duration: "약 7주",
    role: "오픈소스 컨트리뷰터",
    team: "TeddyNote 커뮤니티",
    description: "2,000+ 커밋이 발생한 대규모 오픈소스 프로젝트에 기여. RAG(Retrieval-Augmented Generation) 관련 LangChain 튜토리얼 작성 및 번역. 한국어 개발자들이 RAG와 LangGraph를 쉽게 배울 수 있도록 지원.",
    techStack: {
      aiml: ["LangChain", "LangGraph", "RAG"],
      llm: ["OpenAI GPT-4o", "Claude"],
      tools: ["LlamaParse", "DuckDuckGo API"],
      development: ["Jupyter Notebook", "Python", "Google Colab"],
      collaboration: ["GitHub", "GitBook"]
    },
    keyFeatures: [
      {
        title: "LlamaParse 튜토리얼",
        details: [
          "PDF, Word, PowerPoint, Excel 등 다양한 파일 파싱",
          "Multimodal 모델(GPT-4o) 기반 문서 분석",
          "자연어 명령을 통한 커스텀 파싱 설정",
          "OCR 기반 이미지 텍스트 추출"
        ]
      },
      {
        title: "Conversation Memory Management",
        details: [
          "LangGraph 기반 챗봇 메모리 관리 시스템",
          "Configuration Class 활용 사용자별 컨텍스트 관리",
          "단기 및 장기 메모리 구현",
          "StateGraph 활용 대화 플로우 자동화"
        ]
      },
      {
        title: "CoT-Based Smart Web Search",
        details: [
          "Chain-of-Thought (CoT) 기반 스마트 웹 검색",
          "Plan-and-Execute QA 시스템 개발",
          "Multi-Query 생성 (1개 → 3~5개 검색 쿼리)",
          "검색 → 추출 → 추론 → 응답 파이프라인"
        ]
      }
    ],
    achievements: [
      "3개의 튜토리얼 작성 및 GitHub/GitBook 게시",
      "대규모 오픈소스 프로젝트(2,000+ 커밋) 기여 경험",
      "Peer Review 세션을 통한 협업 및 기술 인사이트 확장",
      "한국어 개발자 커뮤니티에 RAG/LangGraph 지식 공유"
    ],
    challenges: [
      {
        title: "번역의 어려움",
        description: "단순 번역이 아닌 한국 개발자들이 이해하기 쉬운 설명 필요. 전문 용어, 의역, 예시 추가를 신중히 판단"
      },
      {
        title: "초보자 눈높이",
        description: "Peer Review 피드백을 통해 초보자가 이해하기 어려운 부분 파악 및 개선"
      }
    ],
    learnings: [
      "기술 지식의 민주화: 오픈소스 기여로 개발자 생태계 성장 지원",
      "설명의 명확성: '왜'와 '어떻게'를 함께 전달하는 법",
      "협업의 가치: Peer Review로 더 나은 콘텐츠 완성",
      "기술 블로그 운영: 지식 공유의 선순환"
    ]
  },
  "apphub": {
    id: "apphub",
    title: "AppHub - Living Portfolio 플랫폼",
    subtitle: "개인 프로젝트 통합 관리 플랫폼",
    period: "2025.11 ~ 진행 중",
    duration: "약 2개월",
    role: "1인 풀스택 개발",
    team: "개인 프로젝트",
    description: "2025년 11월부터 개발한 Living Portfolio 플랫폼. 기존 정적 포트폴리오를 넘어 실제 동작하는 프로젝트들을 통합 관리. 인증, 데이터베이스, AI 백엔드 등 반복 기능을 하나의 플랫폼으로 통합.",
    techStack: {
      frontend: ["React 19", "Next.js 15", "TypeScript", "Tailwind CSS 4", "Radix UI", "Framer Motion"],
      backend: ["FastAPI", "Python 3.13", "LangGraph"],
      database: ["Supabase (PostgreSQL)", "LangGraph Checkpoint Postgres"],
      authentication: ["Supabase Auth", "Google OAuth 2.0", "GitHub OAuth 2.0"],
      aiml: ["LangChain", "LangGraph", "OpenAI API", "Anthropic Claude"],
      statemanagement: ["React 19 (use hook)", "Context API"],
      deployment: ["Vercel (웹)", "Google Cloud (AI 백엔드)"],
      devtools: ["ESLint", "TypeScript", "Ruff", "UV Package Manager"]
    },
    keyFeatures: [
      {
        title: "통합 인증 시스템",
        details: [
          "Supabase Auth 기반 사용자 인증",
          "Google OAuth 2.0 소셜 로그인",
          "세션 관리 및 보안 토큰 처리",
          "향후 모든 개인 프로젝트에서 공통 사용 예정"
        ]
      },
      {
        title: "LangGraph AI 백엔드",
        details: [
          "FastAPI 기반 RESTful API 서버",
          "LangGraph 멀티 에이전트 시스템",
          "LangChain을 활용한 AI 워크플로우",
          "LangGraph Checkpoint로 대화 상태 영속화",
          "Google Cloud에 배포된 AI 백엔드"
        ]
      },
      {
        title: "Supabase 데이터베이스",
        details: [
          "PostgreSQL 기반 관계형 데이터베이스",
          "실시간 구독 기능 활용 가능",
          "Row Level Security (RLS) 보안 정책",
          "Supabase Storage로 파일 관리 (향후 확장)"
        ]
      },
      {
        title: "모던 프론트엔드",
        details: [
          "React 19 최신 기능 활용 (use hook 등)",
          "Next.js 15 App Router 아키텍처",
          "Tailwind CSS 4 스타일링",
          "Radix UI 접근성 높은 컴포넌트",
          "Framer Motion 애니메이션",
          "Vercel에 배포된 웹 애플리케이션"
        ]
      }
    ],
    achievements: [
      "최신 기술 스택 활용 (React 19, Next.js 15, Tailwind CSS 4)",
      "Supabase를 활용한 완전한 백엔드 인프라 구축",
      "Google Cloud에 LangGraph AI 백엔드 성공적으로 배포",
      "Vercel을 통한 웹 애플리케이션 자동 배포 및 운영",
      "개인 프로젝트들을 위한 재사용 가능한 공통 인프라 구축",
      "Living Portfolio 콘셉트로 차별화된 기술 역량 증명"
    ],
    challenges: [
      {
        title: "최신 기술 스택 학습",
        description: "React 19, Next.js 15, Tailwind CSS 4 등 최신 버전 학습. 공식 문서와 실험을 통해 빠르게 습득"
      },
      {
        title: "LangGraph 백엔드 배포",
        description: "Google Cloud에 FastAPI + LangGraph 백엔드 배포. Docker 컨테이너화 및 환경 변수 관리로 해결"
      },
      {
        title: "Supabase 통합",
        description: "Supabase Auth, Database, Storage 통합. 공식 SDK와 문서를 통해 체계적으로 구현"
      }
    ],
    learnings: [
      "최신 프론트엔드 생태계: React 19, Next.js 15의 새로운 기능들",
      "풀스택 개발 경험: 프론트엔드부터 AI 백엔드까지 전체 스택 구현",
      "클라우드 배포: Vercel과 Google Cloud 활용한 프로덕션 배포",
      "Supabase BaaS: 백엔드 인프라를 빠르게 구축하는 방법",
      "LangGraph 아키텍처: 멀티 에이전트 시스템 구축 및 상태 관리",
      "설계 원칙: 재사용 가능한 공통 인프라 구축의 중요성",
      "개발 생산성: 최신 도구와 프레임워크를 활용한 빠른 개발"
    ]
  },
  "men-in-black": {
    id: "men-in-black",
    title: "Men-in-Black - 교통 법규 위반 감지",
    subtitle: "블랙박스 영상 속 교통 법규 위반 차량 감지",
    period: "2023.10 ~ 2023.12",
    duration: "약 3개월",
    role: "팀 프로젝트 (4명) - License Plate Recognition 및 Depth Estimation 담당",
    team: "새싹 AI 부트캠프",
    description: "블랙박스 영상에서 교통 법규 위반 차량을 자동으로 감지하고 신고하는 AI 시스템. 차량 감지, 번호판 인식, 거리 추정 등 종합적인 Computer Vision 기술 적용.",
    techStack: {
      computervision: ["YOLOv8 (n, m)", "SORT", "EasyOCR"],
      depthestimation: ["ZoeDepth", "MiDaS v3"],
      mldl: ["PyTorch", "TensorFlow", "OpenCV"],
      backend: ["FastAPI"],
      environment: ["NVIDIA GPU", "AWS", "Ubuntu", "Anaconda"]
    },
    keyFeatures: [
      {
        title: "차량 및 번호판 감지",
        details: [
          "YOLOv8n, YOLOv8m 기반 차량 감지 (COCO Dataset)",
          "SORT 알고리즘으로 실시간 2D 다중 객체 추적",
          "YOLOv8m 기반 번호판 감지 (Roboflow Dataset 24,242 images)",
          "Data Augmentation: Flip, Crop, Rotation, Shear, Grayscale 등"
        ]
      },
      {
        title: "OCR (번호판 텍스트 인식)",
        details: [
          "EasyOCR 활용 번호판 텍스트 인식",
          "Preprocessing: Grayscale, CLAHE, Gaussian Blur, Canny Edge",
          "Perspective Transformation으로 번호판 영역 추출"
        ]
      },
      {
        title: "Monocular Depth Estimation",
        details: [
          "ZoeDepth 모델로 단일 카메라 영상에서 거리 추정",
          "실시간 거리 추정 및 안전거리 위반 탐지"
        ]
      }
    ],
    achievements: [
      "YOLOv8 기반 차량 및 번호판 실시간 감지 구현",
      "EasyOCR을 활용한 번호판 텍스트 인식",
      "ZoeDepth 기반 차량 간 거리 추정",
      "종합적인 Computer Vision 프로젝트 경험"
    ],
    challenges: [
      {
        title: "낮은 화질",
        description: "블랙박스 영상의 낮은 화질로 인한 OCR 정확도 저하. Preprocessing 최적화로 개선"
      },
      {
        title: "상대 속도",
        description: "상대 속도가 빠를수록 인식률 감소. 향후 Segmentation 시도 필요"
      }
    ],
    learnings: [
      "Object Detection: YOLO 시리즈 실전 활용",
      "Object Tracking: SORT 알고리즘 이해 및 적용",
      "OCR: EasyOCR과 Preprocessing 최적화",
      "Depth Estimation: Monocular 방식의 한계와 가능성",
      "팀 협업: 모듈별 역할 분담 및 통합"
    ]
  },
  "podly": {
    id: "podly",
    title: "Podly - AI 기반 맞춤형 음성 뉴스 서비스",
    subtitle: "AI 음성 뉴스 및 관심사 정보 제공",
    period: "2024.08 ~ 2024.09",
    duration: "약 2개월",
    role: "팀장 / AI 및 백엔드 개발 (팀 4명)",
    team: "창업 경진대회",
    description: "이동 중 터치 없이 음성만으로 맞춤형 뉴스를 청취할 수 있는 AI 서비스. 음성 인식, 자연어 처리, TTS, RAG 기술을 종합한 종합 AI 플랫폼. 고령층 및 시각장애인의 디지털 정보 접근성 향상.",
    techStack: {
      backend: ["FastAPI", "Python"],
      frontend: ["Flutter", "React"],
      aiml: ["LangChain", "RAG", "OpenAI API", "Upstage Solar", "Google Gemma2", "Microsoft Phi 3.5", "Meta Llama 3.1"],
      speech: ["OpenAI Whisper", "ElevenLabs TTS", "TypeCast TTS"],
      data: ["Pandas", "NumPy", "Tableau", "Power BI"],
      cloud: ["GCP"]
    },
    keyFeatures: [
      {
        title: "음성 인식 및 자연어 처리",
        details: [
          "OpenAI Whisper 음성→텍스트 변환",
          "다양한 LLM 모델 테스트 (GPT, Solar, Gemma2, Phi, Llama)",
          "실시간 질의응답 및 콘텐츠 생성",
          "개인화 추천 시스템"
        ]
      },
      {
        title: "RAG 기반 뉴스 큐레이션",
        details: [
          "외부 문서에서 관련 정보 검색",
          "실시간 주요 뉴스 요약",
          "맞춤형 뉴스 큐레이션 (사용자 관심사 기반)",
          "심층 질의응답 (Q&A): 뉴스 원문 기반 답변"
        ]
      },
      {
        title: "TTS 및 목소리 변환",
        details: [
          "ElevenLabs, TypeCast 고급 TTS",
          "자연스럽고 감정이 담긴 음성 생성",
          "다양한 목소리 옵션 (성우, 유명인)"
        ]
      },
      {
        title: "공공데이터 활용",
        details: [
          "정부 및 공공기관 데이터 수집",
          "Pandas, NumPy 데이터 분석",
          "Tableau, Power BI 시각화",
          "위치 기반 날씨, 개인 일정 반영"
        ]
      }
    ],
    achievements: [
      "음성 명령 기반 뉴스 서비스로 터치 없는 정보 소비 경험 제공",
      "RAG 기법으로 최신 정보와 개인화 추천 결합",
      "다양한 LLM 모델 테스트 및 최적 모델 선택 경험",
      "공공데이터 활용 신뢰성 높은 콘텐츠 제작"
    ],
    challenges: [
      {
        title: "LLM 모델 선택",
        description: "다양한 LLM 모델(GPT, Solar, Gemma2, Phi, Llama) 비교 실험. 비용, 속도, 품질 균형 찾기"
      },
      {
        title: "TTS 품질",
        description: "자연스러운 음성 생성. ElevenLabs와 TypeCast 조합으로 해결"
      }
    ],
    learnings: [
      "음성 인터페이스 설계: 터치 없는 경험의 UX",
      "다양한 LLM 모델 비교 및 선택 기준",
      "TTS 기술: 자연스러운 음성 생성의 어려움",
      "사회적 가치: 디지털 격차 해소 및 접근성 향상",
      "시장성 분석: 음성 인식 및 LLM 시장 전망"
    ]
  },
  "employment-data": {
    id: "employment-data",
    title: "고용노동 공공데이터 활용 공모전",
    subtitle: "데이터 분석 및 인터랙티브 시각화",
    period: "2024.06",
    duration: "약 1개월",
    role: "팀장 (팀 프로젝트)",
    team: "고용노동부 공모전",
    description: "고용노동부 공공데이터를 활용한 데이터 분석 및 시각화 서비스. 데이터 전처리 및 Plotly 기반 인터랙티브 시각화로 고용 트렌드 및 패턴 발견.",
    techStack: {
      dataprocessing: ["Python", "Pandas", "NumPy"],
      visualization: ["Plotly", "Matplotlib", "Seaborn"],
      development: ["Jupyter Notebook"]
    },
    keyFeatures: [
      {
        title: "데이터 수집 및 전처리",
        details: [
          "고용노동부 공공데이터포털 데이터 수집",
          "Pandas 데이터 전처리 (결측치, 이상치, 정규화)",
          "데이터 병합 및 집계 (merge, groupby, pivot_table)",
          "NumPy 수치 연산 및 배열 처리"
        ]
      },
      {
        title: "탐색적 데이터 분석 (EDA)",
        details: [
          "기술 통계량 분석 (평균, 중앙값, 표준편차)",
          "데이터 분포 및 상관관계 분석",
          "시계열 데이터 트렌드 분석",
          "지역별/산업별 고용 현황 비교"
        ]
      },
      {
        title: "Plotly 인터랙티브 시각화",
        details: [
          "드롭다운, 슬라이더 필터 기능",
          "Line Chart: 시계열 고용 트렌드",
          "Bar Chart: 지역별/산업별 비교",
          "Scatter Plot: 상관관계 분석",
          "Heatmap: 데이터 분포 및 밀도",
          "Choropleth Map: 지역별 고용 현황 지도"
        ]
      }
    ],
    achievements: [
      "고용노동 공공데이터 전처리 및 정제 경험",
      "Plotly 인터랙티브 대시보드 구축",
      "데이터 인사이트 및 결론 도출",
      "공공데이터 활용 서비스 기획 경험"
    ],
    learnings: [
      "공공데이터 활용: 데이터 수집 및 정제 노하우",
      "Plotly 마스터: 인터랙티브 시각화의 강력함",
      "데이터 스토리텔링: 시각화로 인사이트 전달",
      "팀 협업: 데이터 분석 프로젝트의 역할 분담"
    ]
  },
  "podlybot": {
    id: "podlybot",
    title: "PodlyBot - 카카오톡 LLM 챗봇",
    subtitle: "개인 비서 & 회사 업무용 LLM 챗봇",
    period: "2024.09",
    duration: "약 1개월",
    role: "1인 개발 (기획, 개발, 운영)",
    team: "개인 프로젝트 + 회사 내부 프로젝트",
    description: "안드로이드 폰에 구현한 카카오톡 기반 LLM 챗봇. 개인용(PodlyBot)과 회사용(LabQ Bot) 두 가지 버전으로 배포. 단체 채팅방에서 즉시 호출 가능한 LLM 서비스. URL 요약 및 Notion 자동 정리 기능으로 정보 수집 워크플로우 자동화. 회사용은 자체 LLM 서비스 연동 및 고객사 테스트 환경 제공.",
    techStack: {
      platform: ["메신저봇R (Android)"],
      language: ["JavaScript (Rhino JavaScript Engine)"],
      ai: ["LLM API (OpenAI GPT 등)", "회사 자체 LLM 서비스"],
      integration: ["Notion API (개인/회사 워크스페이스)", "Web Scraping"],
      deployment: ["안드로이드 공기계"]
    },
    keyFeatures: [
      {
        title: "공통 기능: LLM 대화 기능",
        details: [
          "카카오톡 단체 채팅방에서 바로 호출 가능",
          "별도 설명 없이 즉시 사용 가능한 직관적 인터페이스",
          "메신저봇R 기반 알림 감지 및 자동 응답",
          "채팅방별 컨텍스트 관리"
        ]
      },
      {
        title: "공통 기능: URL 요약 및 Notion 정리",
        details: [
          "채팅방에 공유된 URL 자동 감지",
          "웹 페이지 내용 크롤링 및 요약 생성",
          "요약 내용을 Notion 페이지에 자동 저장",
          "메타데이터(URL, 날짜, 카테고리) 자동 기록"
        ]
      },
      {
        title: "개인용 (PodlyBot): 워크플로우 최적화",
        details: [
          "유용한 URL 발견 시 카톡으로 전송",
          "자동으로 요약 및 개인 Notion에 정리",
          "Notion에서 체계적으로 정리된 내용 검토",
          "24/7 상시 운영 (안드로이드 공기계)"
        ]
      },
      {
        title: "회사용 (LabQ Bot): LLM 서비스 연동 및 테스트",
        details: [
          "(주)랩큐에서 개발한 AI 서비스들과 연동",
          "고객사가 카톡으로 간편하게 테스트 가능",
          "데모 및 프로토타입 공유 용도",
          "팀원들이 공유하는 기술 자료, 뉴스 회사 Notion에 정리"
        ]
      }
    ],
    achievements: [
      "개인용과 회사용 두 가지 버전으로 배포하여 다양한 사용 케이스 대응",
      "개인용: 일상적인 정보 수집 및 정리 워크플로우 자동화, 지인들도 사용 요청",
      "회사용: 고객사가 별도 환경 설정 없이 LLM 서비스 테스트 가능",
      "URL 공유 시 즉시 요약 및 Notion 정리로 생산성 향상",
      "단체 채팅방에서 LLM 서비스 간편하게 활용"
    ],
    challenges: [
      {
        title: "Rhino JavaScript 한계",
        description: "최신 문법 사용 불가. async/await 대신 콜백 패턴으로 구현"
      },
      {
        title: "알림 기반 처리",
        description: "카톡 알림 기반 이벤트 처리. 채팅방별 컨텍스트 관리 필요"
      }
    ],
    learnings: [
      "작은 불편함 해결이 큰 가치: 개인 문제 해결이 주변 사람들 생산성 향상으로",
      "레거시 환경 극복: Rhino JavaScript 제약 속에서 구현",
      "24/7 운영 경험: 안드로이드 공기계 활용 노하우",
      "실용주의: 수익보다 실제 문제 해결에 집중",
      "확장 가능한 설계: 같은 기술 베이스로 개인용과 회사용 두 버전 배포",
      "회사 내부 시스템 연동: 자체 LLM 서비스와 Notion 워크스페이스 통합",
      "고객사 지원: 간편한 테스트 환경 제공의 가치"
    ]
  },
  "naver-hackathon": {
    id: "naver-hackathon",
    title: "네이버 부스트캠프 기업 해커톤",
    subtitle: "기업 평가 챗봇 개발 해커톤",
    period: "2025.01 ~ 2025.02",
    duration: "약 1개월",
    role: "기획, 운영, 평가",
    team: "네이버 부스트캠프",
    description: "네이버 부스트캠프 주최 기업 해커톤에서 기업 평가 챗봇 개발 과제를 기획하고 운영. 참가 팀 멘토링 및 기술 지원, 최종 평가 진행.",
    techStack: {
      aiml: ["LangChain", "RAG", "챗봇"],
      collaboration: ["GitHub", "Notion", "Slack"]
    },
    keyFeatures: [
      {
        title: "해커톤 과제 기획",
        details: [
          "기업 평가 챗봇 과제 설계",
          "평가 기준 수립 (기술성, 창의성, 완성도)",
          "참가 팀 가이드라인 작성"
        ]
      },
      {
        title: "멘토링 및 기술 지원",
        details: [
          "참가 팀 멘토링",
          "기술적 질문 답변",
          "중간 피드백 제공"
        ]
      },
      {
        title: "해커톤 운영 및 평가",
        details: [
          "해커톤 일정 관리",
          "최종 결과 평가",
          "우수 팀 시상"
        ]
      }
    ],
    achievements: [
      "해커톤 과제 기획 및 평가 기준 수립 경험",
      "참가 팀 멘토링으로 기술 지식 공유",
      "해커톤 운영 및 결과 평가 참여"
    ],
    learnings: [
      "해커톤 기획 및 운영 노하우",
      "멘토링 스킬: 기술 지식 효과적 전달",
      "평가 기준 설계: 공정하고 명확한 평가",
      "커뮤니티 기여: 후배 개발자 성장 지원"
    ]
  }
};
