# EAS iOS 빌드 가이드

## app.json에서 버전 먼저 변경할 것!

---

# Development 빌드

## 명령어 실행

```bash
eas build --platform ios --profile development
```

## 빌드 과정 단계별 질문 및 답변 가이드

EAS Build 최초 실행 시 나타나는 실제 질문들을 순서대로 정리했습니다.

### 1. 계정 확인

**질문**: "Would you like to use the [your-account-name] account?"

- **답변**: `Y` (Yes)
- **설명**: 현재 로그인된 Expo 계정을 사용할지 확인합니다.

### 2. Apple ID 입력

**질문**: Apple ID 입력 요청

- **답변**: Apple Developer 계정 이메일 입력
- **설명**: iOS 앱 서명 및 배포를 위해 Apple Developer 계정 인증이 필요합니다.
- **참고**: 2단계 인증(2FA)이 활성화된 경우 인증 코드 입력도 요구됩니다.

### 3. 기기 등록 방법 선택

**질문**: "How would you like to register your devices?"

- **옵션**:
  1. Website - 기기 등록 URL을 생성하여 기기에서 직접 등록
  2. Input manually - UDID를 수동으로 입력
- **권장 답변**: Website (가장 편리한 방법)
- **설명**: Development 빌드를 설치할 iOS 기기를 등록하는 방법을 선택합니다.

### 4. Bundle Identifier 설정

**질문**: "What would you like your iOS bundle identifier to be?"

- **답변**: Enter 키를 눌러 기본값 사용 (앱의 `app.json`에 정의된 값)
- **현재 프로젝트 값**: `com.haengwoonsaju`
- **설명**: iOS 앱의 고유 식별자로, 한 번 설정하면 변경이 어렵습니다.

### 5. Apple 계정 로그인

**질문**: "Do you want to log in to your Apple account?"

- **답변**: `Y` (Yes)
- **설명**: 인증서 및 프로비저닝 프로파일 생성을 위해 Apple Developer 계정 인증을 진행합니다.
- **결과**: 새로운 Apple Distribution Certificate가 자동으로 생성됩니다.

### 6. Ad Hoc 빌드용 기기 선택

**질문**: "Select a device for ad hoc build"

- **답변**: 등록된 기기 중 선택 (하나 또는 여러 개)
- **설명**: 선택한 기기들에 나중에 빌드를 설치할 수 있습니다.
- **참고**: 모든 기기 선택 가능

### 7. 암호화 사용 여부 확인

**질문**: "iOS app only uses standard/exempt encryption?"

- **답변**: `Y` (Yes)
- **설명**:
  - HTTPS, TLS 등 표준 암호화만 사용하는 경우 Yes 선택
  - `ITSAppUsesNonExemptEncryption`를 `NO`로 설정하여 수출 규정 준수
  - 대부분의 일반 앱은 Yes가 적절합니다.

### 8. 빌드 시작

위 질문들에 모두 답변하면 자동으로 빌드가 시작됩니다.

- EAS 서버에서 클라우드 빌드가 진행됩니다.
- 빌드 진행 상황은 터미널과 Expo 웹 대시보드에서 확인할 수 있습니다.

## 빌드 완료 후

### 빌드 결과 확인

- 빌드가 성공하면 `.ipa` 파일 다운로드 링크가 제공됩니다.
- EAS 대시보드에서 빌드 상태와 로그를 확인할 수 있습니다.

### 설치 방법

1. **TestFlight 사용** (권장)

   - Apple Developer Console에서 TestFlight에 업로드
   - 테스터들에게 초대 링크 전송

2. **직접 설치**
   - `.ipa` 파일을 다운로드하여 Xcode를 통해 설치
   - 등록된 개발 기기에서만 설치 가능

## 주의사항

### Apple Developer 계정 요구사항

- **유료 계정 필요**: iOS 앱 빌드를 위해서는 연간 $99의 Apple Developer Program 가입이 필수
- **인증서 제한**: 개발 인증서는 계정당 제한된 개수만 생성 가능

### 빌드 시간

- 일반적으로 10-20분 소요
- 복잡한 네이티브 종속성이 있는 경우 더 오래 걸릴 수 있음

### 문제 해결

- 빌드 실패 시 EAS 대시보드에서 상세 로그 확인
- 인증서 관련 문제는 `eas credentials` 명령어로 재설정 가능

## 관련 명령어

```bash
# 빌드 상태 확인
eas build:list

# 빌드 취소
eas build:cancel [build-id]

# 인증서 관리
eas credentials

# 기기 등록 관리
eas device:list
eas device:create
```

