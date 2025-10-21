# Android 16KB 메모리 페이지 크기 지원 가이드

## 문제 요약

Google Play가 2025년 11월 1일부터 **16KB 메모리 페이지 크기**를 지원하지 않는 앱 업데이트 출시를 차단한다는 공지입니다.

---

## 상세 설명

### 1. 메모리 페이지 크기란?

**메모리 페이지**는 운영체제가 메모리를 관리하는 기본 단위입니다.

- **기존**: Android는 주로 **4KB 페이지 크기** 사용
- **변경**: Android 15부터 일부 기기에서 **16KB 페이지 크기** 사용
- **이유**: 성능 향상 및 최신 하드웨어 지원

### 2. 왜 문제가 되는가?

앱이 4KB 페이지 크기에만 최적화되어 있으면:

- 16KB 페이지 크기 기기에서 **크래시** 발생 가능
- **네이티브 라이브러리**(NDK, C/C++ 코드)가 잘못된 메모리 정렬 가정
- **성능 저하** 또는 **메모리 오류** 발생

### 3. 영향을 받는 앱

주로 다음을 사용하는 앱이 영향을 받습니다:

- **NDK**(Native Development Kit)로 빌드된 네이티브 코드
- **서드파티 네이티브 라이브러리** (C/C++로 작성된 SDK)
- **게임 엔진** (Unity, Unreal Engine 등)
- **크로스 플랫폼 프레임워크** (React Native, Flutter 등)

### 4. React Native / Expo 앱의 경우

**행운사주 앱은 Expo React Native로 개발**되었으므로:

- React Native는 내부적으로 **많은 네이티브 라이브러리** 사용
- **Hermes 엔진**, **JSC**, **네이티브 모듈** 등이 영향을 받을 수 있음
- **서드파티 라이브러리** (`react-native-iap`, `react-native-webview` 등)도 영향 가능

---

## 현재 상황

| 항목 | 내용 |
|------|------|
| **공지 날짜** | 2025년 8월 28일 |
| **마감 기한** | 2025년 11월 1일 |
| **남은 기간** | 16일 |
| **현재 상태** | 최신 프로덕션 버전이 16KB를 지원하지 않음 |
| **영향** | 기한 이후 앱 업데이트 출시 불가 |

⚠️ **중요**: 현재 출시된 앱은 계속 작동하지만, **새 업데이트를 출시할 수 없게** 됩니다.

---

## 해결 방법

### 단계 1: Expo SDK 및 의존성 업데이트

현재 프로젝트는 **Expo SDK 52**를 사용 중입니다. 최신 버전으로 업데이트가 필요할 수 있습니다.

```bash
# Expo CLI 업데이트
npm install -g expo-cli@latest

# 프로젝트 의존성 업데이트
npx expo install --fix

# React Native 및 Expo 패키지 최신화
npx expo-doctor
```

### 단계 2: EAS Build 설정 업데이트

`eas.json` 파일에서 최신 Android 빌드 설정 적용:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradle": {
          "buildOptions": {
            "jvmArgs": ["-XX:MaxHeapSize=8g"]
          }
        }
      }
    }
  }
}
```

### 단계 3: app.json 설정 확인

`app.json`에서 Android 빌드 타겟 확인:

```json
{
  "expo": {
    "android": {
      "targetSdkVersion": 35,  // Android 15 이상
      "compileSdkVersion": 35
    }
  }
}
```

### 단계 4: NDK 버전 확인

네이티브 의존성이 최신 NDK를 사용하는지 확인:

```json
{
  "build": {
    "production": {
      "android": {
        "ndk": "26.1.10909125"  // 최신 NDK 버전
      }
    }
  }
}
```

### 단계 5: 서드파티 라이브러리 업데이트

특히 네이티브 모듈을 사용하는 라이브러리 업데이트:

```bash
# 주요 네이티브 라이브러리 업데이트
npm update react-native-iap
npm update react-native-webview
npm update expo-media-library
npm update expo-file-system
```

### 단계 6: 16KB 지원 테스트 빌드

```bash
# 프리뷰 빌드로 테스트
eas build --platform android --profile preview

