# 🛍️ M-MALL

> **React + Supabase 기반 쇼핑몰 웹 플랫폼**  
> 학습을 위한 전자상거래 웹 사이트로로, 상품 관리부터 주문 결제까지 실제 쇼핑몰의 핵심 기능을 구현합니다.

---

## 🌐 배포 주소

**[M-MALL 바로가기](https://mmall-dev-project.github.io/M-MALL/)**

---

## 📖 프로젝트 소개

M-MALL은 현대카드 M몰을 모티브로 한 온라인 쇼핑몰 학습 프로젝트입니다.  
React와 Supabase를 활용하여 실제 서비스와 유사한 사용자 경험을 제공하며, 풀스택 웹 개발 역량을 기를 수 있도록 설계되었습니다.

### 🎯 주요 목표
- **실무 중심 학습**: 실제 전자상거래 플랫폼과 유사한 기능 구현
- **현대적 기술 스택**: React 18 + Supabase를 활용한 모던 웹 개발
- **협업 경험**: Git Flow와 Jira를 통한 팀 단위 프로젝트 관리
- **자동화 배포**: GitHub Actions를 통한 CI/CD 파이프라인 구축

---

## 🛠 기술 스택

### Frontend
- **React 19** - 사용자 인터페이스 구축
- **Vite** - 빠른 개발 환경 및 빌드 도구
- **React Router** - SPA 라우팅 관리
- **CSS3** - 커스텀 스타일링
- **Swiper** - 이미지 슬라이더 컴포넌트

### Backend & Database
- **Supabase** - 인증, 데이터베이스, 실시간 기능

### Deployment & Collaboration
- **GitHub Pages** - 정적 사이트 호스팅
- **GitHub Actions** - 자동 배포 및 CI/CD
- **Jira** - 이슈 트래킹 및 프로젝트 관리

---

## ✨ 주요 기능

### 🔐 사용자 관리
- 회원가입 및 로그인 (Supabase Auth)
- 사용자 프로필 관리
- 포인트 적립 및 사용 시스템

### 🛒 상품 및 쇼핑
- 카테고리별 상품 분류 (패션·뷰티, 리빙, 컬처 등)
- 상품 상세 정보 및 옵션 선택
- 장바구니 기능 (추가, 수정, 삭제)
- 찜하기 및 최근 본 상품

### 💳 주문 및 결제
- 포인트 사용
- 배송지 관리
- 주문 내역 및 상태 추적

### 📦 배송 관리
- 실시간 배송 상태 확인
- 배송 추적 시스템
- 배송 완료 알림

### 🔔 알림 시스템
- 할인 이벤트 알림
- 재입고 알림
- 배송 상태 변경 알림

### ⚙️ 관리자 기능
- 상품 등록 및 관리
- 재고 관리
- 주문 및 배송 관리
- 사용자 관리

---

## 📂 프로젝트 구조

```
M-MALL/
├── public/                 # 정적 파일
│   ├── images/            # 이미지 리소스
│   └── index.html         # HTML 템플릿
├── src/
│   ├── components/        # 재사용 가능한 컴포넌트
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── ...
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Cart/
│   │   └── ...
│   ├── contexts/          # React Context
│   ├── hooks/             # 커스텀 훅
│   ├── services/          # API 서비스
│   ├── utils/             # 유틸리티 함수
│   ├── config/            # 설정 파일
│   │   └── supabase.js    # Supabase 설정
│   ├── App.jsx            # 메인 앱 컴포넌트
│   └── main.jsx           # 진입점
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 프로젝트 이용 방법

### 🌐 웹사이트 접속 (일반 사용자)
배포된 사이트에 바로 접속하여 이용하실 수 있습니다:
**[M-MALL 바로가기](https://mmall-dev-project.github.io/M-MALL/)**

### 💻 로컬 개발 환경 설정 (개발자)

#### 사전 요구사항
- Node.js 18 이상 (빌드 도구 실행용)
- npm 또는 yarn (패키지 관리)

#### 설치 방법
```bash
# 1. 레포지토리 클론
git clone https://github.com/MMALL-Dev-Project/M-MALL.git

# 2. 프로젝트 디렉토리 이동
cd M-MALL

# 3. 의존성 설치
npm install

# 4. 환경 변수 설정
# .env 파일을 생성하고 Supabase 설정을 추가하세요
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 5. 개발 서버 실행
npm run dev
```

#### 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 로컬에서 빌드 결과 미리보기
npm run preview
```

---

## 🔄 협업 워크플로우

### Git Flow 전략
- `main`: 배포 가능한 안정 버전
- `develop`: 개발 진행 중인 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 브랜치 명명 규칙
```
feature/SCRUM-1-login-page
feature/SCRUM-2-product-list
bugfix/SCRUM-10-cart-error
```

### 커밋 메시지 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 설정 변경
```

---

## 👥 팀 구성

| 이름   | 역할              | GitHub |
|--------|-------------------|---------|
| 김예지 | Full-stack Developer | [@yjkdev21](https://github.com/yjkdev21) |
| 김환희 | Full-stack Developer | [@rlaksl](https://github.com/rlaksl) |
| 백유선 | Full-stack Developer | [@dimsum](https://github.com/yuseon4455) |

---

## 📋 개발 현황

### ✅ 완료된 기능 (11개)
- [x] **회원 기능**: 회원가입, 로그인/로그아웃
- [x] **상품 관리**: 카테고리별 상품목록
- [x] **UI/UX**: 헤더 네비게이션, 푸터
- [x] **고객지원**: 공지사항 페이지
- [x] **기본 인프라**: Supabase 연동, 배포 환경

### 🚧 진행 중인 작업 (17개)
**마이페이지 기능** (김환희, 백유선 담당)
- [ ] 프로필 수정, 비밀번호 변경
- [ ] 주문내역, 포인트내역 조회
- [ ] 좋아요 목록 관리

**쇼핑 핵심 기능** (김예지, 김환희 담당)
- [ ] 상품 상세 페이지, 재고 확인
- [ ] 상품 검색 및 필터링
- [ ] 장바구니 (담기, 수량변경, 삭제, 선택구매)

**주문/결제 시스템** (백유선 담당)
- [ ] 주문서 작성, 결제 처리
- [ ] 포인트 사용, 배송지 관리

### 📅 계획된 기능 (27개)
**리뷰 & 소통** (6개 기능)
- 리뷰 작성/조회, 평점 시스템
- 상품/일반 문의 및 답변

**관리자 기능** (11개 기능)
- 상품/재고/회원/주문 관리
- 컨텐츠 및 배너 관리

**부가 기능** (10개 기능)
- 검색 기록 관리, FAQ
- 반응형 웹, 모바일 최적화

### 📊 전체 진행률
**총 55개 기능 중 11개 완료 (20%)**

---

## 📄 라이선스

이 프로젝트는 학습 목적으로 제작되었습니다.
