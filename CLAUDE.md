# CLAUDE.md

이 파일은 이 리포지토리에서 코드 작업 시 Claude Code (claude.ai/code)에게 가이드를 제공합니다.

## 프로젝트 개요

"행운사주"는 Expo React Native로 구축된 한국 운세 모바일 애플리케이션입니다. 이 앱은 인앱 구매 기능과 이미지/PDF 저장 기능이 포함된 다양한 운세 서비스를 제공합니다.

## 개발 명령어

### 환경 설정
```bash
npm install
```

### 개발
```bash
npm start           # Expo 개발 서버 시작
npm run android     # Android 기기/에뮬레이터에서 실행
npm run ios         # iOS 기기/시뮬레이터에서 실행
npm run web         # 웹 버전 실행
```

### 테스트 및 품질 관리
```bash
npm test           # Jest 테스트 watch 모드 실행
npm run lint       # Expo lint 실행
```

### 빌드 및 배포
```bash
eas build --platform android --profile preview    # Android 프리뷰 빌드
eas build --platform ios --profile preview        # iOS 프리뷰 빌드
eas build --platform all --profile production     # 프로덕션 빌드
```

## 아키텍처

### 기술 스택
- **프레임워크**: Expo SDK 52 with new architecture (Fabric/TurboModules)
- **네비게이션**: Expo Router (파일 기반 라우팅)
- **언어**: TypeScript with strict mode
- **플랫폼**: 크로스 플랫폼 (iOS, Android, Web)
- **빌드 시스템**: EAS Build

### 주요 의존성
- `react-native-iap`: 인앱 구매 기능
- `expo-media-library`: 사진 갤러리 연동  
- `expo-print`: PDF 생성
- `react-native-webview`: WebView를 통한 메인 앱 콘텐츠
- `expo-file-system`: 파일 작업

### 프로젝트 구조
```
app/                 # Expo Router 페이지
├── _layout.tsx      # 네비게이션이 포함된 루트 레이아웃
└── index.tsx        # 메인 WebView 앱
components/          # 재사용 가능한 UI 컴포넌트
constants/           # 설정 및 상수
├── Config.ts        # 환경 설정 및 API 설정
├── Product.ts       # 인앱 구매 상품 정의
└── Colors.ts        # 테마 색상
hooks/              # 커스텀 React 훅
assets/             # 정적 자산 (이미지, 폰트)
scripts/            # 빌드 및 유틸리티 스크립트
```

### 아키텍처 패턴

**WebView 기반 앱**: 메인 애플리케이션 콘텐츠는 `https://haengwoonsaju.com`에서 WebView를 통해 제공됩니다. React Native 레이어는 다음을 처리합니다:
- 네이티브 API를 통한 인앱 구매
- 기기 저장소에 사진/PDF 저장
- 딥링크 및 외부 URL 처리
- 네이티브 UI 최적화 (뷰포트, 키보드 처리)

**하이브리드 통신**: WebView와 React Native 간 양방향 통신을 위해 `postMessage` 사용:
- `REQUEST_PAYMENT`: 네이티브 인앱 구매 플로우 트리거
- `SAVE_SCREEN`/`SAVE_IMAGE`: 콘텐츠 캡처 및 저장
- `CAPTURE_FULL_PAGE`: 웹 콘텐츠에서 PDF 생성

**플랫폼별 상품 ID**: 인앱 구매 상품의 iOS(대문자) vs Android(소문자) 케이싱 차이

## 설정

### 환경 변수
`constants/Config.ts`에서 설정:
- `API_HOST`: 웹 애플리케이션 URL (https://haengwoonsaju.com)
- `IS_DEV_MODE`: 개발 모드 플래그
- `API_SECRET`: 인증 시크릿

### 플랫폼 설정
- **iOS**: 사진 라이브러리 권한, 번들 식별자 `com.haengwoonsaju`
- **Android**: 저장소 권한, clear text traffic 활성화
- **EAS**: 자동 증분 빌드, 프리뷰용 내부 배포

### 인앱 구매 상품
플랫폼별 ID를 가진 6개의 운세 상품:
- 신년운세, 직장운세, 시험운세, 연애운세, 궁합프리미엄, 대운세

## 개발 가이드라인

### 파일 명명 규칙
- React 컴포넌트는 PascalCase 사용
- TypeScript 파일은 camelCase 사용
- 커스텀 훅은 `use` 접두사 사용

### 임포트 패턴
- 프로젝트 루트에서 임포트할 때 `@/` 별칭 사용
- 임포트 그룹화: React/React Native, 서드파티, 로컬

### WebView 통합
- 모든 웹-네이티브 통신은 타입이 지정된 JSON 메시지와 함께 `postMessage` 사용
- 구매 라이프사이클 처리: 요청 → 네이티브 처리 → 결과 콜백
- 뷰포트 수정 및 제스처 처리를 위한 JavaScript 주입

### 플랫폼 고려사항
- iOS/Android 인앱 구매의 서로 다른 상품 ID
- 플랫폼별 파일 저장 (iOS Documents vs Android SAF)
- 플랫폼별 권한 모델 처리

## 테스트

- React Native 테스트를 위한 Jest 설정
- UI 컴포넌트의 스냅샷 테스트
- `__tests__` 디렉토리의 테스트 파일

## 빌드 프로세스

EAS Build와 함께 Expo의 관리형 워크플로우 사용:
- **Development**: 테스트용 개발 클라이언트 빌드
- **Preview**: 내부 배포 빌드
- **Production**: 자동 증분이 포함된 앱 스토어 준비 빌드

## 일반적인 문제

### WebView 스케일링
앱에는 input 포커스 시 iOS WebView 스케일링 문제를 방지하기 위한 특정 JavaScript 주입이 포함되어 있습니다.

### 인앱 구매 플로우
구매는 플랫폼별 승인 및 트랜잭션 완료와 함께 React Native에서 완전히 처리됩니다.

### 파일 권한
이미지 저장과 PDF 생성 모두 플랫폼별 권한 처리와 다양한 저장 방식이 필요합니다.