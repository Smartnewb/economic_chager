# 다음 액션 플랜 - Insight Flow

## 현재 상태 (2026-01-14 19:30)

### ✅ Ralph 완료 작업 (259/282 = 91.8%)
- **Phase 12-18, 20**: 대부분 완료
- **핵심 페이지**: 전부 복구 + PRD 기능 구현 완료
- **공유 컴포넌트**: AnalysisTriggerButton, AnalysisPanel, TypewriterText 완료
- **백엔드 AI**: 모든 analyze 엔드포인트 + 캐싱 완료
- **PRD 핵심**: Treemap, Globe, Rate Clock, Dr. Copper, PMI, Radar Chart 완료
- **모바일**: 반응형 + 터치 최적화 완료
- **배포**: Docker, CI/CD, 문서화 완료

### ⏳ 남은 작업 (23개)
- Phase 16.4: 모바일 수동 QA (4개)
- Phase 17: DEFERRED 항목들 (Skeleton UI, Error Boundary 등)
- Phase 19: 테스트 작성 (Unit, E2E, API)
- Phase 20.2-20.3: 프로덕션 배포 테스트

---

## 즉시 해야 할 작업 (HIGH PRIORITY)

### 1. 프론트엔드 수동 QA - 브라우저 테스트 (30분 ~ 1시간)

#### 1.1 모든 페이지 로딩 테스트
```bash
# 개발 서버 실행 확인
cd frontend && npm run dev
# 백엔드 실행 확인
cd .. && python3 api/main.py
```

**체크리스트:**
- [ ] `http://localhost:3000/` - 랜딩 페이지 로딩
- [ ] `/bonds` - Yield Curve 차트 렌더링, Historical Toggle 동작
- [ ] `/stocks` - Treemap Heatmap 표시, VIX Gauge 동작
- [ ] `/currency` - Globe 3D 비주얼, 자본 흐름 Arc 표시
- [ ] `/policy` - Rate Cycle Clock 사인파, 국가 배치, 회의 카운트다운
- [ ] `/economy` - Dr. Copper 게이지, PMI Gauge, Economic Calendar
- [ ] `/country/KR` - Radar Chart, 4-Pillar Cards, Grade A-F 표시
- [ ] `/whale` - Smart Money Radar, 13F Filings, Guru Portfolio
- [ ] `/macro` - Buffett Indicator, Yield Curve Status, Credit Spreads
- [ ] `/history` - Crisis Timeline, Pattern Matching
- [ ] `/insights` - 뉴스 필터링, InsightCard, BehavioralBiasWidget

#### 1.2 AnalysisTriggerButton + AnalysisPanel 동작 테스트
**각 페이지에서:**
- [ ] "Summon the Board" 버튼 클릭
- [ ] 로딩 상태 표시 ("The Board is reviewing...")
- [ ] AnalysisPanel 슬라이드 인 애니메이션
- [ ] 4 persona (Kostolany, Buffett, Munger, Dalio) 토론 표시
- [ ] TypewriterText 타이핑 애니메이션
- [ ] Debate Synthesis 섹션 표시
- [ ] Close 버튼 (X) 동작
- [ ] ESC 키로 패널 닫기

#### 1.3 모바일 반응형 테스트 (Chrome DevTools)
```
F12 → Toggle device toolbar → Responsive
```

**테스트 기기:**
- [ ] **iPhone SE (375px)**: 햄버거 메뉴, 차트 높이, AnalysisPanel full-screen
- [ ] **iPad (768px)**: Navigation drawer, 차트 반응형
- [ ] **iPad Pro (1024px)**: 데스크톱 레이아웃 전환
- [ ] **Landscape mode**: 가로 모드에서 레이아웃 깨짐 확인

