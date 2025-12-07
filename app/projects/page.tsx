import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Users, TrendingUp, Code, Layers } from "lucide-react";

export const metadata = {
  title: "Projects | Syshin's Portfolio",
  description: "Explore Syshin's major AI and Machine Learning projects including SK PharmaAIX MR Assistant and KATECH AI Agent.",
};

const projects = [
  {
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
  {
    id: "katech-ai-agent",
    title: "한국자동차연구원 AI 에이전트",
    subtitle: "자동차 분야 특화 통합 데이터 관리 및 AI Agent",
    period: "2024.03 ~ 2025.11",
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
  }
];

export default function ProjectsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Projects
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                AI/ML 프로젝트 리딩 및 풀스택 개발 경험
              </p>
            </div>

            {/* Projects List */}
            <div className="space-y-12">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-8">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-3xl mb-2">{project.title}</CardTitle>
                          <CardDescription className="text-lg">{project.subtitle}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-sm px-4 py-2">
                          {project.duration}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{project.period}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{project.role}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{project.team}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-8">
                    {/* Description */}
                    <div>
                      <p className="text-base leading-relaxed">{project.description}</p>
                    </div>

                    {/* Tech Stack */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        기술 스택
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(project.techStack).map(([category, techs]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                              {category}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {(techs as string[]).map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Achievements for SK PharmaAIX */}
                    {project.id === "sk-pharmaaix" && project.achievements && Array.isArray(project.achievements) && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          주요 성과
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {project.achievements.map((achievement, idx) => {
                            if (typeof achievement === 'object' && 'metric' in achievement) {
                              return (
                                <Card key={idx} className="bg-muted/30">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{achievement.metric}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Before:</span>
                                      <span className="font-medium">{achievement.before}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">After:</span>
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        {achievement.after}
                                      </span>
                                    </div>
                                    <div className="pt-2 border-t">
                                      <Badge variant="default" className="w-full justify-center">
                                        {achievement.improvement}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Architecture Evolution for SK PharmaAIX */}
                    {project.id === "sk-pharmaaix" && project.architectureEvolution && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Layers className="h-5 w-5" />
                          아키텍처 진화
                        </h3>
                        <Accordion type="single" collapsible className="w-full">
                          {project.architectureEvolution.map((arch, idx) => (
                            <AccordionItem key={idx} value={`arch-${idx}`}>
                              <AccordionTrigger className="text-base font-semibold">
                                {arch.version}: {arch.title}
                              </AccordionTrigger>
                              <AccordionContent className="space-y-4">
                                {arch.problems && (
                                  <div>
                                    <h5 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                                      문제점
                                    </h5>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                      {arch.problems.map((problem, pidx) => (
                                        <li key={pidx} className="text-muted-foreground">{problem}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {arch.changes && (
                                  <div>
                                    <h5 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                                      변경 사항
                                    </h5>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                      {arch.changes.map((change, cidx) => (
                                        <li key={cidx} className="text-muted-foreground">{change}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {arch.results && (
                                  <div>
                                    <h5 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                                      결과
                                    </h5>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                      {arch.results.map((result, ridx) => (
                                        <li key={ridx} className="text-muted-foreground">{result}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                    {/* Key Responsibilities */}
                    {project.keyResponsibilities && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">담당 업무</h3>
                        <Accordion type="single" collapsible className="w-full">
                          {project.keyResponsibilities.map((resp, idx) => (
                            <AccordionItem key={idx} value={`resp-${idx}`}>
                              <AccordionTrigger className="text-base">{resp.title}</AccordionTrigger>
                              <AccordionContent>
                                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                  {resp.details.map((detail, didx) => (
                                    <li key={didx}>{detail}</li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                    {/* Key Features for KATECH */}
                    {project.id === "katech-ai-agent" && project.keyFeatures && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">주요 기능</h3>
                        <Accordion type="single" collapsible className="w-full">
                          {project.keyFeatures.map((feature, idx) => (
                            <AccordionItem key={idx} value={`feature-${idx}`}>
                              <AccordionTrigger className="text-base">{feature.title}</AccordionTrigger>
                              <AccordionContent>
                                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                  {feature.details.map((detail, didx) => (
                                    <li key={didx}>{detail}</li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                    {/* Business Goals for SK PharmaAIX */}
                    {project.id === "sk-pharmaaix" && project.businessGoals && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">비즈니스 목표</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {project.businessGoals.map((goal, idx) => (
                            <Card key={idx} className="bg-muted/30">
                              <CardHeader>
                                <CardTitle className="text-base">{goal.title}</CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm">
                                {goal.description && (
                                  <p className="text-muted-foreground">{goal.description}</p>
                                )}
                                {goal.items && (
                                  <ul className="space-y-2 text-muted-foreground">
                                    {goal.items.map((item, iidx) => (
                                      <li key={iidx} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Challenges */}
                    {project.challenges && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">도전 과제 및 극복</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {project.challenges.map((challenge, idx) => (
                            <Card key={idx} className="bg-muted/30">
                              <CardHeader>
                                <CardTitle className="text-sm">{challenge.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">{challenge.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Learnings */}
                    {project.learnings && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">배운 점 및 성장</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {project.learnings.map((learning, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-primary mt-1">✓</span>
                              <span className="text-muted-foreground">{learning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* KATECH Achievements */}
                    {project.id === "katech-ai-agent" && project.achievements && Array.isArray(project.achievements) && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          주요 성과
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {project.achievements.map((achievement, idx) => {
                            if (typeof achievement === 'string') {
                              return (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                  <span className="text-muted-foreground">{achievement}</span>
                                </li>
                              );
                            }
                            return null;
                          })}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
