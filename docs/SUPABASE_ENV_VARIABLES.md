# Supabase 환경 변수 목록

## 개요
이 문서는 AppHub 프로젝트에 Supabase를 연결하기 위해 필요한 환경 변수 목록을 정의합니다.

## 필수 환경 변수

### 1. Supabase 프로젝트 URL
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```
- **설명**: Supabase 프로젝트의 고유 URL
- **용도**: 클라이언트에서 Supabase API에 접근하기 위한 엔드포인트
- **접근 방법**: Supabase 대시보드 → Project Settings → API → Project URL
- **타입**: Public (클라이언트 측에서 접근 가능)

### 2. Supabase Anon/Public Key
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
- **설명**: 클라이언트에서 사용하는 공개 API 키
- **용도**: Row Level Security (RLS) 정책이 적용된 데이터에 안전하게 접근
- **접근 방법**: Supabase 대시보드 → Project Settings → API → `anon` `public` key
- **타입**: Public (클라이언트 측에서 접근 가능)
- **보안**: RLS 정책으로 보호되므로 클라이언트에 노출 가능

## 선택적 환경 변수 (서버 측)

### 3. Supabase Service Role Key (서버 전용)
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
- **설명**: RLS 정책을 우회하는 관리자 수준의 키
- **용도**: 서버 측에서 관리자 권한이 필요한 작업 수행
- **접근 방법**: Supabase 대시보드 → Project Settings → API → `service_role` key
- **타입**: Secret (절대 클라이언트에 노출하면 안 됨)
- **보안**: 매우 중요 - `.env.local`에만 저장하고 절대 커밋하지 말 것
- **사용 예시**:
  - 사용자 계정 관리 (서버 측)
  - 대량 데이터 작업
  - 관리자 대시보드 기능

### 4. Database Direct URL (선택적)
```env
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```
- **설명**: PostgreSQL 데이터베이스 직접 연결 URL
- **용도**: Prisma, Drizzle 등 ORM 사용 시 또는 서버 측 직접 연결
- **접근 방법**: Supabase 대시보드 → Project Settings → Database → Connection string
- **타입**: Secret (서버 전용)
- **사용 케이스**:
  - Database migrations
  - ORM 사용 (Prisma, Drizzle)
  - 서버 측 고급 쿼리

### 5. JWT Secret (선택적)
```env
SUPABASE_JWT_SECRET=your-jwt-secret
```
- **설명**: JWT 토큰 검증을 위한 시크릿 키
- **용도**: 서버 측에서 Supabase 인증 토큰 검증
- **접근 방법**: Supabase 대시보드 → Project Settings → API → JWT Settings → JWT Secret
- **타입**: Secret (서버 전용)
- **사용 케이스**:
  - 커스텀 미들웨어에서 토큰 검증
  - 써드파티 서비스와 통합

## Storage 관련 환경 변수 (선택적)

### 6. Storage URL (자동 생성)
```env
# 일반적으로 프로젝트 URL에서 자동 유추됨
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
```
- **설명**: Supabase Storage API URL
- **용도**: 파일 업로드/다운로드
- **참고**: 일반적으로 명시하지 않아도 SDK에서 자동 생성

## Realtime 관련 환경 변수 (선택적)

### 7. Realtime 설정
```env
# Realtime 연결은 기본적으로 NEXT_PUBLIC_SUPABASE_URL을 사용
# 커스텀 설정이 필요한 경우:
NEXT_PUBLIC_SUPABASE_REALTIME_URL=wss://your-project.supabase.co/realtime/v1
```
- **설명**: Realtime subscription용 WebSocket URL
- **용도**: 실시간 데이터 동기화
- **참고**: 일반적으로 기본 URL에서 자동 유추됨

## Auth 관련 환경 변수 (선택적)

### 8. Redirect URLs
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
- **설명**: OAuth 콜백 및 이메일 확인 후 리다이렉트 URL
- **용도**: 인증 플로우 완료 후 사용자 리다이렉션
- **환경별 설정 필요**:
  - 로컬: `http://localhost:3000`
  - 스테이징: `https://staging.yourdomain.com`
  - 프로덕션: `https://yourdomain.com`

## 환경별 설정

### Development (.env.local)
```env
# 필수
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 서버 측 작업이 필요한 경우
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 로컬 개발
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel/환경 변수 설정)
```env
# 필수
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 서버 측 (Secret으로 설정)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 프로덕션 URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## AppHub 프로젝트 적용 계획

### Phase 1: 기본 연결
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Phase 2: 사용자 인증 추가
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
```

### Phase 3: 서버 측 관리 기능
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

### Phase 4: ORM/Direct DB 접근 (필요시)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_SITE_URL=
```

## 보안 고려사항

### ✅ 공개 가능 (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

이들은 클라이언트 번들에 포함되며, Row Level Security로 보호됩니다.

### ⚠️ 절대 노출 금지
- `SUPABASE_SERVICE_ROLE_KEY` - 모든 RLS 정책 우회
- `DATABASE_URL` - 직접 DB 접근
- `SUPABASE_JWT_SECRET` - 토큰 위조 가능

### 보안 체크리스트
- [ ] `.env.local` 파일을 `.gitignore`에 추가
- [ ] Service Role Key는 서버 사이드 코드에서만 사용
- [ ] 프로덕션 키와 개발 키를 분리
- [ ] Supabase 대시보드에서 RLS 정책 활성화
- [ ] 정기적으로 키 로테이션

## 설치 방법

### 1. Supabase Client 설치
```bash
npm install @supabase/supabase-js
# or
bun add @supabase/supabase-js
```

### 2. 환경 변수 파일 생성
```bash
touch .env.local
```

### 3. `.gitignore` 확인
```gitignore
.env.local
.env*.local
```

### 4. Supabase Client 초기화 예시
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 5. 서버 측 Client (선택적)
```typescript
// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js with Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth 설정](https://supabase.com/docs/guides/auth)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

## 현재 프로젝트 상태

- ✅ 환경 변수 목록 파악 완료
- ⏳ Supabase 프로젝트 생성 대기
- ⏳ 환경 변수 설정 대기
- ⏳ Supabase Client 설치 대기
- ⏳ 데이터베이스 스키마 설계 대기

## 다음 단계

1. **SYS-21**: ✅ 필요한 환경 변수 목록 파악 (완료)
2. **SYS-22**: Supabase 프로젝트 생성
3. **SYS-23**: 환경 변수 설정 및 연결 테스트
4. **SYS-24**: 데이터베이스 스키마 설계
5. **SYS-25**: Supabase Client 설정 및 기본 CRUD 구현