#### 1.4 에러 핸들링 테스트
```bash
# 백엔드 중지
pkill -f "uvicorn"
```
- [ ] 프론트엔드에서 "Backend unavailable" 메시지 표시
- [ ] Retry 버튼 클릭 → 재시도 동작
- [ ] 백엔드 재시작 후 정상 복구

---

### 2. 백엔드 API 엔드포인트 검증 (20분)

#### 2.1 데이터 엔드포인트 전체 테스트
```bash
# API 테스트 스크립트 작성
cat > test_apis.sh << 'EOF'
#!/bin/bash
BASE_URL="http://localhost:8000"

echo "=== Testing Data APIs ==="
curl -s $BASE_URL/api/fx/rates | jq '.rates | length'
curl -s $BASE_URL/api/bonds/yields | jq '.current_curve.data | length'
curl -s $BASE_URL/api/stocks/global | jq '.global_indices | length'
curl -s $BASE_URL/api/policy/global | jq '.banks | length'
curl -s $BASE_URL/api/economy/data | jq '.commodities'
curl -s $BASE_URL/api/whale/alerts | jq '.count'
curl -s $BASE_URL/api/macro/health-check | jq '.buffett_indicator'
curl -s $BASE_URL/api/history/crisis | jq '.scenarios | length'

echo "=== Testing Analyze APIs ==="
curl -s -X POST $BASE_URL/api/analyze/bonds -H "Content-Type: application/json" -d '{}' | jq '.perspectives | length'
curl -s -X POST $BASE_URL/api/analyze/stocks -H "Content-Type: application/json" -d '{}' | jq '.synthesis'
curl -s -X POST $BASE_URL/api/analyze/fx -H "Content-Type: application/json" -d '{}' | jq '.perspectives | length'

echo "=== Testing Cached APIs ==="
curl -s $BASE_URL/api/analyze/bonds/cached | jq '.cached'
EOF

chmod +x test_apis.sh
./test_apis.sh
```

**예상 결과:**
- 모든 엔드포인트 200 응답
- 데이터 구조 일치 (배열 길이, 객체 키 존재)
- Analyze API 4개 perspectives 반환
- Cached API `cached: true/false` 반환

#### 2.2 에러 케이스 테스트
```bash
# 잘못된 country code
curl -s $BASE_URL/api/country/INVALID | jq

# 잘못된 analyze 요청
curl -s -X POST $BASE_URL/api/analyze/nonexistent | jq
```

---

### 3. 프로덕션 빌드 테스트 (15분)

#### 3.1 Frontend 프로덕션 빌드
```bash
cd frontend
npm run build

# 빌드 성공 확인
ls -lh .next/standalone
ls -lh .next/static

# 프로덕션 서버 실행 테스트
npm run start
# http://localhost:3000 접속 → 정상 동작 확인
```

**체크리스트:**
- [ ] 빌드 에러 없음
- [ ] Bundle size 적정 (< 500KB main chunk)
- [ ] Dynamic import 분할 확인 (Currency, Stocks, Country 페이지별 chunk)
- [ ] 프로덕션 모드에서 페이지 로딩 정상

#### 3.2 Docker 컨테이너 빌드
```bash
cd /Users/smartnewbie/Desktop/economic_chaneger

# Backend 이미지 빌드
docker build -t insight-flow-api -f api/Dockerfile .

# Frontend 이미지 빌드
docker build -t insight-flow-frontend -f frontend/Dockerfile ./frontend

# Docker Compose 실행
docker-compose up -d

# 컨테이너 상태 확인
docker-compose ps
docker-compose logs -f

# 접속 테스트
curl http://localhost:8000/api/fx/rates
curl http://localhost:3000
```

**예상 결과:**
- [ ] 두 이미지 빌드 성공
- [ ] 컨테이너 실행 (api, frontend)
- [ ] API 8000번 포트 응답
- [ ] Frontend 3000번 포트 응답
- [ ] 프론트엔드 → 백엔드 통신 정상

---

## 중기 작업 (MEDIUM PRIORITY)

