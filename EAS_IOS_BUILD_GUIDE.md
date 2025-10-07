# EAS iOS Development 빌드 가이드

## app.json에서 버전 먼저 변경할 것!

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