## 추가 참고사항

- Development 빌드는 디버깅이 가능하고 개발 서버에 연결할 수 있습니다.
- 실제 앱스토어 배포를 위해서는 `--profile production` 사용을 권장합니다.
- 첫 번째 빌드 시에만 대부분의 설정 질문이 나타나며, 이후 빌드에서는 저장된 설정을 재사용합니다.

---

# Production 빌드 및 TestFlight 제출

## 1단계: Production 빌드 생성

### 명령어 실행

```bash
eas build --platform ios --profile production
```

### 빌드 과정

Production 빌드는 Development 빌드와 유사한 과정을 거치지만, 다음과 같은 차이점이 있습니다:

- **프로비저닝 프로파일**: App Store용 Distribution 프로파일 사용
- **인증서**: Apple Distribution Certificate 사용
- **최적화**: 코드가 최적화되고 디버깅 기능이 제거됨
- **서명**: App Store 배포용으로 서명됨

### 최초 실행 시 질문

Development 빌드를 먼저 실행했다면, 대부분의 인증 정보가 저장되어 있어 추가 질문이 거의 없습니다.

1. **계정 확인**
   - 기존 Expo 계정 사용
2. **Apple 계정 인증**

   - 이미 로그인되어 있으면 생략될 수 있음
   - 필요시 Apple ID와 2FA 코드 입력

3. **자동 빌드 시작**
   - 설정이 완료되면 자동으로 클라우드 빌드 시작

### 빌드 시간

- 일반적으로 15-25분 소요
- Production 빌드는 최적화 과정으로 인해 Development보다 약간 더 오래 걸림

## 2단계: TestFlight에 제출 (Submit)

빌드가 성공적으로 완료된 후, EAS Submit을 사용하여 TestFlight로 직접 제출할 수 있습니다.

### 명령어 실행

```bash
eas submit --platform ios
```

### 제출 과정 질문 및 답변

#### 1. 빌드 선택

**질문**: "Select a build to submit"

- **옵션**:
  1. 최근 완료된 빌드 목록이 표시됨
  2. 빌드 ID와 버전 정보 확인 가능
- **답변**: 제출하려는 Production 빌드 선택 (일반적으로 가장 최근 빌드)

#### 2. Apple ID 인증

**질문**: Apple ID 로그인 요청

- **답변**: Apple Developer 계정 이메일 입력
- **참고**: 2단계 인증 코드 입력 필요
- **설명**: App Store Connect API 접근을 위한 인증

#### 3. App-Specific Password 설정 (선택사항)

처음 제출 시 App-Specific Password 생성이 필요할 수 있습니다.

**생성 방법**:

