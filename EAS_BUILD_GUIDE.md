# EAS 빌드 가이드

이 문서는 행운사주 앱의 EAS 빌드 프로세스를 단계별로 설명합니다.

## 빌드 순서

1. iOS 테스트 빌드 (Development)
2. iOS 프로덕션 빌드 (TestFlight)
3. Android 테스트 빌드 (Preview)
4. Android 프로덕션 빌드 (Google Play)

---

## 1. iOS 테스트 빌드 (Development)

### 용도
- 개발 중 테스트
- 실제 기기에서 개발 버전 테스트

### 빌드 명령어

```bash
eas build --platform ios --profile development
```

### 특징
- 개발자 기기에 직접 설치
- 디버깅 가능
- Hot reload 지원

### 설치 방법
빌드 완료 후 제공되는 QR 코드를 스캔하거나 EAS 대시보드에서 다운로드

---

## 2. iOS 프로덕션 빌드 (TestFlight)

### 용도
- 내부 테스터/베타 테스터 배포
- App Store 제출 전 최종 테스트
- App Store 제출용 빌드

### 빌드 명령어

```bash
eas build --platform ios --profile production
```

### 특징
- TestFlight를 통한 배포
- App Store와 동일한 환경
- 최대 100명의 내부 테스터, 10,000명의 외부 테스터

### TestFlight 제출 명령어

```bash
# 빌드와 동시에 자동 제출
eas build --platform ios --profile production --auto-submit

# 또는 빌드 후 수동 제출
eas submit --platform ios
```

### 배포 프로세스
1. 빌드 완료 후 `.ipa` 파일 생성
2. `eas submit --platform ios` 명령으로 App Store Connect에 업로드
3. TestFlight에서 자동 처리 대기 (보통 5-10분)
4. TestFlight에서 테스터 초대
5. 또는 App Store 심사 제출

---

## 3. Android 테스트 빌드 (Preview)

### 용도
- 내부 테스트
- QA 팀 배포
- 스토어 제출 전 검증

### 빌드 명령어

```bash
eas build --platform android --profile preview
```

### 특징
- `.apk` 또는 `.aab` 파일 생성
- 직접 설치 가능
- 내부 배포용

### 설치 방법
빌드 완료 후 제공되는 다운로드 링크에서 APK 다운로드 및 설치

---

## 4. Android 프로덕션 빌드 (Google Play)

### 용도
- Google Play 스토어 제출
- 프로덕션 배포

### 빌드 명령어

```bash
eas build --platform android --profile production
```

### 특징
- `.aab` (Android App Bundle) 형식
- Google Play Console에 업로드
- 최적화된 배포

### Google Play 제출 명령어

```bash
# 빌드와 동시에 자동 제출
eas build --platform android --profile production --auto-submit

# 또는 빌드 후 수동 제출
eas submit --platform android
```

### 배포 프로세스
1. 빌드 완료 후 `.aab` 파일 생성
2. `eas submit --platform android` 명령으로 Google Play Console에 업로드
3. Google Play Console에서 트랙 선택 (내부 테스트, 비공개, 공개, 프로덕션)
4. 내부 테스트 → 비공개 테스트 → 공개 테스트 → 프로덕션 순으로 진행

---

## 통합 빌드 명령어

### 플랫폼별 동시 빌드

```bash
# iOS Development + Android Preview
eas build --platform all --profile preview

# iOS Production + Android Production
eas build --platform all --profile production
```

---

## 빌드 상태 확인

### 빌드 목록 조회

```bash
eas build:list
```

### 특정 빌드 상태 확인

```bash
eas build:view [BUILD_ID]
```