# 빌드 완료 후 Google Play Console에서 16KB 지원 여부 확인
```

### 단계 7: Google Play Console에서 확인

1. **Play Console** → **출시** → **출시 개요**
2. 업로드한 App Bundle 선택
3. **"16KB 페이지 크기 지원"** 상태 확인
4. ✅ 표시가 있으면 지원됨

---

## 테스트 방법

### 1. Android Emulator에서 테스트

```bash
# Android Studio에서 16KB 페이지 크기 에뮬레이터 생성
# AVD Manager → Create Virtual Device
# System Image: API 35 (16KB 지원 이미지 선택)
```

### 2. 실제 기기에서 테스트

16KB 페이지 크기를 사용하는 기기:
- **Pixel 9 시리즈** (Android 15)
- 기타 Android 15+ 최신 기기

---

## Expo 특정 해결책

Expo는 이미 16KB 페이지 크기 지원을 위해 업데이트 중입니다.

### 확인 사항

1. **Expo SDK 최신 버전 사용**
   - SDK 52 이상 권장
   - `npx expo-doctor`로 호환성 확인

2. **EAS Build 최신 버전 사용**
   ```bash
   npm install -g eas-cli@latest
   ```

3. **빌드 로그 확인**
   ```bash
   eas build:view [BUILD_ID]
   ```
   - 16KB 관련 경고나 에러 확인

---

## 예상 문제 및 해결

### 문제 1: 네이티브 라이브러리 호환성

**증상**: 특정 라이브러리가 16KB에서 크래시

**해결**:
```bash
# 문제가 되는 라이브러리 최신 버전으로 업데이트
npm update [LIBRARY_NAME]

# 또는 대체 라이브러리 찾기
```

### 문제 2: Hermes 엔진 이슈

**증상**: Hermes 엔진 관련 크래시

**해결**:
```json
// app.json
{
  "expo": {
    "android": {
      "jsEngine": "hermes",  // 최신 Hermes 사용
      "enableHermes": true
    }
  }
}
```

### 문제 3: 빌드 실패

**증상**: EAS 빌드가 실패

**해결**:
```bash
# 캐시 클리어 후 재빌드
eas build --platform android --profile production --clear-cache

# 로컬에서 빌드 테스트
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

---

## 권장 조치 계획

### 우선순위 1 (즉시 - 16일 내)

1. ✅ **의존성 업데이트**
   - Expo SDK 최신화
   - 모든 네이티브 라이브러리 업데이트

2. ✅ **테스트 빌드**
   - Preview 빌드 생성
   - Google Play Console에서 16KB 지원 확인

3. ✅ **프로덕션 빌드**
   - 16KB 지원 확인 후 프로덕션 배포

### 우선순위 2 (테스트)

4. 📱 **실제 기기 테스트**
   - Android 15 기기에서 테스트
   - 주요 기능 검증 (인앱구매, WebView 등)

5. 🔍 **성능 모니터링**
   - Crashlytics 설정
   - 16KB 기기에서의 성능 확인

---

## 단계별 실행 가이드

### Step 1: 환경 업데이트

```bash
# 1. Expo CLI 업데이트
npm install -g expo-cli@latest

# 2. EAS CLI 업데이트
npm install -g eas-cli@latest

# 3. 프로젝트 의존성 검사
cd /Users/giban/Project/project/haengwoonsaju/workspace/haengwoonsaju-app
npx expo-doctor
```

### Step 2: 의존성 업데이트

```bash
# 1. Expo 의존성 자동 수정
npx expo install --fix

# 2. 주요 라이브러리 수동 업데이트
npm update react-native-iap
npm update react-native-webview
npm update expo-media-library
npm update expo-file-system
npm update expo-print

# 3. package.json 확인
npm outdated
```

### Step 3: 설정 파일 확인

#### app.json 확인 및 수정

```bash
# 현재 설정 확인
cat app.json | grep -A 5 "android"
```

필요시 다음과 같이 수정:

```json
{
  "expo": {
    "android": {
      "package": "com.haengwoonsaju",
      "versionCode": 4,
      "targetSdkVersion": 35,
      "compileSdkVersion": 35,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

#### eas.json 확인 및 수정

```bash
# 현재 설정 확인
cat eas.json
```

필요시 다음과 같이 수정:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle",
        "gradle": {
          "buildOptions": {
            "jvmArgs": ["-XX:MaxHeapSize=8g"]
          }
        }
      }
    }
  }
}
```

### Step 4: 테스트 빌드

```bash
# 1. Preview 빌드 생성 (16KB 지원 테스트)
eas build --platform android --profile preview

# 2. 빌드 상태 확인
eas build:list

# 3. 빌드 완료 후 APK 다운로드 및 테스트
```

### Step 5: Google Play Console 확인