1. [appleid.apple.com](https://appleid.apple.com) 접속
2. "Sign-In and Security" → "App-Specific Passwords" 선택
3. 새 비밀번호 생성 (예: "EAS Submit")
4. 생성된 비밀번호를 복사하여 입력

#### 4. ASC App ID 선택

**질문**: "Which ASC App ID would you like to use?"

- **답변**: App Store Connect에 등록된 앱 ID 선택
- **설명**:
  - 앱이 App Store Connect에 이미 등록되어 있어야 함
  - Bundle Identifier가 일치하는 앱이 자동으로 표시됨

#### 5. 제출 완료

위 단계가 완료되면 자동으로 TestFlight에 업로드가 시작됩니다.

### 제출 진행 상황

```
✔ Submitting to App Store Connect
✔ Successfully submitted to App Store Connect
```

- 업로드 시간: 일반적으로 5-10분 소요
- App Store Connect에서 처리 중: 추가 10-30분 소요

## 3단계: TestFlight에서 확인 및 배포

### App Store Connect에서 확인

1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. "My Apps" → 해당 앱 선택
3. "TestFlight" 탭 클릭

### 빌드 처리 상태

제출 후 App Store Connect에서 다음 단계를 거칩니다:

1. **Processing** (처리 중)

   - 빌드가 업로드되고 검증되는 단계
   - 10-30분 소요

2. **Waiting for Review** (심사 대기 중)

   - 첫 번째 버전이거나 major 변경사항이 있는 경우
   - Export Compliance 정보 제공 필요

3. **Ready to Submit** (제출 준비 완료)
   - TestFlight 테스터에게 배포 가능한 상태

### Export Compliance 처리

빌드 처리가 완료되면 "Provide Export Compliance Information" 단계가 나타날 수 있습니다.

**처리 방법**:

1. 빌드 옆의 "Missing Compliance" 경고 클릭
2. "Provide Export Compliance Information" 클릭
3. 질문에 답변:
   - "Is your app designed to use cryptography or does it contain or incorporate cryptography?"
   - **답변**: No (표준 HTTPS/TLS만 사용하는 경우)
4. "Start Internal Testing" 클릭

### 테스터에게 배포

#### 내부 테스터 (Internal Testers)

1. "TestFlight" 탭에서 "Internal Testing" 섹션으로 이동
2. 테스터 그룹 선택 또는 새로 생성
3. 테스터 추가 (최대 100명, Apple Developer 계정 필요)
4. 빌드 선택 및 배포
5. 테스터들은 즉시 TestFlight 앱에서 설치 가능

#### 외부 테스터 (External Testers)

1. "TestFlight" 탭에서 "External Testing" 섹션으로 이동
2. 테스터 그룹 생성
3. 테스터 추가 (최대 10,000명, Apple Developer 계정 불필요)
4. 빌드 선택 및 Apple 심사 제출
5. 심사 승인 후 (1-2일 소요) 테스터들이 설치 가능

## 한 번에 빌드 & 제출하기

빌드와 제출을 한 명령어로 실행할 수도 있습니다:

```bash
eas build --platform ios --profile production --auto-submit
```

- `--auto-submit` 플래그를 사용하면 빌드 완료 후 자동으로 제출 프로세스 시작
- 첫 실행 시 Apple ID와 App-Specific Password 설정 필요
- 이후 실행에서는 저장된 인증 정보 사용

## 주의사항

### 버전 관리

- TestFlight에 제출하기 전 `app.json`에서 버전과 빌드 넘버 업데이트 필수
- 동일한 버전/빌드 넘버로는 재제출 불가

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

### 앱스토어 등록

- TestFlight 제출 전에 App Store Connect에서 앱이 생성되어 있어야 함
- Bundle Identifier가 일치해야 함
- 앱 정보, 스크린샷, 개인정보 처리방침 등은 나중에 추가 가능

### App-Specific Password 저장

EAS Submit은 Apple ID 인증 정보를 안전하게 저장합니다:

- 비밀번호는 암호화되어 Expo 서버에 저장
- 이후 제출 시 재입력 불필요
- 보안을 위해 App-Specific Password 사용 권장 (일반 Apple 비밀번호 X)

### 제출 실패 시

일반적인 문제와 해결책:

1. **인증 실패**

   - App-Specific Password 재생성
   - `eas credentials` 명령어로 인증 정보 재설정

2. **Bundle Identifier 불일치**

   - App Store Connect의 Bundle ID와 `app.json`의 Bundle ID 확인
   - 일치하지 않으면 앱 생성 또는 `app.json` 수정

3. **빌드 검증 실패**
   - EAS 대시보드에서 빌드 로그 확인
   - 인증서 및 프로비저닝 프로파일 재생성 필요할 수 있음

## 관련 명령어

```bash
# Production 빌드 생성
eas build --platform ios --profile production

# TestFlight에 제출
eas submit --platform ios

# 빌드 & 제출 동시 실행
eas build --platform ios --profile production --auto-submit

# 제출 상태 확인
eas submit --platform ios --status

# 인증 정보 관리
eas credentials

# 제출 내역 확인
eas submit:list
```

## TestFlight 테스팅 Best Practices

### 릴리스 노트 작성

각 빌드에 대한 명확한 릴리스 노트를 작성하여 테스터들에게 무엇을 테스트해야 하는지 안내:

```
버전 1.0.1
- 새로운 기능 추가: 사용자 프로필 편집
- 버그 수정: 로그인 화면 크래시 문제 해결
- 성능 개선: 앱 로딩 속도 향상

테스트 요청사항:
- 프로필 편집 기능 정상 동작 확인
- 다양한 네트워크 환경에서 안정성 확인
```

### 테스터 피드백 수집

- TestFlight 앱 내 스크린샷 및 피드백 기능 활용
- 크래시 리포트 자동 수집
- App Store Connect에서 피드백 확인 및 관리

### 점진적 배포

1. 내부 테스터에게 먼저 배포
2. 주요 버그 수정 후 외부 테스터 그룹 일부에 배포
3. 안정성 확인 후 전체 외부 테스터에 배포
4. 최종 검증 후 App Store 제출

## 참고 링크

- [EAS Build 공식 문서](https://docs.expo.dev/build/introduction/)
- [EAS Submit 공식 문서](https://docs.expo.dev/submit/introduction/)
- [TestFlight 가이드](https://developer.apple.com/testflight/)
- [App Store Connect](https://appstoreconnect.apple.com)