### 웹 대시보드
[https://expo.dev/accounts/[ACCOUNT]/projects/haengwoonsaju-app/builds](https://expo.dev)

---

## 빌드 프로필 설정

빌드 프로필은 `eas.json` 파일에 정의되어 있습니다:

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

---

## 빌드 전 체크리스트

### 공통
- [ ] 코드 변경사항 커밋 완료
- [ ] `app.json`의 버전 정보 확인
- [ ] 환경 변수 설정 확인 (`Config.ts`)

### iOS
- [ ] Apple Developer 계정 활성화
- [ ] Certificates & Provisioning Profiles 유효성 확인
- [ ] App Store Connect 접근 권한 확인

### Android
- [ ] Google Play Console 접근 권한 확인
- [ ] Keystore 유효성 확인 (프로덕션)
- [ ] 패키지명 확인 (`com.haengwoonsaju`)

---

## 문제 해결

### 빌드 실패 시

```bash
# 빌드 로그 확인
eas build:view [BUILD_ID]

# 캐시 클리어 후 재빌드
eas build --platform [ios/android] --profile [PROFILE] --clear-cache
```

### 인증서 문제 (iOS)

```bash
# 인증서 재생성
eas credentials
```

### Keystore 문제 (Android)

```bash
# Keystore 관리
eas credentials
```

---

## 빌드 순서 요약

```
1. iOS Development    → eas build --platform ios --profile development
2. iOS Production     → eas build --platform ios --profile production
                      → eas submit --platform ios (TestFlight 제출)
3. Android Preview    → eas build --platform android --profile preview
4. Android Production → eas build --platform android --profile production
                      → eas submit --platform android (Google Play 제출)
```

---

## 스토어 제출 (Submit)

### iOS - TestFlight/App Store 제출

#### 옵션 1: 빌드와 동시에 자동 제출

```bash
eas build --platform ios --profile production --auto-submit
```

#### 옵션 2: 빌드 후 수동 제출

```bash
# 1. 먼저 빌드
eas build --platform ios --profile production

# 2. 빌드 완료 후 제출
eas submit --platform ios

# 3. 또는 특정 빌드 ID로 제출
eas submit --platform ios --id [BUILD_ID]

# 4. 로컬 .ipa 파일로 제출
eas submit --platform ios --path ./path/to/app.ipa
```

#### 제출 후 확인

1. [App Store Connect](https://appstoreconnect.apple.com/) 접속
2. **앱** → **행운사주** 선택
3. **TestFlight** 탭에서 빌드 확인
4. 처리 중 → 테스트 준비됨 (보통 5-10분 소요)

### Android - Google Play Console 제출

#### 옵션 1: 빌드와 동시에 자동 제출

```bash
eas build --platform android --profile production --auto-submit
```

#### 옵션 2: 빌드 후 수동 제출

```bash
# 1. 먼저 빌드
eas build --platform android --profile production

# 2. 빌드 완료 후 제출
eas submit --platform android

# 3. 특정 트랙으로 제출
eas submit --platform android --track internal  # 내부 테스트
eas submit --platform android --track alpha     # 비공개 테스트
eas submit --platform android --track beta      # 공개 테스트
eas submit --platform android --track production # 프로덕션

# 4. 특정 빌드 ID로 제출
eas submit --platform android --id [BUILD_ID]

# 5. 로컬 .aab 파일로 제출
eas submit --platform android --path ./path/to/app.aab
```

#### 제출 후 확인

1. [Google Play Console](https://play.google.com/console/) 접속
2. **행운사주** 앱 선택
3. **출시** → 해당 트랙(내부 테스트/프로덕션 등) 확인
4. 검토 대기 중 → 출시됨

### 양쪽 플랫폼 동시 제출

```bash
# 빌드와 동시에 양쪽 모두 제출
eas build --platform all --profile production --auto-submit
```

### Submit 설정 (eas.json)

`eas.json`에 제출 설정을 추가할 수 있습니다:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Submit 전 체크리스트

#### iOS
- [ ] Apple ID 로그인 정보 준비
- [ ] App Store Connect 앱 생성 완료
- [ ] 2단계 인증 설정 (필수)
- [ ] App-Specific Password 생성 (권장)

#### Android
- [ ] Google Play Console 서비스 계정 생성
- [ ] API 액세스 권한 설정
- [ ] 서비스 계정 키 JSON 파일 다운로드
- [ ] 최소 1번 수동으로 APK/AAB 업로드 완료 (초회 설정)

### 제출 상태 확인

```bash
# 제출 내역 조회
eas submit:list

# 특정 제출 상태 확인
eas submit:view [SUBMISSION_ID]
```

---

## 전체 워크플로우 예시

### iOS 전체 프로세스

```bash
# 1. 빌드 (자동 버전 증가)
eas build --platform ios --profile production

# 2. TestFlight 제출
eas submit --platform ios

# 3. TestFlight에서 테스트
# - App Store Connect에서 테스터 초대
# - 내부/외부 테스트 진행

# 4. App Store 심사 제출
# - App Store Connect에서 수동으로 심사 제출
```

### Android 전체 프로세스

```bash
# 1. 빌드 (자동 버전 증가)
eas build --platform android --profile production

# 2. 내부 테스트 트랙에 제출
eas submit --platform android --track internal

# 3. 내부 테스트 통과 후 프로덕션 트랙으로 승급
eas submit --platform android --track production

# 4. Google Play Console에서 출시 승인
```

### 원스텝 배포 (빌드 + 제출)

```bash
# iOS: 빌드 후 즉시 TestFlight 제출
eas build --platform ios --profile production --auto-submit

# Android: 빌드 후 즉시 내부 테스트 제출
eas build --platform android --profile production --auto-submit

# 양쪽 모두 빌드 + 제출
eas build --platform all --profile production --auto-submit
```

---

## 참고 문서

- [EAS Build 공식 문서](https://docs.expo.dev/build/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)
- [프로젝트 BUILD_DEPLOYMENT_GUIDE.md](BUILD_DEPLOYMENT_GUIDE.md) (상세 가이드)
