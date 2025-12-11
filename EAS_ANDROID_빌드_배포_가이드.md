# EAS Android 빌드 및 Play Console 배포 가이드

## app.json에서 버전 먼저 변경할 것!

---

# 1단계: Production 빌드 생성

## 명령어 실행

```bash
eas build --platform android --profile production
```

## 빌드 결과

- 빌드가 완료되면 `.aab` (Android App Bundle) 파일이 생성됩니다.
- EAS 대시보드 또는 터미널에서 다운로드 링크 확인 가능

## 빌드 파일 다운로드

빌드 완료 후 다음 방법으로 `.aab` 파일을 다운로드:

### 방법 1: 터미널 링크 사용
빌드 완료 시 터미널에 표시되는 다운로드 링크 클릭

### 방법 2: EAS 대시보드
1. [expo.dev](https://expo.dev) 접속
2. 프로젝트 선택 → Builds 탭
3. 해당 빌드의 "Download" 버튼 클릭

### 방법 3: CLI 명령어
```bash
# 최근 빌드 목록 확인
eas build:list --platform android

# 특정 빌드 다운로드 (빌드 ID 필요)
eas build:download --id [BUILD_ID]
```

---

# 2단계: Play Console에 업로드

## Play Console 접속

1. [Google Play Console](https://play.google.com/console) 접속
2. 해당 앱 선택

## 프로덕션으로 바로 배포하기

**네, 프로덕션으로 바로 배포 가능합니다!**

공개 테스트를 거치지 않고 바로 프로덕션 트랙에 업로드할 수 있습니다.

### 프로덕션 직접 배포 방법

1. Play Console → 앱 선택
2. 왼쪽 메뉴: **프로덕션** (Release → Production)
3. **"새 버전 만들기"** 클릭
4. **"App Bundle 업로드"** 영역에 `.aab` 파일 드래그 앤 드롭
5. 출시 노트 작성
6. **"버전 검토"** → **"프로덕션 트랙에 출시 시작"**

### 출시 상태

- **검토 중**: Google에서 앱 검토 (보통 몇 시간 ~ 며칠)
- **출시 준비됨**: 검토 완료, 출시 대기
- **출시됨**: Play 스토어에 반영됨

---

# 트랙별 배포 옵션

Play Console에서는 여러 트랙을 제공합니다:

| 트랙 | 용도 | 심사 | 공개 범위 |
|------|------|------|-----------|
| **내부 테스트** | 개발팀 내부 테스트 | 없음 | 초대된 테스터만 |
| **비공개 테스트** | 제한된 사용자 테스트 | 없음 | 초대된 테스터만 |
| **공개 테스트** | 베타 테스트 | 필요 | 누구나 참여 가능 |
| **프로덕션** | 정식 출시 | 필요 | 모든 사용자 |

## 각 트랙 사용 시나리오

### 내부 테스트 (권장: 빠른 테스트)
- 심사 없이 즉시 설치 가능
- 최대 100명 테스터
- 빌드 후 몇 분 내 설치 가능

```
Play Console → 테스트 → 내부 테스트 → 새 버전 만들기
```

### 공개 테스트
- Google 심사 필요
- Play 스토어에서 "베타 테스터 되기" 버튼 노출
- 프로덕션 출시 전 대규모 테스트에 적합

```
Play Console → 테스트 → 공개 테스트 → 새 버전 만들기
```

### 프로덕션 (정식 출시)
- Google 심사 필요
- 모든 사용자에게 공개
- 단계적 출시 가능 (5% → 20% → 100%)

```
Play Console → 프로덕션 → 새 버전 만들기
```

---

# 상세 업로드 절차 (프로덕션)

## Step 1: 새 버전 만들기

1. Play Console → 앱 대시보드
2. 왼쪽 메뉴: **"프로덕션"** 클릭
3. 오른쪽 상단: **"새 버전 만들기"** 버튼 클릭

## Step 2: App Bundle 업로드

1. **"App Bundle"** 섹션에서 파일 업로드 영역 확인
2. 다운로드한 `.aab` 파일을 드래그 앤 드롭
3. 업로드 완료까지 대기 (파일 크기에 따라 1-5분)

## Step 3: 출시 세부정보 작성

### 버전 이름
- 자동으로 입력됨 (app.json의 version)
- 필요시 수정 가능

### 출시 노트
각 언어별로 작성 (최소 한국어/영어):

```
한국어 (ko-KR):
- OTA 업데이트 즉시 적용 기능 추가
- 웹뷰 성능 개선
- 버그 수정

English (en-US):
- Added instant OTA update feature
- Improved webview performance
- Bug fixes
```

## Step 4: 버전 검토

1. **"버전 검토"** 버튼 클릭
2. 경고나 오류가 있으면 수정
3. 모든 항목 확인

## Step 5: 출시 시작

1. **"프로덕션 트랙에 출시 시작"** 버튼 클릭
2. 확인 대화상자에서 **"출시"** 선택

### 단계적 출시 옵션

프로덕션 출시 시 단계적 배포 가능:
- **5%** → **20%** → **50%** → **100%**
- 문제 발생 시 출시 중단 가능
- 권장: 첫 날은 5-20%로 시작

---

# 심사 및 출시 일정

## 심사 소요 시간

| 상황 | 예상 시간 |
|------|-----------|
| 신규 앱 첫 출시 | 1-7일 |
| 기존 앱 업데이트 | 몇 시간 ~ 2일 |
| 정책 위반 이력 있음 | 3-7일 이상 |

## 심사 상태 확인

Play Console → 앱 대시보드 → 상단의 상태 표시:

- **검토 중**: Google에서 심사 진행 중
- **게시됨**: 심사 완료, Play 스토어에 반영됨
- **거부됨**: 정책 위반으로 거부 (이유 확인 필요)

---

# 문제 해결

## 업로드 실패

### "버전 코드가 이미 사용됨"
```
해결: app.json의 android.versionCode 증가
현재 프로젝트는 eas.json에서 autoIncrement: true 설정되어 있어 자동 증가됨
```

### "서명 키 불일치"
```
해결: 기존 앱과 동일한 키 사용 필요
EAS에서 관리하는 키 사용 시 자동으로 처리됨
```

### "타겟 SDK 버전이 낮음"
```
해결: app.json에서 targetSdkVersion 업데이트
현재 Google 요구사항: API 34 이상
```

## 심사 거부

### 일반적인 거부 사유
1. **메타데이터 정책 위반**: 스크린샷, 설명 수정
2. **기능 미작동**: 앱 기능 테스트 필요
3. **개인정보처리방침 누락**: 링크 추가 필요
4. **권한 과다 요청**: 필요 없는 권한 제거

---

# 관련 명령어

```bash
# Android Production 빌드
eas build --platform android --profile production

# 빌드 목록 확인
eas build:list --platform android

# 특정 빌드 다운로드
eas build:download --id [BUILD_ID]

# 빌드 상태 확인
eas build:view [BUILD_ID]

# 인증서 확인
eas credentials --platform android
```

---

# 자동 제출 (선택사항)

EAS Submit으로 Play Console에 자동 업로드도 가능하지만,
현재 프로젝트는 **수동 업로드 방식**을 사용합니다.

### 수동 업로드의 장점
- 출시 노트를 Play Console에서 직접 작성
- 단계적 출시 비율 직접 설정
- 스크린샷, 설명 등 스토어 정보 동시 업데이트 용이

---

# 빠른 참조: 배포 체크리스트

- [ ] app.json 버전 확인/업데이트
- [ ] `eas build --platform android --profile production` 실행
- [ ] 빌드 완료 후 `.aab` 파일 다운로드
- [ ] Play Console 접속
- [ ] 프로덕션 → 새 버전 만들기
- [ ] `.aab` 파일 업로드
- [ ] 출시 노트 작성 (한국어/영어)
- [ ] 버전 검토
- [ ] 프로덕션 트랙에 출시 시작
- [ ] 심사 상태 모니터링

---

# 참고 링크

- [Google Play Console](https://play.google.com/console)
- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [Play Console 도움말](https://support.google.com/googleplay/android-developer)
- [앱 출시 가이드](https://developer.android.com/distribute/best-practices/launch)