### 4. 코드 품질 개선 (1-2시간)

#### 4.1 TypeScript 타입 안정성 체크
```bash
cd frontend
npm run type-check

# 타입 에러 수정
# - any 타입 제거
# - interface 정의 정확히
# - API 응답 타입 검증
```

#### 4.2 Lint 수정
```bash
npm run lint

# Warning 수정
# - unused imports 제거
# - console.log 제거 (프로덕션)
# - key prop 검증
```

#### 4.3 백엔드 Lint
```bash
cd api
ruff check .
ruff format .

# Lint 에러 수정
# - unused imports
# - function 길이 분할
# - docstring 추가 (public 함수)
```

---

### 5. 성능 최적화 검증 (30분)

#### 5.1 Lighthouse 점수 측정
```
Chrome DevTools → Lighthouse → Generate report
```

**목표:**
- Performance: 80+ (모바일), 90+ (데스크톱)
- Accessibility: 90+
- Best Practices: 90+
- SEO: 80+

**개선 포인트:**
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] Image lazy loading (Next.js Image 사용)
- [ ] Font preload

#### 5.2 Bundle Size 분석
```bash
cd frontend
npm run build

# Analyze bundle
npx @next/bundle-analyzer
```

**확인 사항:**
- [ ] Main chunk < 300KB
- [ ] Dynamic imports 정상 분할
- [ ] Recharts, Deck.gl 등 무거운 라이브러리 lazy load

---

### 6. 보안 점검 (30분)

#### 6.1 환경변수 검증
```bash
# .env.example 확인
cat .env.example

# 실제 .env 파일에 민감 정보 없는지 확인
grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.next
```

- [ ] API Key 하드코딩 없음
- [ ] .gitignore에 .env 포함
- [ ] .env.example에 템플릿만 존재

#### 6.2 CORS 설정 확인
```python
# api/main.py
# allow_origins=["*"] → 프로덕션에서 specific domain으��� 변경
```

#### 6.3 Rate Limiting 확인
```python
# api/main.py
# AI analyze 엔드포인트에 rate limiting 추가
```

---

## 장기 작업 (LOW PRIORITY)

### 7. 자동화 테스트 작성 (2-4시간)

#### 7.1 Frontend Unit Tests (Vitest)
```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom

# vitest.config.ts 생성
# __tests__/ 폴더 생성
```

**테스트 대상:**
- [ ] `lib/api.ts` - apiEndpoints, API_BASE_URL
- [ ] `components/ui/TypewriterText.tsx` - 타이핑 애니메이션
- [ ] 데이터 변환 함수 (경제 지표 계산 등)

#### 7.2 Backend API Tests (pytest)
```bash
cd api
pip install pytest pytest-asyncio httpx

# tests/ 폴더 생성
# test_main.py 작성
```

**테스트 대상:**
- [ ] GET /api/fx/rates → 200, rates 배열
- [ ] POST /api/analyze/bonds → 200, 4 perspectives
- [ ] GET /api/analyze/bonds/cached → cached boolean

#### 7.3 E2E Tests (Playwright)
```bash
cd frontend
npm install -D @playwright/test

# e2e/ 폴더 생성
```

**시나리오:**
1. 홈 → /bonds 이동
2. "Summon the Board" 클릭
3. AnalysisPanel 열림 확인
4. ESC 키로 닫기
5. Historical Toggle 동작

---

### 8. 문서화 개선 (1시간)

#### 8.1 README.md 강화
```markdown
# Insight Flow

## Screenshots
- Landing page
- Bonds Yield Curve
- Currency Globe
- Country Radar

## Architecture Diagram
- Frontend (Next.js) → Backend (FastAPI) → External APIs

## Development Roadmap
- [x] Phase 12-15: Core features
- [ ] Phase 19: Testing
- [ ] Phase 20: Production deployment

## Performance
- Lighthouse score: 90+
- Bundle size: 500KB
```

