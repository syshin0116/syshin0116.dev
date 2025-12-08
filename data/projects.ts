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
  {
    id: "sk-pharmaaix",
    title: "SK PharmaAIX MR Assistant",
    period: "2024.07 ~ 현재",
    year: 2024,
    periodType: "H",
    periodNumber: 2,
    isCompleted: false,
    description: "제약 영업 지원 AI 챗봇 - RAG 기반 질의응답 시스템",
    tags: ["AI/ML", "LangGraph", "FastAPI", "Azure"]
  },
  {
    id: "katech-ai-agent",
    title: "한국자동차연구원 AI 에이전트",
    period: "2024.03 ~ 2024.11",
    year: 2024,
    periodType: "H",
    periodNumber: 1,
    isCompleted: true,
    description: "자동차 분야 특화 RAG 기반 보고서 자동 생성 시스템",
    tags: ["Full Stack", "RAG", "Next.js", "FastAPI"]
  },
  {
    id: "blog-rag-chatbot",
    title: "Blog RAG 챗봇",
    period: "2023.09 ~ 2023.12",
    year: 2023,
    periodType: "H",
    periodNumber: 2,
    isCompleted: true,
    description: "개인 블로그 글 기반 질의응답 챗봇 시스템",
    tags: ["RAG", "LangChain", "Python", "Vector DB"]
  },
];

// Detailed project data for individual project pages
export const projectsDetail: { [key: string]: ProjectDetail } = {
  "sk-pharmaaix": {
    id: "sk-pharmaaix",
    title: "SK PharmaAIX MR Assistant",
    subtitle: "제약 영업 지원 AI 챗봇",
    period: "2024.07 ~ 현재 (진행 중)",
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
    role: "1~2차: 1인 풀스택 개발 (7개월) / 3~4차: 메인 PL / 팀 3명 (1년 6개월)",
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
        title: "챗봇 시스템",
        details: [
          "각 자료조사별 독립적인 챗봇 세션 관리",
          "Chat history 저장 및 컨텍스트 유지",
          "RAG 기반 질의응답 (Qdrant Vector DB)",
          "참조 자료 출처 표기"
        ]
      },
      {
        title: "Private Model 연동",
        details: [
          "내부 Private LLM 모델 연동",
          "모빌리티 인사이트 챗봇에 Private Model 적용",
          "모델 선택 드롭다운 UI"
        ]
      }
    ],
    achievements: [
      "1인 풀스택으로 7개월간 전체 시스템 설계 및 구현",
      "Keycloak SSO 기반 보안 인증 시스템 구축",
      "3단계 데이터 분류 및 권한 관리 시스템",
      "벡터 DB 별 독립적인 챗봇 생성 (모빌리티 인사이트, 한국자동차공학회 논문, 기업 소개)",
      "토큰 사용량 추적 및 비용 계산 시스템",
      "관리자 페이지 및 유저 등록 자료 관리 기능"
    ],
    challenges: [
      {
        title: "1인 풀스택 개발",
        description: "백엔드, 프론트엔드, 인프라, AI 모델 연동까지 전체 스택 담당. 체계적인 아키텍처 설계와 단계적 구현으로 극복"
      },
      {
        title: "보안 및 인증",
        description: "연구원 내부 시스템과의 SSO 연동 및 데이터 권한 관리. Keycloak 기반 OAuth 2.0 구현으로 해결"
      }
    ],
    learnings: [
      "풀스택 개발 역량: 백엔드/프론트엔드/인프라 전체 스택 경험",
      "SSO 인증 시스템: Keycloak 기반 OAuth 2.0 구현 노하우",
      "데이터 권한 관리: 3단계 분류 및 세밀한 권한 제어",
      "프로젝트 관리: 1인 개발에서 팀 PL로 역할 전환 경험"
    ]
  },
  "blog-rag-chatbot": {
    id: "blog-rag-chatbot",
    title: "Blog RAG 챗봇",
    subtitle: "개인 블로그 글 기반 질의응답 챗봇",
    period: "2023.09 ~ 2023.12",
    duration: "약 4개월",
    role: "1인 개발",
    team: "개인 프로젝트",
    description: "개인 블로그에 작성한 기술 글들을 벡터 DB에 저장하고, RAG 기반으로 질의응답이 가능한 챗봇 시스템. 블로그 콘텐츠를 효과적으로 검색하고 활용할 수 있는 AI 어시스턴트.",
    techStack: {
      backend: ["Python", "FastAPI"],
      aiml: ["LangChain", "OpenAI API"],
      database: ["ChromaDB (Vector DB)"],
      frontend: ["Streamlit"],
      etc: ["Beautiful Soup", "Markdown Parser"]
    },
    keyFeatures: [
      {
        title: "블로그 크롤링 및 파싱",
        details: [
          "Markdown 형식의 블로그 글 자동 수집",
          "메타데이터 추출 (제목, 날짜, 카테고리)",
          "코드 블록 및 이미지 처리"
        ]
      },
      {
        title: "벡터 DB 구축",
        details: [
          "ChromaDB를 활용한 문서 임베딩 저장",
          "청크 단위 분할 및 최적화",
          "유사도 기반 검색 구현"
        ]
      },
      {
        title: "RAG 기반 챗봇",
        details: [
          "사용자 질문에 대한 관련 블로그 글 검색",
          "컨텍스트 기반 답변 생성",
          "출처 블로그 글 링크 제공"
        ]
      }
    ],
    achievements: [
      "블로그 콘텐츠 100% 벡터화 완료",
      "평균 응답 시간 2초 이내",
      "관련 글 검색 정확도 90% 이상",
      "Streamlit 기반 심플한 UI 구현"
    ],
    challenges: [
      {
        title: "청크 크기 최적화",
        description: "코드 블록이 포함된 기술 글의 특성상 적절한 청크 크기를 찾는 것이 중요. 여러 실험을 통해 최적 크기 도출"
      },
      {
        title: "코드 블록 처리",
        description: "마크다운 코드 블록을 임베딩할 때 정보 손실 최소화. 코드와 설명을 함께 저장하는 방식으로 해결"
      }
    ],
    learnings: [
      "RAG 시스템 구축의 기초: 임베딩, 벡터 DB, 검색 메커니즘",
      "LangChain 프레임워크 활용 경험",
      "청크 전략 및 임베딩 최적화 노하우",
      "개인 프로젝트를 통한 빠른 프로토타이핑 능력"
    ]
  }
};