1. [Google Play Console](https://play.google.com/console/) 접속
2. **행운사주** 앱 선택
3. **출시** → **프로덕션** (또는 테스트 트랙)
4. 새 릴리스 만들기
5. 빌드된 AAB 파일 업로드
6. **16KB 페이지 크기 지원** 상태 확인
   - ✅ 녹색 체크: 지원됨
   - ⚠️ 경고 표시: 미지원 (다시 빌드 필요)

### Step 6: 프로덕션 빌드 및 배포

16KB 지원이 확인되면:

```bash
# 프로덕션 빌드
eas build --platform android --profile production

# 빌드 완료 후 Google Play Console에 업로드
```

---

## 체크리스트

### 사전 준비
- [ ] Expo CLI 최신 버전 설치
- [ ] EAS CLI 최신 버전 설치
- [ ] `npx expo-doctor` 실행하여 문제 확인

### 설정 업데이트
- [ ] `app.json`에서 `targetSdkVersion: 35` 설정
- [ ] `eas.json`에서 Android 빌드 옵션 추가
- [ ] 모든 네이티브 라이브러리 최신 버전으로 업데이트

### 빌드 및 테스트
- [ ] Preview 빌드 생성
- [ ] APK를 실제 기기에서 테스트
- [ ] Google Play Console에서 16KB 지원 확인

### 배포
- [ ] 프로덕션 빌드 생성
- [ ] AAB 파일 Google Play Console에 업로드
- [ ] 16KB 지원 최종 확인
- [ ] 프로덕션 출시

---

## 참고 자료

### Google 공식 문서
- [16KB 페이지 크기 기기 지원 가이드](https://developer.android.com/guide/practices/page-sizes)
- [Play 앱 준비하기](https://support.google.com/googleplay/android-developer/answer/14403168)
- [16KB 환경에서 앱 테스트하기](https://developer.android.com/guide/practices/page-sizes#test-16kb)

### Expo 관련
- [Expo SDK Release Notes](https://docs.expo.dev/versions/latest/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Expo Android Build Configuration](https://docs.expo.dev/build-reference/android-builds/)

### 테스트 도구
- [Android Studio - 16KB 에뮬레이터 설정](https://developer.android.com/studio/run/emulator)
- [Android 스튜디오를 통한 16KB 페이지 크기 전환](https://android-developers.googleblog.com/2024/04/preparing-your-app-for-page-sizes.html)

---

## FAQ

### Q1: 기존 앱은 어떻게 되나요?
**A**: 현재 Google Play에 출시된 앱은 계속 작동합니다. 다만 **2025년 11월 1일 이후에는 새로운 업데이트를 출시할 수 없습니다**.

### Q2: Expo SDK 52면 자동으로 지원되나요?
**A**: Expo SDK 52는 16KB 지원을 포함하고 있지만, **의존성 라이브러리**도 모두 최신 버전이어야 합니다. `npx expo install --fix`로 확인하세요.

### Q3: 어떻게 확인하나요?
**A**: Google Play Console에 AAB 파일을 업로드하면 자동으로 **16KB 페이지 크기 지원 여부**를 표시해줍니다.

### Q4: Preview 빌드로 테스트하면 되나요?
**A**: 네, Preview 빌드로 먼저 테스트하고 Google Play Console의 내부 테스트 트랙에 업로드하여 16KB 지원을 확인할 수 있습니다.

### Q5: 업데이트 후 기존 사용자에게 영향은?
**A**: 없습니다. 16KB 지원은 하위 호환성이 있어 4KB 기기에서도 정상 작동합니다.

---

## 요약

| 항목 | 내용 |
|------|------|
| **문제** | Android 15+ 16KB 메모리 페이지 크기 미지원 |
| **마감** | 2025년 11월 1일 (16일 남음) |
| **영향** | 기한 후 앱 업데이트 출시 불가 |
| **해결** | Expo SDK + 의존성 업데이트 + 새 빌드 배포 |
| **검증** | Google Play Console에서 16KB 지원 확인 |
| **긴급도** | 🔴 높음 - 즉시 조치 필요 |

---

## 마감 타임라인

```
현재 (10월 16일)
  ↓
  ├─ [1-2일] 의존성 업데이트 및 설정 수정
  ├─ [1일] Preview 빌드 및 테스트
  ├─ [1일] Google Play Console 확인
  ├─ [1일] 프로덕션 빌드
  └─ [1일] Google Play 출시
  ↓
목표 완료일 (10월 22일)
  ↓
여유 기간 (10일)
  ↓
최종 마감 (11월 1일) ⚠️
```

---

## 다음 단계

1. **즉시**: `npx expo-doctor` 실행하여 현재 상태 확인
2. **오늘**: 의존성 업데이트 및 설정 수정
3. **내일**: Preview 빌드 생성 및 16KB 지원 확인
4. **3일 이내**: 프로덕션 빌드 배포

---

**작성일**: 2025-10-16
**최종 수정일**: 2025-10-16
**담당자**: 개발팀
**우선순위**: 🔴 긴급