#### 8.2 API 문서 보강
```python
# api/main.py
# FastAPI docstring 추가
"""
POST /api/analyze/bonds

Request:
{
  "current_data": { ... }  # optional
}

Response:
{
  "perspectives": [
    {
      "persona": "Kostolany",
      "analysis": "..."
    }
  ],
  "synthesis": "...",
  "timestamp": "..."
}
"""
```

#### 8.3 CONTRIBUTING.md 작성
```markdown
# Contributing Guide

## Setup
1. Clone repo
2. Install dependencies
3. Run dev servers

## Code Style
- Frontend: Prettier + ESLint
- Backend: Ruff + Black

## PR Process
1. Create feature branch
2. Write tests
3. Submit PR
```

---

### 9. 배포 (1-2시간)

#### 9.1 Vercel 배포 (Frontend)
```bash
# Vercel CLI 설치
npm install -g vercel

cd frontend
vercel login
vercel

# 환경변수 설정
vercel env add NEXT_PUBLIC_API_URL
```

**설정:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Environment Variables:
  - `NEXT_PUBLIC_API_URL`: `https://api.your-domain.com`

#### 9.2 Railway 배포 (Backend)
```bash
# Railway CLI 설치
npm install -g @railway/cli

cd api
railway login
railway init
railway up
```

**설정:**
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  - `OPENAI_API_KEY`
  - `FMP_API_KEY`
  - `FRED_API_KEY`

#### 9.3 도메인 연결
```
Frontend: app.insightflow.io → Vercel
Backend: api.insightflow.io → Railway
```

---

## 우선순위별 작업 순서

### 🔴 오늘 즉시 (1-2시간)
1. ✅ **작업 1**: 프론트엔드 수동 QA (모든 페이지 브라우저 테스트)
2. ✅ **작업 2**: 백엔드 API 검증 (curl 스크립트)
3. ✅ **작업 3**: 프로덕션 빌드 + Docker 테스트

### 🟠 이번 주 (2-4시간)
4. **작업 4**: 코드 품질 개선 (타입 체크, Lint)
5. **작업 5**: 성능 최적화 검증 (Lighthouse)
6. **작업 6**: 보안 점검 (환경변수, CORS)

### 🟡 다음 주 (4-8시간)
7. **작업 7**: 자동화 테스트 작성 (Vitest, pytest, Playwright)
8. **작업 8**: 문서화 개선 (README, API docs)

### 🟢 배포 시점 (1-2시간)
9. **작업 9**: Vercel + Railway 배포

---

## 체크리스트 템플릿

### Daily QA Checklist
```
날짜: ____-__-__

[ ] 모든 페이지 로딩 정상
[ ] AnalysisPanel 동작 정상
[ ] 모바일 반응형 정상
[ ] 에러 핸들링 정상
[ ] API 엔드포인트 200 응답
[ ] 프로덕션 빌드 성공
[ ] Docker 컨테이너 실행 정상

특이사항:
-
```

---

## 예상 소요 시간

| 작업 | 소요 시간 | 우선순위 |
|------|----------|---------|
| 1. 프론트엔드 QA | 1시간 | 🔴 HIGH |
| 2. 백엔드 API 검증 | 20분 | 🔴 HIGH |
| 3. 프로덕션 빌드 | 15분 | 🔴 HIGH |
| 4. 코드 품질 | 1-2시간 | 🟠 MED |
| 5. 성능 검증 | 30분 | 🟠 MED |
| 6. 보안 점검 | 30분 | 🟠 MED |
| 7. 테스트 작성 | 2-4시간 | 🟡 LOW |
| 8. 문서화 | 1시간 | 🟡 LOW |
| 9. 배포 | 1-2시간 | 🟢 FINAL |

**총 예상 시간:** 8-12시간
**핵심 작업만:** 2-3시간 (1, 2, 3, 9)
