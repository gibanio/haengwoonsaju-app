# 행운사주 앱 빌드 및 배포 가이드

## 목차
1. [사전 준비](#사전-준비)
2. [테스트 빌드 (Preview)](#테스트-빌드-preview)
3. [프로덕션 빌드 (Production)](#프로덕션-빌드-production)
4. [배포 및 테스트](#배포-및-테스트)
5. [문제 해결](#문제-해결)

---

## 사전 준비

### 1. EAS CLI 설치 및 로그인

```bash
# EAS CLI 설치 (글로벌)
npm install -g eas-cli

# Expo 계정 로그인
eas login
```

### 2. 프로젝트 초기 설정 (최초 1회)

```bash
# EAS 프로젝트 설정 (이미 완료되어 있으면 스킵)
eas build:configure
```

### 3. 필수 파일 확인

다음 파일들이 올바르게 설정되어 있는지 확인:
- `eas.json`: 빌드 프로필 설정
- `app.json`: 앱 설정 및 버전 정보
- Apple Developer 계정 (iOS)
- Google Play Developer 계정 (Android)

---

## 테스트 빌드 (Preview)

테스트 빌드는 내부 테스터에게 배포하기 위한 빌드입니다.

### Android 테스트 빌드

#### 1단계: APK 빌드 (빠른 테스트용)

```bash
# Android APK 빌드
eas build --platform android --profile preview
```

#### 2단계: 빌드 진행 확인

- 터미널에서 빌드 진행 상황 확인
- Expo 대시보드에서도 확인 가능: https://expo.dev

#### 3단계: APK 다운로드 및 배포

```bash
# 빌드 완료 후 QR 코드 스캔 또는 URL로 다운로드
# 또는 Expo 대시보드에서 직접 다운로드
```

**테스터에게 공유:**
- APK 파일을 직접 공유
- 또는 Expo 대시보드 링크 공유

### iOS 테스트 빌드

#### 1단계: TestFlight 빌드

```bash
# iOS 빌드 (TestFlight용)
eas build --platform ios --profile preview
```

#### 2단계: Apple Developer 자격증명 설정

```bash
# 최초 빌드 시 Apple 계정 인증 필요
# EAS CLI가 자동으로 안내
```

#### 3단계: TestFlight 배포

빌드 완료 후:
1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. 앱 선택 → TestFlight 탭
3. 빌드가 자동으로 나타남 (처리 시간: 10-30분)
4. 테스터 그룹 생성 및 초대

**테스터 초대:**
- 내부 테스터: Apple ID 이메일로 초대 (최대 100명)
- 외부 테스터: 이메일 초대 후 Apple 검토 필요

---

## 프로덕션 빌드 (Production)

앱스토어/플레이스토어에 출시하기 위한 최종 빌드입니다.

### 빌드 전 체크리스트

#### 1. 버전 업데이트

[app.json](app.json) 파일에서 버전 정보 수정:

```json
{
  "expo": {
    "version": "1.0.1",  // 버전 업데이트
    "ios": {
      "buildNumber": "2"  // iOS 빌드 번호 증가
    },
    "android": {
      "versionCode": 2    // Android 버전 코드 증가
    }
  }
}
```

**버전 규칙:**
- `version`: 사용자에게 보이는 버전 (1.0.0 → 1.0.1 → 1.1.0 → 2.0.0)
- `buildNumber` (iOS): 빌드마다 증가
- `versionCode` (Android): 빌드마다 증가

#### 2. 환경 변수 확인

[constants/Config.ts](constants/Config.ts)에서 프로덕션 설정 확인:

```typescript
export const Config = {
  API_HOST: 'https://haengwoonsaju.com',  // 프로덕션 URL로 변경
  IS_DEV_MODE: false,  // 프로덕션 모드
};
```

#### 3. 코드 품질 검사

```bash
# 린트 체크
npm run lint

# 타입 체크 (있는 경우)
npx tsc --noEmit

# 테스트 실행
npm test
```

### Android 프로덕션 빌드

#### 1단계: AAB 빌드

```bash
# Android App Bundle 빌드 (Google Play 업로드용)
eas build --platform android --profile production
```

#### 2단계: 빌드 다운로드

빌드 완료 후:
```bash
# Expo 대시보드에서 AAB 파일 다운로드
# 또는 CLI에서 제공하는 URL 사용
```

#### 3단계: Google Play Console 업로드

1. [Google Play Console](https://play.google.com/console) 접속
2. 앱 선택 → **프로덕션** (또는 **내부 테스트**/**비공개 테스트**)
3. **새 버전 만들기** 클릭
4. AAB 파일 업로드
5. 출시 노트 작성
6. **검토** → **프로덕션으로 출시** (또는 테스트 트랙으로 출시)

**출시 트랙 선택:**
- **내부 테스트**: 빠른 테스트 (최대 100명)
- **비공개 테스트**: 초대된 사용자만 (제한 없음)
- **공개 테스트**: 누구나 참여 가능
- **프로덕션**: 모든 사용자에게 공개

### iOS 프로덕션 빌드

#### 1단계: 프로덕션 빌드

```bash
# iOS 프로덕션 빌드
eas build --platform ios --profile production
```

#### 2단계: App Store Connect 제출

빌드 완료 후:
1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. 앱 선택 → **App Store** 탭
3. **+** 버튼으로 새 버전 생성
4. 앱 정보 입력:
   - 스크린샷 (필수)
   - 앱 설명
   - 키워드
   - 출시 노트
5. **빌드** 섹션에서 업로드된 빌드 선택
6. **심사용으로 제출**

**심사 시간:**
- 평균: 1-3일
- 최대: 7일

### 양 플랫폼 동시 빌드

```bash
# iOS + Android 동시 빌드
eas build --platform all --profile production
```

---

## 배포 및 테스트

### 테스트 배포 절차

#### Android

1. **내부 테스트 트랙 사용**
   ```bash
   # Preview 빌드 생성
   eas build --platform android --profile preview
   ```

2. **Google Play Console 설정**
   - AAB 업로드 → **내부 테스트** 트랙
   - 테스터 이메일 추가
   - 링크 공유

3. **테스터 참여**
   - 테스터가 이메일 링크 클릭
   - Google Play에서 앱 다운로드

#### iOS

1. **TestFlight 사용**
   ```bash
   # Preview 빌드 생성
   eas build --platform ios --profile preview
   ```

2. **App Store Connect 설정**
   - TestFlight 탭에서 빌드 확인 대기
   - 내부 테스터 그룹 생성
   - 테스터 Apple ID 초대

3. **테스터 참여**
   - TestFlight 앱 설치
   - 초대 수락 후 앱 다운로드

### 테스트 체크리스트

#### 기능 테스트
- [ ] 4개 탭 전환 (행운, 사주풀이, 오행샵, 마이)
- [ ] 웹뷰 로딩 정상 작동
- [ ] 인앱 구매 전체 플로우 (행운 탭)
- [ ] 이미지 저장 기능 (행운 탭)
- [ ] PDF 저장 기능 (행운 탭)
- [ ] 인스타그램 링크 외부 브라우저 열기
- [ ] 권한 요청 (사진 라이브러리)

#### 플랫폼별 테스트
- [ ] iOS: 다양한 기기 크기 (iPhone SE, 14, 14 Pro Max)
- [ ] Android: 다양한 기기 (Galaxy, Pixel 등)
- [ ] 다크모드 대응
- [ ] 키보드 처리
- [ ] 네트워크 오류 처리

#### 성능 테스트
- [ ] 앱 시작 시간
- [ ] 탭 전환 속도
- [ ] 웹뷰 로딩 속도
- [ ] 메모리 사용량
- [ ] 배터리 소모

---

## 빌드 프로필 설정

현재 [eas.json](eas.json)의 빌드 프로필:

### Preview (테스트용)
```json
{
  "preview": {
    "distribution": "internal",
    "android": {
      "buildType": "apk"
    },
    "ios": {
      "simulator": false
    }
  }
}
```

- **Android**: APK (빠른 설치)
- **iOS**: 실제 기기용 TestFlight 빌드
- **용도**: 내부 테스트

### Production (출시용)
```json
{
  "production": {
    "autoIncrement": true,
    "android": {
      "buildType": "app-bundle"
    }
  }
}
```

- **Android**: AAB (Google Play 필수)
- **iOS**: App Store 제출용
- **자동 버전 증가**: `autoIncrement: true`

---

## 문제 해결

### 일반적인 문제

#### 1. 빌드 실패: "No valid credentials"

**해결:**
```bash
# 자격증명 재설정
eas credentials
```

#### 2. iOS 빌드: Provisioning Profile 오류

**해결:**
```bash
# Apple 자격증명 재생성
eas build --platform ios --profile preview --clear-credentials
```

#### 3. Android 빌드: Keystore 오류

**해결:**
```bash
# Keystore 재생성
eas credentials
# Android → Production → Keystore → Remove and Create New
```

#### 4. 빌드 시간이 너무 오래 걸림

**해결:**
- 무료 플랜: 대기 시간 있을 수 있음
- 유료 플랜 고려 (우선 순위 빌드)

#### 5. WebView 로딩 오류

**확인 사항:**
- [constants/Config.ts](constants/Config.ts)의 URL 확인
- 네트워크 연결 확인
- CORS 설정 확인 (서버 측)

### 빌드 로그 확인

```bash
# 빌드 상태 확인
eas build:list

# 특정 빌드 로그 보기
eas build:view [BUILD_ID]
```

### 지원 리소스

- [Expo 문서](https://docs.expo.dev/)
- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [Expo Discord](https://chat.expo.dev/)
- [Expo Forums](https://forums.expo.dev/)

---

## 권장 워크플로우

### 개발 → 테스트 → 출시

```bash
# 1. 개발 완료 후 Preview 빌드
eas build --platform all --profile preview

# 2. 테스터 피드백 수집 및 수정

# 3. 버전 업데이트 (app.json)
# version: 1.0.0 → 1.0.1

# 4. Config 확인 (프로덕션 URL)

# 5. 프로덕션 빌드
eas build --platform all --profile production

# 6. 스토어 제출
```

### 지속적 배포 (CI/CD)

GitHub Actions 등을 사용한 자동화 가능:
```yaml
# .github/workflows/eas-build.yml 예시
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --profile production --non-interactive
```

---

## 체크리스트 요약

### 테스트 빌드 체크리스트
- [ ] `eas login` 완료
- [ ] `eas build --platform all --profile preview` 실행
- [ ] 빌드 완료 대기 (20-40분)
- [ ] TestFlight/Play Console에 업로드 확인
- [ ] 테스터 초대
- [ ] 테스트 수행 및 피드백 수집

### 프로덕션 빌드 체크리스트
- [ ] `app.json` 버전 업데이트
- [ ] `Config.ts` 프로덕션 URL 확인
- [ ] `npm run lint` 통과
- [ ] `eas build --platform all --profile production` 실행
- [ ] 빌드 완료 대기
- [ ] 스토어 메타데이터 준비 (스크린샷, 설명 등)
- [ ] App Store Connect/Play Console 제출
- [ ] 심사 대기 및 출시

---

## 버전 관리 전략

### 시맨틱 버저닝 (Semantic Versioning)

```
MAJOR.MINOR.PATCH
  |     |     |
  |     |     └─ 버그 수정
  |     └─────── 기능 추가 (하위 호환)
  └───────────── 중대한 변경 (하위 호환 X)
```

**예시:**
- `1.0.0`: 최초 출시
- `1.0.1`: 버그 수정
- `1.1.0`: 새 기능 추가
- `2.0.0`: 대규모 변경

### 빌드 번호 관리

- **iOS `buildNumber`**: 매 빌드마다 1씩 증가 (1, 2, 3, ...)
- **Android `versionCode`**: 매 빌드마다 1씩 증가 (1, 2, 3, ...)
- **Expo `autoIncrement`**: 자동 증가 (권장)

---

이제 빌드 및 배포를 시작할 수 있습니다! 🚀
