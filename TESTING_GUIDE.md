# 행운사주 앱 테스트 가이드

베타 만료로 인한 테스트 불가 상황에서 앱을 테스트할 수 있는 방법들을 정리합니다.

## 현재 상황
- 기존 베타 빌드 만료로 테스트 불가
- Expo Go로 직접 테스트하거나 새로운 개발 빌드 필요

## 테스트 방법 옵션

### 옵션 1: EAS 개발 빌드 (권장)

개발용 커스텀 클라이언트를 빌드하여 테스트하는 방법입니다.

#### 1.1 EAS CLI 설치 및 로그인
```bash
# EAS CLI 설치
npm install -g eas-cli

# Expo 계정 로그인
eas login
```

#### 1.2 Android 개발 빌드
```bash
# Android 개발 빌드
eas build --platform android --profile development

# 빌드 완료 후 APK 다운로드하여 기기에 설치
```

#### 1.3 iOS 개발 빌드 (Apple Developer 계정 필요)
```bash
# iOS 개발 빌드
eas build --platform ios --profile development

# 빌드 완료 후 앱을 기기에 설치
# TestFlight 또는 직접 설치 가능
```

#### 1.4 개발 서버 연결
```bash
# 개발 빌드 설치 후 개발 서버 시작
npm start --dev-client

# 또는
expo start --dev-client
```

**장점:**
- 모든 네이티브 기능 테스트 가능 (인앱구매, 파일 저장 등)
- 실제 프로덕션 환경과 동일한 조건
- Hot reload 지원

**단점:**
- 빌드 시간 소요 (10-20분)
- iOS의 경우 Apple Developer 계정 필요

### 옵션 2: Expo Go 앱 사용 (제한적)

#### 2.1 Expo Go 설치
- iOS: App Store에서 "Expo Go" 설치
- Android: Google Play Store에서 "Expo Go" 설치

#### 2.2 개발 서버 시작
```bash
npm start
```

#### 2.3 QR 코드 스캔
- 터미널에 표시된 QR 코드를 Expo Go 앱으로 스캔
- 또는 같은 WiFi 네트워크에서 링크 접속

**장점:**
- 즉시 테스트 가능
- 빌드 시간 불필요

**단점:**
- 네이티브 모듈 사용 불가 (react-native-iap, expo-media-library 등)
- 실제 기능의 상당 부분 테스트 불가능

### 옵션 3: 웹 버전 테스트

#### 3.1 웹 개발 서버 시작
```bash
npm run web
```

브라우저에서 `http://localhost:8081` 접속

**장점:**
- 즉시 테스트 가능
- 기본 UI/UX 확인 가능

**단점:**
- 모바일 전용 기능 테스트 불가
- 네이티브 API 사용 불가

## 권장 테스트 플로우

### 1단계: 웹 버전으로 빠른 확인
```bash
npm run web
```
기본적인 UI/UX 및 WebView 콘텐츠 확인

### 2단계: Expo Go로 모바일 환경 확인
```bash
npm start
```
모바일 환경에서의 기본 동작 확인 (네이티브 기능 제외)

### 3단계: EAS 개발 빌드로 전체 기능 테스트
```bash
eas build --platform android --profile development
```
인앱구매, 파일 저장 등 모든 기능 테스트

## EAS 빌드 설정 확인

현재 `eas.json` 설정:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

## 주의사항

1. **네이티브 모듈 의존성**
   - 이 앱은 `react-native-iap`, `expo-media-library` 등 네이티브 모듈을 사용
   - Expo Go로는 이러한 기능들을 테스트할 수 없음
   - 완전한 테스트를 위해서는 EAS 개발 빌드 필수

2. **Apple Developer 계정**
   - iOS 개발 빌드를 위해서는 유료 Apple Developer 계정 필요
   - Android는 무료로 개발 빌드 가능

3. **빌드 시간**
   - 개발 빌드는 처음에만 오래 걸림
   - 이후 코드 변경사항은 hot reload로 즉시 반영

4. **인터넷 연결**
   - 개발 빌드 사용 시에도 개발 머신과 같은 네트워크에 있어야 함
   - 또는 터널링 옵션 사용 가능

## 빌드 상태 확인

빌드 진행 상황은 다음에서 확인 가능:
```bash
eas build:list
```

또는 Expo 웹사이트에서 프로젝트 대시보드 확인:
https://expo.dev/accounts/gibanio/projects/haengwoonsaju

## 문제 해결

### 빌드 실패 시
1. EAS CLI 최신 버전 확인: `eas --version`
2. 로그인 상태 확인: `eas whoami`
3. 빌드 로그 확인: `eas build:view [BUILD_ID]`

### 개발 서버 연결 실패 시
1. 같은 WiFi 네트워크 연결 확인
2. 방화벽 설정 확인
3. 터널링 옵션 사용: `expo start --tunnel`

## 결론

**즉시 테스트가 필요한 경우**: 웹 버전 또는 Expo Go 사용
**완전한 기능 테스트가 필요한 경우**: EAS 개발 빌드 권장

네이티브 기능이 중요한 이 앱의 특성상, EAS 개발 빌드를 통한 테스트가 가장 효과적입니다.